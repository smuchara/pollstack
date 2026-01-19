<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InvitationFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $recipientEmail,
        public string $reason
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => NotificationType::InvitationFailed->value,
            'icon' => NotificationType::InvitationFailed->icon(),
            'color' => NotificationType::InvitationFailed->color(),
            'title' => 'Invitation Failed',
            'message' => "The invitation to {$this->recipientEmail} could not be delivered. {$this->reason}",
            'details' => [
                'recipient_email' => $this->recipientEmail,
                'reason' => $this->reason,
            ],
            'action_url' => '/users',
            'action_text' => 'Manage Users',
        ];
    }
}
