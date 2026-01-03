<?php

namespace App\Jobs;

use App\Mail\UserInvitationMail;
use App\Models\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class SendUserInvitationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 60;

    /**
     * Create a new job instance.
     *
     * @param  int  $invitationId  The invitation ID to send
     * @param  int|null  $invitedBy  User ID who initiated bulk invite (null for single invites)
     * @param  int|null  $batchTotal  Total count in batch (null for single invites)
     */
    public function __construct(
        public int $invitationId,
        public ?int $invitedBy = null,
        public ?int $batchTotal = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Fetch the invitation fresh from the database
        $invitation = UserInvitation::with('inviter')->find($this->invitationId);

        if (! $invitation) {
            \Log::error('SendUserInvitationJob: Invitation not found', [
                'invitation_id' => $this->invitationId,
            ]);

            return;
        }

        $recipientEmail = $invitation->email;

        \Log::info('SendUserInvitationJob: Starting', [
            'invitation_id' => $this->invitationId,
            'recipient' => $recipientEmail,
        ]);

        try {
            // Create a fresh Mailable instance for this specific recipient
            $mailable = new UserInvitationMail($invitation);

            // Send to the specific email address
            Mail::to($recipientEmail)->send($mailable);

            \Log::info('SendUserInvitationJob: Email sent successfully', [
                'invitation_id' => $this->invitationId,
                'recipient' => $recipientEmail,
            ]);
        } catch (\Exception $e) {
            \Log::error('SendUserInvitationJob: Failed to send email', [
                'invitation_id' => $this->invitationId,
                'recipient' => $recipientEmail,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }

        // Update bulk invite progress if this is part of a batch
        if ($this->invitedBy !== null && $this->batchTotal !== null) {
            $this->updateBulkProgress();
        }
    }

    /**
     * Update the bulk invite progress after sending an email.
     */
    protected function updateBulkProgress(): void
    {
        $cacheKey = "bulk_invite_progress_{$this->invitedBy}";
        $progress = Cache::get($cacheKey);

        if ($progress) {
            $sent = ($progress['sent'] ?? 0) + 1;
            $total = $progress['total'] ?? $this->batchTotal;

            $newProgress = array_merge($progress, [
                'sent' => $sent,
                'processed' => $sent,
            ]);

            // Check if all emails have been sent
            if ($sent >= $total) {
                $newProgress['status'] = 'completed';
                Cache::put($cacheKey, $newProgress, 120);
            } else {
                Cache::put($cacheKey, $newProgress, 3600);
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        \Log::error('SendUserInvitationJob: Job failed', [
            'invitation_id' => $this->invitationId,
            'error' => $exception->getMessage(),
        ]);

        // Still update progress on failure so counter stays accurate
        if ($this->invitedBy !== null && $this->batchTotal !== null) {
            $this->updateBulkProgress();
        }
    }
}
