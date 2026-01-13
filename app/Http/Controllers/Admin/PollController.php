<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePollRequest;
use App\Http\Requests\Admin\UpdatePollRequest;
use App\Mail\PollInvitation;
use App\Models\Department;
use App\Models\Poll;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // Added for debugging
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PollController extends Controller
{
    /**
     * Display a listing of the organization's polls.
     */
    public function index()
    {
        $organization = app('organization');

        $polls = Poll::with(['organization', 'creator', 'options', 'invitedUsers', 'invitedDepartments'])
            ->where('organization_id', $organization->id)
            ->latest()
            ->paginate(10);

        // Auto-activate and auto-close polls based on time
        $polls->getCollection()->transform(function ($poll) {
            // Auto-activate poll if it's scheduled and start time has arrived
            if ($poll->status === 'scheduled' && $poll->shouldBeActivated()) {
                $poll->update(['status' => 'active']);
                $poll->refresh();
            }

            // Auto-close poll if it has ended
            if ($poll->status === 'active' && $poll->hasEnded()) {
                $poll->update(['status' => 'ended']);
                $poll->refresh();
            }

            // Add counts for display
            $poll->invited_users_count = $poll->invitedUsers->count();
            $poll->invited_departments_count = $poll->invitedDepartments->count();

            // Add voting access mode (string value for frontend)
            $poll->voting_access_mode = $poll->voting_access_mode?->value ?? 'hybrid';

            return $poll;
        });

        // Get departments for QuickInvite feature
        $departments = Department::where('organization_id', $organization->id)
            ->withCount('users')
            ->orderBy('name')
            ->get();

        // Get users for individual invite
        $users = User::where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('admin/polls', [
            'polls' => $polls,
            'departments' => $departments,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created poll for the organization.
     */
    public function store(StorePollRequest $request)
    {
        $organization = app('organization');
        $validated = $request->validated();

        // Determine actual status based on timing
        $status = $this->determineStatus($validated['status'], $validated['start_at'] ?? null, $validated['end_at'] ?? null);

        $usersToNotify = collect();
        $poll = null; // To access outside transaction

        DB::transaction(function () use ($validated, $request, $organization, $status, &$usersToNotify, &$poll) {
            $poll = Poll::create([
                'question' => $validated['question'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'poll_type' => $validated['poll_type'] ?? Poll::POLL_TYPE_STANDARD,
                'visibility' => $validated['visibility'],
                'voting_access_mode' => $validated['voting_access_mode'] ?? 'hybrid',
                'status' => $status,
                'start_at' => $validated['start_at'] ?? null,
                'end_at' => $validated['end_at'] ?? null,
                'organization_id' => $organization->id,
                'created_by' => $request->user()->id,
            ]);

            // Create poll options
            $this->createPollOptions($poll, $validated['options'], $validated['poll_type'] ?? Poll::POLL_TYPE_STANDARD);

            // Handle immediate invitations for invite-only polls
            if ($validated['visibility'] === Poll::VISIBILITY_INVITE_ONLY) {
                // Capture users to notify, do not send yet
                $usersToNotify = $this->handleInvitations($poll, $validated, $request->user()->id);

                // Handle Proxy Assignments
                if (! empty($request->proxies)) {
                    $this->handleProxies($poll, $request->proxies, $request->user()->id);
                }
            }
        });

        // Send email notifications after transaction commit
        if ($poll && $usersToNotify->isNotEmpty()) {
            Log::info('Queueing emails', ['count' => $usersToNotify->unique('id')->count()]);
            foreach ($usersToNotify->unique('id') as $user) {
                Mail::to($user)->queue(new PollInvitation($poll, $user));
            }
        } else {
            Log::info('No users to notify or poll not created', ['users_count' => $usersToNotify->count()]);
        }

        return redirect()->back()->with('success', 'Poll created successfully.');
    }

    /**
     * Update the specified organization poll.
     */
    public function update(UpdatePollRequest $request, Poll $poll)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        // Prevent editing polls that are active or have ended to maintain credibility
        if (in_array($poll->status, ['active', 'ended'])) {
            return back()->with('error', 'Cannot edit polls that are active or have ended. This ensures voting integrity and prevents data manipulation.');
        }

        $validated = $request->validated();

        // Determine actual status based on timing
        $status = $this->determineStatus($validated['status'], $validated['start_at'] ?? null, $validated['end_at'] ?? null);

        DB::transaction(function () use ($validated, $poll, $status) {
            $poll->update([
                'question' => $validated['question'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'poll_type' => $validated['poll_type'] ?? $poll->poll_type,
                'visibility' => $validated['visibility'],
                'voting_access_mode' => $validated['voting_access_mode'] ?? $poll->voting_access_mode,
                'status' => $status,
                'start_at' => $validated['start_at'] ?? null,
                'end_at' => $validated['end_at'] ?? null,
            ]);

            // Sync poll options
            $this->syncPollOptions($poll, $validated['options'], $validated['poll_type'] ?? $poll->poll_type);
        });

        return redirect()->back()->with('success', 'Poll updated successfully.');
    }

    /**
     * Remove the specified organization poll.
     */
    public function destroy(Poll $poll)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        // Delete associated images for profile polls
        if ($poll->isProfilePoll()) {
            foreach ($poll->options as $option) {
                if ($option->image_url) {
                    Storage::disk('public')->delete($option->image_url);
                }
            }
        }

        $poll->delete();

        return redirect()->back()->with('success', 'Poll deleted successfully.');
    }

    /**
     * Display poll results for the organization.
     */
    public function results(Poll $poll)
    {
        $organization = app('organization');

        // Ensure poll belongs to this organization
        if ($poll->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to poll.');
        }

        $poll->load([
            'options' => function ($query) {
                $query->withCount('votes');
            },
        ]);

        return Inertia::render('admin/polls/results', [
            'poll' => $poll,
        ]);
    }

    /**
     * Create poll options with optional image handling.
     *
     * @param  array<int, array<string, mixed>>  $options
     */
    private function createPollOptions(Poll $poll, array $options, string $pollType): void
    {
        foreach ($options as $index => $optionData) {
            $imageUrl = null;

            // Handle image upload for profile polls
            if ($pollType === Poll::POLL_TYPE_PROFILE && isset($optionData['image'])) {
                $imageUrl = $optionData['image']->store('poll-options', 'public');
            }

            $poll->options()->create([
                'text' => $optionData['text'],
                'image_url' => $imageUrl,
                'name' => $optionData['name'] ?? null,
                'position' => $optionData['position'] ?? null,
                'order' => $index,
            ]);
        }
    }

    /**
     * Sync poll options (update, create, delete) with image handling.
     *
     * @param  array<int, array<string, mixed>>  $options
     */
    private function syncPollOptions(Poll $poll, array $options, string $pollType): void
    {
        // Get IDs of options in the request
        $requestOptionIds = collect($options)
            ->pluck('id')
            ->filter()
            ->toArray();

        // Delete options not in the request (and their images)
        $optionsToDelete = $poll->options()->whereNotIn('id', $requestOptionIds)->get();
        foreach ($optionsToDelete as $option) {
            if ($option->image_url) {
                Storage::disk('public')->delete($option->image_url);
            }
            $option->delete();
        }

        // Update or Create options
        foreach ($options as $index => $optionData) {
            $imageUrl = null;

            // Handle image upload for profile polls
            if ($pollType === Poll::POLL_TYPE_PROFILE && isset($optionData['image'])) {
                $imageUrl = $optionData['image']->store('poll-options', 'public');
            }

            if (isset($optionData['id'])) {
                $existingOption = $poll->options()->where('id', $optionData['id'])->first();

                if ($existingOption) {
                    // If new image uploaded, delete old one
                    if ($imageUrl && $existingOption->image_url) {
                        Storage::disk('public')->delete($existingOption->image_url);
                    }

                    $existingOption->update([
                        'text' => $optionData['text'],
                        'image_url' => $imageUrl ?? $existingOption->image_url,
                        'name' => $optionData['name'] ?? $existingOption->name,
                        'position' => $optionData['position'] ?? $existingOption->position,
                        'order' => $index,
                    ]);
                }
            } else {
                $poll->options()->create([
                    'text' => $optionData['text'],
                    'image_url' => $imageUrl,
                    'name' => $optionData['name'] ?? null,
                    'position' => $optionData['position'] ?? null,
                    'order' => $index,
                ]);
            }
        }
    }

    /**
     * Handle poll invitations for invite-only polls.
     *
     * @param  array<string, mixed>  $validated
     */
    private function handleInvitations(Poll $poll, array $validated, int $inviterId): \Illuminate\Support\Collection
    {
        Log::info('Handling invitations for Poll', ['poll_id' => $poll->id, 'type' => $poll->poll_type]);

        $usersToNotify = collect();
        $userIds = $validated['invite_user_ids'] ?? [];

        // Handle Excel imported users - lookup by email
        if (! empty($validated['invite_users_list'])) {
            $emails = collect($validated['invite_users_list'])->pluck('email')->toArray();
            Log::info('Processing bulk invite list', ['count' => count($emails)]);

            // Find existing users in the organization
            $existingUserIds = User::whereIn('email', $emails)
                ->where('organization_id', $poll->organization_id)
                ->pluck('id')
                ->toArray();

            Log::info('Found existing users', ['count' => count($existingUserIds)]);

            $userIds = array_merge($userIds, $existingUserIds);
        }

        $userIds = array_unique($userIds);
        Log::info('Total unique user IDs to invite', ['count' => count($userIds)]);

        if (! empty($userIds)) {
            $changes = $poll->inviteUsers($userIds, $inviterId);

            // Collect newly invited users
            $newlyInvitedIds = $changes['attached'];
            Log::info('Newly attached users', ['count' => count($newlyInvitedIds)]);

            if (! empty($newlyInvitedIds)) {
                $usersToNotify = $usersToNotify->merge(User::whereIn('id', $newlyInvitedIds)->get());
            }
        }

        if (! empty($validated['invite_department_ids'])) {
            $changes = $poll->inviteDepartments($validated['invite_department_ids'], $inviterId);

            // Collect users in newly invited departments
            $newlyInvitedDeptIds = $changes['attached'];
            if (! empty($newlyInvitedDeptIds)) {
                $usersInDepts = User::whereHas('departments', function ($query) use ($newlyInvitedDeptIds) {
                    $query->whereIn('departments.id', $newlyInvitedDeptIds);
                })->get();

                $usersToNotify = $usersToNotify->merge($usersInDepts);
            }
        }

        return $usersToNotify;
    }

    /**
     * Handle proxy assignments.
     */
    private function handleProxies(Poll $poll, array $proxies, int $creatorId): void
    {
        Log::info('Handling proxies', ['count' => count($proxies)]);

        // We need to resolve IDs.
        // Frontend sends either real DB IDs (for existing selected users) or temp IDs (from Excel).
        // For Excel users, we need to map Temp ID -> Real DB ID via Email.

        // 1. Build a map of Temp ID -> Email from the request input 'invite_users_list'
        $tempIdToEmail = [];
        $inviteList = request()->input('invite_users_list', []);
        foreach ($inviteList as $invite) {
            if (isset($invite['temp_id']) && isset($invite['email'])) {
                $tempIdToEmail[$invite['temp_id']] = $invite['email'];
            }
        }

        // 2. Resolve Emails to Real IDs
        $emailToRealId = [];
        if (! empty($tempIdToEmail)) {
            $emails = array_values($tempIdToEmail);
            $emailToRealId = User::whereIn('email', $emails)
                ->where('organization_id', $poll->organization_id)
                ->pluck('id', 'email')
                ->toArray();
        }

        foreach ($proxies as $proxyData) {
            $principalId = $proxyData['principal_id'];
            $proxyUserId = $proxyData['proxy_id'];

            // Resolve Principal ID
            // If it's a temp ID, look up email, then look up real ID
            if (isset($tempIdToEmail[$principalId])) {
                $email = $tempIdToEmail[$principalId];
                $principalId = $emailToRealId[$email] ?? null;
            }

            // Resolve Proxy User ID
            if (isset($tempIdToEmail[$proxyUserId])) {
                $email = $tempIdToEmail[$proxyUserId];
                $proxyUserId = $emailToRealId[$email] ?? null;
            }

            if ($principalId && $proxyUserId) {
                // Ensure unique proxy per user per poll
                $poll->proxies()->updateOrCreate(
                    ['user_id' => $principalId], // Unique key: A user can only have one proxy
                    [
                        'proxy_user_id' => $proxyUserId,
                        'created_by' => $creatorId,
                    ]
                );
                Log::info("Assigned proxy: User $principalId -> Proxy $proxyUserId");
            } else {
                Log::warning('Could not resolve proxy assignment', ['principal' => $proxyData['principal_id'], 'proxy' => $proxyData['proxy_id']]);
            }
        }
    }

    /**
     * Determine the correct status based on start and end times.
     */
    private function determineStatus(string $requestedStatus, ?string $startAt, ?string $endAt): string
    {
        // If end time is set and has passed, status must be 'ended'
        if ($endAt && \Carbon\Carbon::parse($endAt)->isPast()) {
            return 'ended';
        }

        // If start time is set and in the future, status must be 'scheduled'
        if ($startAt && \Carbon\Carbon::parse($startAt)->isFuture()) {
            return 'scheduled';
        }

        // Otherwise, use the requested status but prevent invalid states
        // If start time has passed but poll is marked as scheduled, activate it
        if ($requestedStatus === 'scheduled' && $startAt && \Carbon\Carbon::parse($startAt)->isPast()) {
            return 'active';
        }

        return $requestedStatus;
    }
}
