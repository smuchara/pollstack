<x-mail::message>
    # You have been invited to participate in a poll

    **Topic:** {{ $poll->question }}

    @if($poll->description)
        {{ $poll->description }}
    @endif

    **Start Date:**
    {{ $poll->start_at ? $poll->start_at->setTimezone($user->timezone ?? config('app.timezone'))->format('F j, Y g:i A') : 'Starts Immediately' }}
    **End Date:**
    {{ $poll->end_at ? $poll->end_at->setTimezone($user->timezone ?? config('app.timezone'))->format('F j, Y g:i A') : 'No End Date' }}

    Please click the button below to participate in the poll.

    <x-mail::button :url="route('polls.index')">
        Participate in Poll
    </x-mail::button>

    Thanks,<br>
    {{ config('app.name') }}
</x-mail::message>