<?php

namespace App\Http\Controllers;

use App\Models\Poll;
use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class PollVoteController extends Controller
{
    public function store(Request $request, Poll $poll)
    {
        Log::info('Vote request received', [
            'user_id' => $request->user()->id,
            'poll_id' => $poll->id,
            'payload' => $request->all()
        ]);

        $validated = $request->validate([
            'option_id' => 'required|exists:poll_options,id',
            'on_behalf_of' => 'nullable|exists:users,id',
        ]);

        $currentUser = $request->user();
        $votingAsUser = $currentUser;
        $proxyUserId = null;

        // Handle proxy voting
        if (isset($validated['on_behalf_of']) && $validated['on_behalf_of'] != $currentUser->id) {
            // Check if valid proxy
            $isProxy = $poll->proxies()
                ->where('user_id', $validated['on_behalf_of'])
                ->where('proxy_user_id', $currentUser->id)
                ->exists();

            if (!$isProxy) {
                throw ValidationException::withMessages([
                    'on_behalf_of' => 'You are not authorized to vote on behalf of this user.',
                ]);
            }

            $votingAsUser = \App\Models\User::find($validated['on_behalf_of']);
            $proxyUserId = $currentUser->id;
        }

        // Check if poll is active
        if ($poll->status !== 'active') {
            throw ValidationException::withMessages([
                'poll' => 'This poll is not active.',
            ]);
        }

        // Check if poll has ended (time-based)
        if ($poll->hasEnded()) {
            throw ValidationException::withMessages([
                'poll' => 'This poll has ended.',
            ]);
        }

        // Check if user is eligible to vote on this poll
        if (!$poll->canBeVotedOnBy($votingAsUser)) {
            throw ValidationException::withMessages([
                'poll' => 'The user you are voting for is not eligible to vote in this poll.',
            ]);
        }

        // Check if already voted
        if ($poll->votes()->where('user_id', $votingAsUser->id)->exists()) {
            throw ValidationException::withMessages([
                'poll' => 'This user has already voted in this poll.',
            ]);
        }

        // Determine verification type
        $verificationType = 'remote';
        if ($poll->hasUserVerifiedOnPremise($votingAsUser)) {
            $verificationType = 'on_premise';
        }

        $vote = Vote::create([
            'poll_id' => $poll->id,
            'poll_option_id' => $validated['option_id'],
            'user_id' => $votingAsUser->id,
            'proxy_user_id' => $proxyUserId,
            'ip_address' => $request->ip(),
            'verification_type' => $verificationType,
        ]);

        Log::info('Vote created', ['vote_id' => $vote->id, 'user_id' => $votingAsUser->id, 'proxy_user_id' => $proxyUserId]);

        return back()->with('success', 'Vote cast successfully.');
    }
}
