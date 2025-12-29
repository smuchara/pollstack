<?php

namespace App\Jobs;

use App\Jobs\SendUserInvitationJob;
use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
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
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Check if file exists
        if (!Storage::exists($this->filePath)) {
            \Log::error("Bulk Invite File not found: {$this->filePath}");
            return;
        }

        $path = Storage::path($this->filePath);
        $validEmails = [];

        // Read emails from file
        // Assumes 'email' header exists, case-insensitive
        $reader = SimpleExcelReader::create($path)
            ->trimHeaderRow()
            ->headersToSnakeCase();

        $reader->getRows()->each(function (array $row) use (&$validEmails) {
            // Check for 'email' or 'e_mail' or just grab the first column if no header? 
            // Better to enforce 'email' header.
            $email = $row['email'] ?? null;

            if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $validEmails[] = strtolower($email);
            }
        });

        if (empty($validEmails)) {
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
            $this->cleanup();
            return;
        }

        // Process invites
        // We do this in chunks to avoid locking the DB for too long if list is huge
        // But for 1000, one transaction is okay.

        DB::transaction(function () use ($emailsToInvite) {
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

                    SendUserInvitationJob::dispatch($invitation);
                } catch (\Exception $e) {
                    \Log::error("Failed to invite {$email}: " . $e->getMessage());
                }
            }
        });

        $this->cleanup();
    }

    protected function cleanup(): void
    {
        if (Storage::exists($this->filePath)) {
            Storage::delete($this->filePath);
        }
    }
}
