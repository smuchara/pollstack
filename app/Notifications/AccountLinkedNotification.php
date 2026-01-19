<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Organization;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class AccountLinkedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Organization $organization,
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
        return [
            'type' => NotificationType::AccountLinked->value,
            'icon' => NotificationType::AccountLinked->icon(),
            'color' => NotificationType::AccountLinked->color(),
            'title' => 'Welcome to '.$this->organization->name.'!',
            'message' => "Your account has been created successfully. You were invited by {$this->inviterName}.",
            'details' => [
                'organization_id' => $this->organization->id,
                'organization_name' => $this->organization->name,
                'invited_by' => $this->inviterName,
            ],
            'action_url' => "/organization/{$this->organization->slug}/dashboard",
            'action_text' => 'Go to Dashboard',
        ];
    }
}
