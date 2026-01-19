<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Poll;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ProxyVoterAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Poll $poll,
        public User $delegator,
        public string $assignedByName
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
            'type' => NotificationType::ProxyVoterAssigned->value,
            'icon' => NotificationType::ProxyVoterAssigned->icon(),
            'color' => NotificationType::ProxyVoterAssigned->color(),
            'title' => 'Proxy Voting Assignment',
            'message' => "You have been designated as a proxy voter for {$this->delegator->name} in \"{$this->poll->title}\".",
            'details' => [
                'poll_id' => $this->poll->id,
                'poll_title' => $this->poll->title,
                'delegator_id' => $this->delegator->id,
                'delegator_name' => $this->delegator->name,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'assigned_by' => $this->assignedByName,
            ],
            'action_url' => $actionUrl,
            'action_text' => 'View Polls',
        ];
    }
}
