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

        // Get active polls
        $query = Poll::query()
            ->with(['options', 'organization', 'creator'])
            ->active()
            ->latest();

        // If user has an organization, show ONLY organization-specific polls
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        } else {
            // Global users (super admins without organization) ONLY see system-wide polls
            $query->whereNull('organization_id');
        }

        $polls = $query->paginate(12);

        // Check if user has already voted in each poll
        $polls->getCollection()->transform(function ($poll) use ($user) {
            $poll->user_has_voted = $poll->votes()
                ->where('user_id', $user->id)
                ->exists();

            $poll->user_vote = $poll->votes()
                ->where('user_id', $user->id)
                ->first();

            return $poll;
        });

        return Inertia::render('polls/index', [
            'polls' => $polls,
        ]);
    }
}
