<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class WelcomeNewUserNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $newUser,
        public ?Organization $organization = null
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
        $orgName = $this->organization?->name ?? 'your organization';

        // Generate organization-aware URL
        $actionUrl = '/admin/users';
        if ($this->organization) {
            $actionUrl = "/organization/{$this->organization->slug}/admin/users";
        }

        return [
            'type' => NotificationType::WelcomeNewUser->value,
            'icon' => NotificationType::WelcomeNewUser->icon(),
            'color' => NotificationType::WelcomeNewUser->color(),
            'title' => 'New User Joined',
            'message' => "{$this->newUser->name} has joined {$orgName}.",
            'details' => [
                'user_id' => $this->newUser->id,
                'user_name' => $this->newUser->name,
                'user_email' => $this->newUser->email,
                'organization' => $this->organization?->name,
            ],
            'action_url' => $actionUrl,
            'action_text' => 'View Users',
        ];
    }
}
