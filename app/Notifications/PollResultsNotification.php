<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Poll;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PollResultsNotification extends Notification implements ShouldQueue
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
        $totalVotes = $this->poll->votes()->count();

        // Ensure organization is loaded for URL generation
        $this->poll->loadMissing('organization');

        // Generate organization-aware URL
        $actionUrl = '/polls';
        if ($this->poll->organization) {
            $actionUrl = "/organization/{$this->poll->organization->slug}/admin/polls-management";
        }

        return [
            'type' => NotificationType::PollResults->value,
            'icon' => NotificationType::PollResults->icon(),
            'color' => NotificationType::PollResults->color(),
            'title' => 'Poll Results Available',
            'message' => "Results for \"{$this->poll->title}\" are now available. {$totalVotes} votes were cast.",
            'details' => [
                'poll_id' => $this->poll->id,
                'poll_title' => $this->poll->title,
                'total_votes' => $totalVotes,
                'ended_at' => $this->poll->ends_at?->format('M d, Y \a\t g:i A'),
            ],
            'action_url' => $actionUrl,
            'action_text' => 'View Results',
        ];
    }
}
