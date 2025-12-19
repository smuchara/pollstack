<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Poll;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PollController extends Controller
{
    /**
     * Display a listing of the organization's polls.
     */
    public function index()
    {
        $organization = app('organization');

        $polls = Poll::with(['organization', 'creator', 'options'])
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
            return $poll;
        });

        return Inertia::render('admin/polls', [
            'polls' => $polls
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
            'status' => 'required|string|in:scheduled,active,ended,archived',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'options' => 'required|array|min:2',
            'options.*.text' => 'required|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $request, $organization) {
            $poll = Poll::create([
                'question' => $validated['question'],
                'description' => $validated['description'],
                'type' => $validated['type'],
                'status' => $validated['status'],
                'start_at' => $validated['start_at'],
                'end_at' => $validated['end_at'],
                'organization_id' => $organization->id, // Automatically scope to organization
                'created_by' => $request->user()->id,
            ]);

            foreach ($validated['options'] as $index => $optionData) {
                $poll->options()->create([
                    'text' => $optionData['text'],
                    'order' => $index,
                ]);
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

        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:open,closed',
            'status' => 'required|string|in:scheduled,active,ended,archived',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'options' => 'required|array|min:2',
            'options.*.id' => 'nullable|exists:poll_options,id',
            'options.*.text' => 'required|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $poll) {
            $poll->update([
                'question' => $validated['question'],
                'description' => $validated['description'],
                'type' => $validated['type'],
                'status' => $validated['status'],
                'start_at' => $validated['start_at'],
                'end_at' => $validated['end_at'],
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
            }
        ]);

        return Inertia::render('admin/polls/results', [
            'poll' => $poll,
        ]);
    }
}
