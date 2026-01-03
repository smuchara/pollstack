<?php

use App\Jobs\SendUserInvitationJob;
use App\Mail\UserInvitationMail;
use App\Models\Organization;
use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('sends email to the correct recipient', function () {
    Mail::fake();

    $organization = Organization::factory()->create();
    $inviter = User::factory()->create([
        'organization_id' => $organization->id,
    ]);

    $invitation = UserInvitation::create([
        'email' => 'test@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'organization_id' => $organization->id,
        'expires_at' => now()->addDays(7),
    ]);

    $job = new SendUserInvitationJob($invitation->id);
    $job->handle();

    Mail::assertSent(UserInvitationMail::class, function ($mail) {
        return $mail->hasTo('test@example.com');
    });
});

it('sends emails to multiple different recipients correctly', function () {
    Mail::fake();

    $organization = Organization::factory()->create();
    $inviter = User::factory()->create([
        'organization_id' => $organization->id,
    ]);

    $emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
    ];

    $invitations = [];
    foreach ($emails as $email) {
        $invitations[] = UserInvitation::create([
            'email' => $email,
            'token' => UserInvitation::generateToken(),
            'invited_by' => $inviter->id,
            'role' => 'user',
            'organization_id' => $organization->id,
            'expires_at' => now()->addDays(7),
        ]);
    }

    // Run the jobs sequentially (simulating queue processing)
    foreach ($invitations as $invitation) {
        $job = new SendUserInvitationJob($invitation->id);
        $job->handle();
    }

    // Assert that 3 emails were sent
    Mail::assertSentCount(3);

    // Assert each email was sent to the correct recipient
    foreach ($emails as $email) {
        Mail::assertSent(UserInvitationMail::class, function ($mail) use ($email) {
            return $mail->hasTo($email);
        });
    }
});

it('does not send email if invitation not found', function () {
    Mail::fake();

    $job = new SendUserInvitationJob(99999);
    $job->handle();

    Mail::assertNothingSent();
});
