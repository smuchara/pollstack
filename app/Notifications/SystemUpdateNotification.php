<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class SystemUpdateNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public ?string $actionUrl = null,
        public ?string $actionText = null
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
            'type' => NotificationType::SystemUpdate->value,
            'icon' => NotificationType::SystemUpdate->icon(),
            'color' => NotificationType::SystemUpdate->color(),
            'title' => $this->title,
            'message' => $this->message,
            'details' => [],
            'action_url' => $this->actionUrl,
            'action_text' => $this->actionText ?? 'Learn More',
        ];
    }
}
