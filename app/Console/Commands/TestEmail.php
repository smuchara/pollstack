<?php

namespace App\Console\Commands;

use App\Models\UserInvitation;
use App\Notifications\UserInvitationNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

class TestEmail extends Command
{
    protected $signature = 'app:test-email {email} {--invitation : Test with actual invitation notification}';

    protected $description = 'Test sending an email via Gmail SMTP';

    public function handle()
    {
        $email = $this->argument('email');

        if ($this->option('invitation')) {
            // Find the invitation for this email
            $invitation = UserInvitation::where('email', $email)->latest()->first();

            if (!$invitation) {
                $this->error("No invitation found for: {$email}");

                return;
            }

            $this->info("Found invitation ID: {$invitation->id}");
            $this->info("Email in invitation: {$invitation->email}");

            try {
                Notification::route('mail', $invitation->email)
                    ->notify(new UserInvitationNotification($invitation));

                $this->info("Invitation notification sent to: {$invitation->email}");
            } catch (\Exception $e) {
                $this->error('Failed: ' . $e->getMessage());
            }

            return;
        }

        try {
            Mail::raw('This is a test email from BoardCo to verify Gmail SMTP is working.', function ($message) use ($email) {
                $message->to($email)
                    ->subject('BoardCo Test Email');
            });

            $this->info("Test email sent to: {$email}");
        } catch (\Exception $e) {
            $this->error('Failed to send email: ' . $e->getMessage());
        }
    }
}
