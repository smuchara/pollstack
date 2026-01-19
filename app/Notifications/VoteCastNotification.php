<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Poll;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class VoteCastNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Poll $poll
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
        // Ensure organization is loaded for URL generation
        $this->poll->loadMissing('organization');

        // Generate organization-aware URL
        $actionUrl = '/polls';
        if ($this->poll->organization) {
            $actionUrl = "/organization/{$this->poll->organization->slug}/polls";
        }

        return [
            'type' => NotificationType::VoteCast->value,
            'icon' => NotificationType::VoteCast->icon(),
            'color' => NotificationType::VoteCast->color(),
            'title' => 'Vote Recorded',
            'message' => "Your vote on \"{$this->poll->question}\" has been recorded successfully.",
            'details' => [
                'poll_id' => $this->poll->id,
                'poll_title' => $this->poll->question,
                'voted_at' => now()->format('M d, Y \a\t g:i A'),
            ],
            'action_url' => $actionUrl,
            'action_text' => 'View Polls',
        ];
    }
}
