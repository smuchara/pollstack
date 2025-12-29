<?php

namespace App\Http\Controllers;

use App\Models\Poll;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PollController extends Controller
{
    /**
     * Display a listing of active polls for the authenticated user.
     * System polls are ONLY visible to users without an organization (for internal testing).
     * Organization users only see polls created within their organization.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get active and ended polls
        $query = Poll::query()
            ->with([
                'options' => function ($query) {
                    $query->withCount('votes');
                },
                'organization',
                'creator'
            ])
            ->latest();

        // Filter polls based on user type and status
        // Super admins WITHOUT organization see only system polls (organization_id = null)
        // Super admins WITH organization see their organization's polls
        // Regular users see only their organization's polls or system-wide polls
        if ($user->isSuperAdmin() && !$user->organization_id) {
            // Super admins without organization see only system-wide polls
            $query->whereNull('organization_id');
        } elseif ($user->organization_id) {
            // Organization users (including org admins) see only their organization's polls
            $query->where('organization_id', $user->organization_id);
        } else {
            // Users without organization see only system-wide polls
            $query->whereNull('organization_id');
        }

        // Only show active polls (exclude scheduled, ended, and archived)
        $query->where('status', 'active');

        $polls = $query->paginate(12);

        // Check if user has already voted in each poll
        $polls->getCollection()->transform(function ($poll) use ($user) {
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

            // Add total votes count for ended polls
            if ($poll->status === 'ended') {
                $poll->total_votes = $poll->votes()->count();
            }

            return $poll;
        });

        return Inertia::render('polls/index', [
            'polls' => $polls,
        ]);
    }
}
