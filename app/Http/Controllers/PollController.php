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
            ->with(['options', 'organization', 'creator'])
            ->latest();

        // If user has an organization, show ONLY organization-specific polls
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        } else {
            // Global users (super admins without organization) ONLY see system-wide polls
            $query->whereNull('organization_id');
        }

        // Show both active and ended polls  
        $query->whereIn('status', ['active', 'ended']);

        $polls = $query->paginate(12);

        // Check if user has already voted in each poll
        $polls->getCollection()->transform(function ($poll) use ($user) {
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

            // Load vote counts for ended polls so users can see results
            if ($poll->status === 'ended') {
                $poll->load([
                    'options' => function ($query) {
                        $query->withCount('votes');
                    }
                ]);
                $poll->total_votes = $poll->votes()->count();
            }

            return $poll;
        });

        return Inertia::render('polls/index', [
            'polls' => $polls,
        ]);
    }
}
