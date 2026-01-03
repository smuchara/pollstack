<x-mail::message>
    # Hello!

    {{ $inviterName }} has invited you to join PollStack.

    Click the button below to accept the invitation and create your account.

    <x-mail::button :url="$acceptUrl">
        Accept Invitation
    </x-mail::button>

    This invitation will expire {{ $expiresAt }}.

    If you did not expect this invitation, no further action is required.

    Regards,<br>
    {{ config('app.name') }}
</x-mail::message>