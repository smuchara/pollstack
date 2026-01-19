<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Poll;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PollStartingSoonNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Poll $poll,
        public string $timeUntilStart
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
        $startsAt = $this->poll->starts_at?->format('M d, Y \a\t g:i A') ?? 'Soon';

        // Ensure organization is loaded for URL generation
        $this->poll->loadMissing('organization');

        // Generate organization-aware URL
        $actionUrl = '/polls';
        if ($this->poll->organization) {
            $actionUrl = "/organization/{$this->poll->organization->slug}/polls";
        }

        return [
            'type' => NotificationType::PollStartingSoon->value,
            'icon' => NotificationType::PollStartingSoon->icon(),
            'color' => NotificationType::PollStartingSoon->color(),
            'title' => 'Poll Starting Soon',
            'message' => "\"{$this->poll->title}\" is starting {$this->timeUntilStart}. Get ready to cast your vote!",
            'details' => [
                'poll_id' => $this->poll->id,
                'poll_title' => $this->poll->title,
                'starts_at' => $startsAt,
                'time_until_start' => $this->timeUntilStart,
            ],
            'action_url' => $actionUrl,
            'action_text' => 'View Poll',
        ];
    }
}
