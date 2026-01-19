<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Poll;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PollEndingSoonNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Poll $poll,
        public string $timeUntilEnd
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
        $endsAt = $this->poll->ends_at?->format('M d, Y \a\t g:i A') ?? 'Soon';

        // Ensure organization is loaded for URL generation
        $this->poll->loadMissing('organization');

        // Generate organization-aware URL
        $actionUrl = '/polls';
        if ($this->poll->organization) {
            $actionUrl = "/organization/{$this->poll->organization->slug}/polls";
        }

        return [
            'type' => NotificationType::PollEndingSoon->value,
            'icon' => NotificationType::PollEndingSoon->icon(),
            'color' => NotificationType::PollEndingSoon->color(),
            'title' => 'Poll Ending Soon',
            'message' => "\"{$this->poll->title}\" is closing {$this->timeUntilEnd}. Don't miss your chance to vote!",
            'details' => [
                'poll_id' => $this->poll->id,
                'poll_title' => $this->poll->title,
                'ends_at' => $endsAt,
                'time_until_end' => $this->timeUntilEnd,
            ],
            'action_url' => $actionUrl,
            'action_text' => 'Vote Now',
        ];
    }
}
