<?php

namespace App\Http\Controllers;

use App\Models\Poll;
use App\Models\User;
use Inertia\Inertia;

class PollResultsController extends Controller
{
    /**
     * Display the public results page for a poll.
     */
    public function show(Poll $poll)
    {
        // Load relationships with vote counts
        $poll->load([
            'options' => function ($query) {
                $query->withCount('votes')->orderBy('order');
            },
            'organization',
            'creator',
        ]);

        // Calculate total votes
        $totalVotes = $poll->votes()->count();

        // Find leading option
        $leadingOption = $poll->options->sortByDesc('votes_count')->first();

        // Calculate conversion rate (percentage of eligible users who voted)
        $conversionRate = 0;
        if ($poll->organization_id) {
            // For organization polls, eligible users are org members
            $eligibleUsers = User::where('organization_id', $poll->organization_id)->count();
            $conversionRate = $eligibleUsers > 0 ? round(($totalVotes / $eligibleUsers) * 100) : 0;
        } else {
            // For system polls, use total system users (non-org users)
            $eligibleUsers = User::whereNull('organization_id')->count();
            $conversionRate = $eligibleUsers > 0 ? round(($totalVotes / $eligibleUsers) * 100) : 0;
        }

        // Build voting trend data (last 7 days)
        $votingTrend = $this->buildVotingTrend($poll);

        // Load voter log only for open ballots
        $voterLog = null;
        if ($poll->type === 'open') {
            $voterLog = $poll->votes()
                ->with(['user', 'option'])
                ->latest()
                ->get()
                ->map(function ($vote) {
                    return [
                        'id' => $vote->id,
                        'voter' => [
                            'name' => $vote->user->name,
                            'email' => $vote->user->email,
                            'avatar' => $vote->user->name[0], // First letter for avatar
                        ],
                        'selection' => $vote->option->text,
                        'timestamp' => $vote->created_at->format('m/d/Y, H:i:s'),
                    ];
                });
        }

        // Calculate percentage breakdown for donut chart
        $percentageBreakdown = $poll->options->map(function ($option) use ($totalVotes) {
            $votes = $option->votes_count ?? 0;

            return [
                'name' => $option->text,
                'value' => $votes,
                'percentage' => $totalVotes > 0 ? round(($votes / $totalVotes) * 100) : 0,
            ];
        });

        // Calculate trend indicator (compare today vs yesterday)
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        $votesToday = $poll->votes()->whereDate('created_at', $today)->count();
        $votesYesterday = $poll->votes()->whereDate('created_at', $yesterday)->count();

        $trendPercentage = 0;
        if ($votesYesterday > 0) {
            $trendPercentage = round((($votesToday - $votesYesterday) / $votesYesterday) * 100);
        } elseif ($votesToday > 0) {
            $trendPercentage = 100; // If no votes yesterday but votes today, it's a 100% increase
        }

        // Calculate verification breakdown
        $verificationBreakdown = [
            'on_premise' => $poll->votes()->where('verification_type', 'on_premise')->count(),
            'remote' => $poll->votes()->where('verification_type', '!=', 'on_premise')->orWhereNull('verification_type')->count(),
        ];

        return Inertia::render('polls/results', [
            'poll' => [
                'id' => $poll->id,
                'question' => $poll->question,
                'description' => $poll->description,
                'type' => $poll->type,
                'status' => $poll->status,
                'start_at' => $poll->start_at,
                'end_at' => $poll->end_at,
                'organization' => $poll->organization,
                'options' => $poll->options,
            ],
            'statistics' => [
                'total_votes' => $totalVotes,
                'trend_percentage' => $trendPercentage,
                'leading_option' => $leadingOption ? $leadingOption->text : null,
                'conversion_rate' => $conversionRate,
                'duration' => [
                    'start' => $poll->start_at,
                    'end' => $poll->end_at,
                ],
                'verification_breakdown' => $verificationBreakdown,
            ],
            'votingTrend' => $votingTrend,
            'percentageBreakdown' => $percentageBreakdown,
            'voterLog' => $voterLog,
        ]);
    }

    /**
     * Build voting trend data for the last 7 days
     */
    private function buildVotingTrend(Poll $poll): array
    {
        $trends = [];
        $endDate = now();
        $startDate = now()->subDays(6);

        for ($date = clone $startDate; $date <= $endDate; $date->addDay()) {
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $votesCount = $poll->votes()
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $trends[] = [
                'date' => $date->format('m/d'),
                'votes' => $votesCount,
            ];
        }

        return $trends;
    }
}
