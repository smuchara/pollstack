<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\PollInvitation;
use App\Models\Department;
use App\Models\Poll;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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
    public function store(Request $request)
    {
        $organization = app('organization');

        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:open,closed',
            'visibility' => 'required|string|in:public,invite_only',
            'status' => 'required|string|in:scheduled,active,ended,archived',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'options' => 'required|array|min:2',
            'options.*.text' => 'required|string|max:255',
            // Optional: invite users/departments immediately when creating an invite-only poll
            'invite_user_ids' => 'nullable|array',
            'invite_user_ids.*' => 'integer|exists:users,id',
            'invite_department_ids' => 'nullable|array',
            'invite_department_ids.*' => 'integer|exists:departments,id',
        ]);

        // Determine actual status based on timing
        $status = $this->determineStatus($validated['status'], $validated['start_at'] ?? null, $validated['end_at'] ?? null);

        DB::transaction(function () use ($validated, $request, $organization, $status) {
            $poll = Poll::create([
                'question' => $validated['question'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'visibility' => $validated['visibility'],
                'status' => $status,
                'start_at' => $validated['start_at'] ?? null,
                'end_at' => $validated['end_at'] ?? null,
                'organization_id' => $organization->id, // Automatically scope to organization
                'created_by' => $request->user()->id,
            ]);

            foreach ($validated['options'] as $index => $optionData) {
                $poll->options()->create([
                    'text' => $optionData['text'],
                    'order' => $index,
                ]);
            }

            // Handle immediate invitations for invite-only polls
            if ($validated['visibility'] === Poll::VISIBILITY_INVITE_ONLY) {
                if (!empty($validated['invite_user_ids'])) {
                    $changes = $poll->inviteUsers($validated['invite_user_ids'], $request->user()->id);

                    // Send email notifications
                    $newlyInvitedIds = $changes['attached'];
                    if (!empty($newlyInvitedIds)) {
                        $usersToInvite = User::whereIn('id', $newlyInvitedIds)->get();
                        foreach ($usersToInvite as $user) {
                            Mail::to($user)->queue(new PollInvitation($poll, $user));
                        }
                    }
                }

                if (!empty($validated['invite_department_ids'])) {
                    $changes = $poll->inviteDepartments($validated['invite_department_ids'], $request->user()->id);

                    // Send email notifications for departments
                    $newlyInvitedDeptIds = $changes['attached'];
                    if (!empty($newlyInvitedDeptIds)) {
                        $usersInDepts = User::whereHas('departments', function ($query) use ($newlyInvitedDeptIds) {
                            $query->whereIn('departments.id', $newlyInvitedDeptIds);
                        })->get();

                        foreach ($usersInDepts as $user) {
                            Mail::to($user)->queue(new PollInvitation($poll, $user));
                        }
                    }
                }
            }
        });

        return redirect()->back()->with('success', 'Poll created successfully.');
    }

    /**
     * Update the specified organization poll.
     */
    public function update(Request $request, Poll $poll)
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

        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:open,closed',
            'visibility' => 'required|string|in:public,invite_only',
            'status' => 'required|string|in:scheduled,active,ended,archived',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'options' => 'required|array|min:2',
            'options.*.id' => 'nullable|exists:poll_options,id',
            'options.*.text' => 'required|string|max:255',
        ]);

        // Determine actual status based on timing
        $status = $this->determineStatus($validated['status'], $validated['start_at'] ?? null, $validated['end_at'] ?? null);

        DB::transaction(function () use ($validated, $poll, $status) {
            $poll->update([
                'question' => $validated['question'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'visibility' => $validated['visibility'],
                'status' => $status,
                'start_at' => $validated['start_at'] ?? null,
                'end_at' => $validated['end_at'] ?? null,
            ]);

            // Sync Options
            // 1. Get IDs of options in the request
            $requestOptionIds = collect($validated['options'])
                ->pluck('id')
                ->filter()
                ->toArray();

            // 2. Delete options not in the request
            $poll->options()->whereNotIn('id', $requestOptionIds)->delete();

            // 3. Update or Create options
            foreach ($validated['options'] as $index => $optionData) {
                if (isset($optionData['id'])) {
                    $poll->options()->where('id', $optionData['id'])->update([
                        'text' => $optionData['text'],
                        'order' => $index,
                    ]);
                } else {
                    $poll->options()->create([
                        'text' => $optionData['text'],
                        'order' => $index,
                    ]);
                }
            }
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
     * Determine the correct status based on start and end times.
     */
    private function determineStatus(string $requestedStatus, ?string $startAt, ?string $endAt): string
    {
        $now = now();

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
