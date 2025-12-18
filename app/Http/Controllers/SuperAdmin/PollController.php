<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Poll;
use App\Models\Organization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PollController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $polls = Poll::with(['organization', 'creator', 'options'])
            ->latest()
            ->paginate(10);

        return Inertia::render('super-admin/polls', [
            'polls' => $polls
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:open,closed',
            'status' => 'required|string|in:scheduled,active,ended,archived',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'organization_id' => 'nullable|exists:organizations,id',
            'options' => 'required|array|min:2',
            'options.*.text' => 'required|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $poll = Poll::create([
                'question' => $validated['question'],
                'description' => $validated['description'],
                'type' => $validated['type'],
                'status' => $validated['status'],
                'start_at' => $validated['start_at'],
                'end_at' => $validated['end_at'],
                'organization_id' => $validated['organization_id'],
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
     * Update the specified resource in storage.
     */
    public function update(Request $request, Poll $poll)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:open,closed',
            'status' => 'required|string|in:scheduled,active,ended,archived',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'organization_id' => 'nullable|exists:organizations,id', // Should we allow changing org? Maybe.
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
                'organization_id' => $validated['organization_id'],
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
     * Remove the specified resource from storage.
     */
    public function destroy(Poll $poll)
    {
        $poll->delete();
        return redirect()->back()->with('success', 'Poll deleted successfully.');
    }

    public function results(Poll $poll)
    {
        $poll->load([
            'options' => function ($query) {
                $query->withCount('votes');
            }
        ]);

        return Inertia::render('super-admin/polls/results', [
            'poll' => $poll,
        ]);
    }
}
