<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\SimpleExcel\SimpleExcelReader;

class ProcessBulkInvitation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $filePath,
        public int $invitedBy,
        public int $organizationId,
        public string $role,
        public array $permissionGroupIds = []
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Check if file exists
        if (! Storage::exists($this->filePath)) {
            \Log::error("Bulk Invite File not found: {$this->filePath}");

            return;
        }

        $path = Storage::path($this->filePath);
        $validEmails = [];

        // Read emails from file
        $reader = SimpleExcelReader::create($path)
            ->trimHeaderRow()
            ->headersToSnakeCase();

        $reader->getRows()->each(function (array $row) use (&$validEmails) {
            $email = $row['email'] ?? null;

            if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $validEmails[] = strtolower($email);
            }
        });

        if (empty($validEmails)) {
            $this->markAsCompleted(0);
            $this->cleanup();

            return;
        }

        $validEmails = array_unique($validEmails);

        // Filter out existing users
        $existingUsers = User::whereIn('email', $validEmails)->pluck('email')->toArray();

        // Filter out existing pending invitations
        $existingInvites = UserInvitation::whereIn('email', $validEmails)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->pluck('email')
            ->toArray();

        $emailsToInvite = array_diff($validEmails, $existingUsers, $existingInvites);

        if (empty($emailsToInvite)) {
            $this->markAsCompleted(0);
            $this->cleanup();

            return;
        }

        // Process invites
        $total = count($emailsToInvite);
        $cacheKey = "bulk_invite_progress_{$this->invitedBy}";

        // Initialize progress with real-time tracking fields
        Cache::put($cacheKey, [
            'total' => $total,
            'queued' => 0,
            'sent' => 0,
            'failed' => 0,
            'processed' => 0,
            'status' => 'processing',
        ], 3600);

        $queued = 0;

        DB::transaction(function () use ($emailsToInvite, $total, &$queued) {
            foreach ($emailsToInvite as $email) {
                try {
                    $invitation = UserInvitation::create([
                        'email' => $email,
                        'token' => UserInvitation::generateToken(),
                        'invited_by' => $this->invitedBy,
                        'role' => $this->role,
                        'permission_group_ids' => $this->permissionGroupIds,
                        'organization_id' => $this->organizationId,
                        'expires_at' => now()->addDays(7),
                    ]);

                    // Pass batch info so SendUserInvitationJob can update real-time progress
                    SendUserInvitationJob::dispatch($invitation->id, $this->invitedBy, $total);
                } catch (\Exception $e) {
                    \Log::error("Failed to invite {$email}: ".$e->getMessage());
                }

                $queued++;
            }
        });

        // Update status to 'sending' - all jobs queued, now sending emails
        Cache::put($cacheKey, [
            'total' => $total,
            'queued' => $total,
            'sent' => 0,
            'failed' => 0,
            'processed' => 0,
            'status' => 'sending',
        ], 3600);

        $this->cleanup();
    }

    protected function markAsCompleted(int $total): void
    {
        $cacheKey = "bulk_invite_progress_{$this->invitedBy}";
        Cache::put($cacheKey, [
            'total' => $total,
            'queued' => $total,
            'sent' => $total,
            'failed' => 0,
            'processed' => $total,
            'status' => 'completed',
        ], 120);
    }

    protected function cleanup(): void
    {
        if (Storage::exists($this->filePath)) {
            Storage::delete($this->filePath);
        }
    }
}
