<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Poll;
use App\Models\Vote;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PollVoteController extends Controller
{
    public function store(Request $request, Poll $poll)
    {
        $validated = $request->validate([
            'option_id' => 'required|exists:poll_options,id',
        ]);

        $user = $request->user();

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

        // Check if already voted
        if ($poll->votes()->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'poll' => 'You have already voted in this poll.',
            ]);
        }

        Vote::create([
            'poll_id' => $poll->id,
            'poll_option_id' => $validated['option_id'],
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
        ]);

        return back()->with('success', 'Vote cast successfully.');
    }
}
