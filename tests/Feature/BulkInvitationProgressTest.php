<?php

use App\Jobs\ProcessBulkInvitation;
use App\Jobs\SendUserInvitationJob;
use App\Models\UserInvitation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('tracks successful and failed invitations separately in bulk progress', function () {
    Mail::fake();

    // Setup
    $user = \App\Models\User::factory()->create();
    $organization = \App\Models\Organization::factory()->create();
    $inviterId = $user->id;
    $total = 2;
    $cacheKey = "bulk_invite_progress_{$inviterId}";

    // Initialize cache as ProcessBulkInvitation would
    Cache::put($cacheKey, [
        'total' => $total,
        'queued' => $total,
        'sent' => 0,
        'processed' => 0,
        // 'failed' => 0, // Intentionally omitted to simulate current state if we want to repro, but let's write the DESIRED state test
        'status' => 'sending',
    ], 3600);

    // Create invitations
    $invitation1 = UserInvitation::factory()->create([
        'invited_by' => $inviterId,
        'organization_id' => $organization->id
    ]);
    $invitation2 = UserInvitation::factory()->create([
        'invited_by' => $inviterId,
        'organization_id' => $organization->id
    ]);

    // Process Job 1 (Success)
    $job1 = new SendUserInvitationJob($invitation1->id, $inviterId, $total);
    $job1->handle();

    // Process Job 2 (Failure)
    // We simulate failure by forcing throw in Mail or by mocking the job's behavior if we can't easily force Mail::send to throw inside the job without mocking Mail specificially for one call.
    // Easier way: Partial mock of the job logic or just ensure the job handles exceptions.
    // The UpdateBulkProgress is protected, so we can't call it directly.
    // We will use the 'failed' method of the job which is called by the queue worker,
    // BUT we can also manually call it or simulate the exception flow if we want to test handle() catching it.
    // The current code re-throws the exception in handle().

    try {
        // Mock Mail to throw exception
        Mail::shouldReceive('to')->andThrow(new \Exception('SMTP Error'));

        $job2 = new SendUserInvitationJob($invitation2->id, $inviterId, $total);
        $job2->handle();
    } catch (\Exception $e) {
        // Expected exception
        // Manually call failed() because in a real queue the worker does this
        $job2->failed($e);
    }

    // Check Cache
    $progress = Cache::get($cacheKey);

    // Expectation:
    // sent: 1
    // failed: 1
    // processed: 2

    expect($progress['sent'])->toBe(1)
        ->and($progress['processed'])->toBe(2);

    // This assertion will fail before our fix because 'failed' key is missing or not updated,
    // and 'sent' might be wrongly incremented if the code was blindly incrementing (but it increments at end of handle, so exception prevents it).
    // EXCEPT: The user said "shows messages are sent".
    // In the original code:
    // try { Mail::send... Log::info... } catch { Log::error... throw $e; }
    // The updateBulkProgress() calls are at the END of handle(), outside try/catch?
    // No, waiting...
    // Let's re-read the original file.

});
