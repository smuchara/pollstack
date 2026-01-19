<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Organization;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class BulkInviteCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $totalSent,
        public int $totalFailed,
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
        $message = $this->totalFailed > 0
            ? "{$this->totalSent} invitations sent successfully, {$this->totalFailed} failed."
            : "{$this->totalSent} invitations sent successfully!";

        // Generate organization-aware URL
        $actionUrl = '/admin/users';
        if ($this->organization) {
            $actionUrl = "/organization/{$this->organization->slug}/admin/users";
        }

        return [
            'type' => NotificationType::BulkInviteCompleted->value,
            'icon' => NotificationType::BulkInviteCompleted->icon(),
            'color' => $this->totalFailed > 0 ? 'amber' : NotificationType::BulkInviteCompleted->color(),
            'title' => 'Bulk Invite Completed',
            'message' => $message,
            'details' => [
                'total_sent' => $this->totalSent,
                'total_failed' => $this->totalFailed,
                'organization' => $this->organization?->name,
            ],
            'action_url' => $actionUrl,
            'action_text' => 'View Users',
        ];
    }
}
