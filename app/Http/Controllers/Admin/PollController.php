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

        DB::transaction(function () use ($validated, $request, $organization, $status) {
            $poll = Poll::create([
                'question' => $validated['question'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'poll_type' => $validated['poll_type'] ?? Poll::POLL_TYPE_STANDARD,
                'visibility' => $validated['visibility'],
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
                $this->handleInvitations($poll, $validated, $request->user()->id);
            }
        });

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
    private function handleInvitations(Poll $poll, array $validated, int $inviterId): void
    {
        if (! empty($validated['invite_user_ids'])) {
            $changes = $poll->inviteUsers($validated['invite_user_ids'], $inviterId);

            // Send email notifications
            $newlyInvitedIds = $changes['attached'];
            if (! empty($newlyInvitedIds)) {
                $usersToInvite = User::whereIn('id', $newlyInvitedIds)->get();
                foreach ($usersToInvite as $user) {
                    Mail::to($user)->queue(new PollInvitation($poll, $user));
                }
            }
        }

        if (! empty($validated['invite_department_ids'])) {
            $changes = $poll->inviteDepartments($validated['invite_department_ids'], $inviterId);

            // Send email notifications for departments
            $newlyInvitedDeptIds = $changes['attached'];
            if (! empty($newlyInvitedDeptIds)) {
                $usersInDepts = User::whereHas('departments', function ($query) use ($newlyInvitedDeptIds) {
                    $query->whereIn('departments.id', $newlyInvitedDeptIds);
                })->get();

                foreach ($usersInDepts as $user) {
                    Mail::to($user)->queue(new PollInvitation($poll, $user));
                }
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
