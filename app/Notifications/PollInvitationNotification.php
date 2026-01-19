<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Poll;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PollInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Poll $poll,
        public string $inviterName
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
        $startsAt = $this->poll->starts_at?->format('M d, Y \a\t g:i A') ?? 'Not specified';
        $endsAt = $this->poll->ends_at?->format('M d, Y \a\t g:i A') ?? 'Not specified';

        // Ensure organization is loaded for URL generation
        $this->poll->loadMissing('organization');

        // Generate organization-aware URL
        $actionUrl = '/polls';
        if ($this->poll->organization) {
            $actionUrl = "/organization/{$this->poll->organization->slug}/polls";
        }

        return [
            'type' => NotificationType::PollInvitation->value,
            'icon' => NotificationType::PollInvitation->icon(),
            'color' => NotificationType::PollInvitation->color(),
            'title' => 'You\'ve Been Invited to Vote',
            'message' => "{$this->inviterName} has invited you to participate in \"{$this->poll->title}\".",
            'details' => [
                'poll_id' => $this->poll->id,
                'poll_title' => $this->poll->title,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'invited_by' => $this->inviterName,
            ],
            'action_url' => $actionUrl,
            'action_text' => 'View Polls',
        ];
    }
}
