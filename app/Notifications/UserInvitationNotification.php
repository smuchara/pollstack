<?php

namespace App\Notifications;

use App\Models\UserInvitation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserInvitationNotification extends Notification
{
    public function __construct(
        public UserInvitation $invitation
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $acceptUrl = url("/invitations/accept/{$this->invitation->token}");
        $inviterName = $this->invitation->inviter->name;
        $expiresAt = $this->invitation->expires_at->diffForHumans();

        return (new MailMessage)
            ->subject('You\'ve been invited to join BoardCo')
            ->greeting('Hello!')
            ->line("{$inviterName} has invited you to join BoardCo.")
            ->line('Click the button below to accept the invitation and create your account.')
            ->action('Accept Invitation', $acceptUrl)
            ->line("This invitation will expire {$expiresAt}.")
            ->line('If you did not expect this invitation, no further action is required.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'invitation_id' => $this->invitation->id,
            'email' => $this->invitation->email,
            'invited_by' => $this->invitation->invited_by,
        ];
    }
}
