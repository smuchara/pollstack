<?php

namespace App\Http\Controllers;

use App\Models\Poll;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PollController extends Controller
{
    /**
     * Display a listing of active polls for the authenticated user.
     * Shows system-wide polls and organization-specific polls if user belongs to an organization.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get active polls
        $query = Poll::query()
            ->with(['options', 'organization', 'creator'])
            ->active()
            ->latest();

        // If user has an organization, show both system polls and org-specific polls
        if ($user->organization_id) {
            $query->where(function ($q) use ($user) {
                $q->whereNull('organization_id') // System-wide polls
                    ->orWhere('organization_id', $user->organization_id); // Organization polls
            });
        } else {
            // Global users only see system-wide polls
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
