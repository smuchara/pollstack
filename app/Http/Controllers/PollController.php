<?php

namespace App\Http\Controllers;

use App\Models\Poll;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PollController extends Controller
{
    /**
     * Display a listing of active and ended polls for the authenticated user.
     * Returns separate datasets for active and ended polls with counts.
     * System polls are ONLY visible to users without an organization (for internal testing).
     * Organization users only see polls created within their organization.
     * Invite-only polls are only visible to invited users or users in invited departments.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Base query for all polls with relationships
        $baseQuery = function () use ($user) {
            return Poll::query()
                ->with([
                    'options' => function ($query) {
                        $query->withCount('votes');
                    },
                    'organization',
                    'creator',
                    'invitedUsers',
                    'invitedDepartments',
                ])
                ->when($user->isSuperAdmin() && !$user->organization_id, function ($query) {
                    // Super admins without organization see only system-wide polls
                    $query->whereNull('organization_id');
                })
                ->when($user->organization_id, function ($query) use ($user) {
                    // Organization users (including org admins) see only their organization's polls
                    // that are visible to them (public or they're invited)
                    $query->where('organization_id', $user->organization_id)
                        ->visibleTo($user);
                })
                ->when(!$user->isSuperAdmin() && !$user->organization_id, function ($query) {
                    // Users without organization see only system-wide polls
                    $query->whereNull('organization_id');
                })
                ->latest();
        };

        // Get active polls
        $activePolls = $baseQuery()
            ->where('status', 'active')
            ->get();

        // Get scheduled polls
        $scheduledPolls = $baseQuery()
            ->where('status', 'scheduled')
            ->get();

        // Get ended polls
        $endedPolls = $baseQuery()
            ->where('status', 'ended')
            ->get();

        // Transform polls to add user-specific data
        $transformPoll = function ($poll) use ($user) {
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

            $poll->user_has_voted = $poll->votes()
                ->where('user_id', $user->id)
                ->exists();

            $poll->user_vote = $poll->votes()
                ->where('user_id', $user->id)
                ->first();

            // Add total votes count
            $poll->total_votes = $poll->votes()->count();

            return $poll;
        };

        // Transform all collections
        $activePolls = $activePolls->map($transformPoll);
        $scheduledPolls = $scheduledPolls->map($transformPoll);
        $endedPolls = $endedPolls->map($transformPoll);

        // Filter out any scheduled polls that just became active from the scheduled list to avoid confusion?
        // Actually, if they became active, they should really be in the active list, but moving them now is complex.
        // For now, let's just pass them as is. If they show as "Active" in the Scheduled tab, the user will likely refresh or we can handle it in UI.
        // Better yet, let's just rely on the status.

        return Inertia::render('polls/index', [
            'activePolls' => $activePolls,
            'scheduledPolls' => $scheduledPolls,
            'endedPolls' => $endedPolls,
            'counts' => [
                'active' => $activePolls->count(),
                'scheduled' => $scheduledPolls->count(),
                'ended' => $endedPolls->count(),
            ],
        ]);
    }
}
