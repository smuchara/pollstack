<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\InviteUsersRequest;
use App\Jobs\ProcessBulkInvitation;
use App\Jobs\SendUserInvitationJob;
use App\Models\UserInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\SimpleExcel\SimpleExcelWriter;

class InvitationController extends Controller
{
    /**
     * Send invitations to multiple users.
     */
    public function invite(InviteUsersRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $emails = $validated['emails'];
        $role = $validated['role'] ?? Role::USER->value;
        $invitedBy = $request->user()->id;
        $organizationId = $request->user()->organization_id;
        $permissionGroupIds = $validated['permission_group_ids'] ?? [];

        $invitations = [];
        $successCount = 0;

        DB::transaction(function () use ($emails, $role, $invitedBy, $organizationId, $permissionGroupIds, &$invitations, &$successCount) {
            foreach ($emails as $email) {
                try {
                    // Create the invitation
                    $invitation = UserInvitation::create([
                        'email' => $email,
                        'token' => UserInvitation::generateToken(),
                        'invited_by' => $invitedBy,
                        'role' => $role,
                        'permission_group_ids' => $permissionGroupIds,
                        'organization_id' => $organizationId,
                        'expires_at' => now()->addDays(7), // 7 days expiry
                    ]);

                    $invitations[] = $invitation;
                    $successCount++;

                    // Dispatch the job to send the invitation email
                    SendUserInvitationJob::dispatch($invitation->id);
                } catch (\Exception $e) {
                    // Log the error but continue with other invitations
                    \Log::error('Failed to create invitation', [
                        'email' => $email,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });

        if ($successCount === 0) {
            return redirect()->back()->with('error', 'Failed to send invitations. Please try again.');
        }

        $message = $successCount === 1
            ? 'Invitation sent successfully.'
            : "{$successCount} invitations sent successfully.";

        return redirect()->back()->with('success', $message);
    }

    /**
     * Handle bulk invitation via file upload.
     */
    public function bulkInvite(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'], // 10MB max
            'role' => ['nullable', 'string', 'in:'.implode(',', Role::values())],
            'permission_group_ids' => ['nullable', 'array'],
            'permission_group_ids.*' => ['exists:permission_groups,id'],
        ]);

        $file = $request->file('file');
        $path = $file->store('temp-bulk-invites');

        $role = $request->input('role', Role::USER->value);
        $permissionGroupIds = $request->input('permission_group_ids', []);

        // Dispatch job
        ProcessBulkInvitation::dispatch(
            $path,
            $request->user()->id,
            $request->user()->organization_id,
            $role,
            $permissionGroupIds
        );

        return redirect()->back()->with('success', 'Bulk invitation process started. You will be notified when completed.');
    }

    /**
     * Download the bulk invite template.
     */
    public function downloadTemplate()
    {
        $writer = SimpleExcelWriter::streamDownload('bulk_invite_template.xlsx');

        $writer->addRow([
            'email' => 'user@example.com',
            // Add other optional columns if we support them later, e.g. name
        ]);

        return $writer->toBrowser();
    }

    /**
     * Get the bulk invite progress.
     */
    public function progress(Request $request)
    {
        $cacheKey = 'bulk_invite_progress_'.$request->user()->id;
        $progress = \Illuminate\Support\Facades\Cache::get($cacheKey);

        if (! $progress) {
            return response()->json(['status' => 'idle']);
        }

        return response()->json($progress);
    }

    /**
     * Display the accept invitation page.
     */
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = UserInvitation::where('token', $token)->first();

        // Check if invitation exists
        if (! $invitation) {
            return redirect()->route('login')
                ->with('error', 'Invalid invitation link.');
        }

        // Check if already accepted
        if ($invitation->isAccepted()) {
            return redirect()->route('login')
                ->with('info', 'This invitation has already been used. Please log in.');
        }

        // Check if expired
        if ($invitation->isExpired()) {
            return redirect()->route('login')
                ->with('error', 'This invitation has expired. Please request a new one.');
        }

        return Inertia::render('auth/accept-invitation', [
            'invitation' => [
                'token' => $invitation->token,
                'email' => $invitation->email,
                'name' => $invitation->name,
                'role' => $invitation->role,
                'inviter' => [
                    'name' => $invitation->inviter->name,
                ],
                'expires_at' => $invitation->expires_at->toDateTimeString(),
            ],
        ]);
    }

    /**
     * Accept an invitation and create a user account.
     */
    public function accept(Request $request, string $token): RedirectResponse
    {
        $invitation = UserInvitation::where('token', $token)
            ->valid()
            ->first();

        if (! $invitation) {
            return redirect()->route('login')
                ->with('error', 'Invalid or expired invitation link.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        DB::transaction(function () use ($invitation, $validated) {
            // Create the user account
            $user = \App\Models\User::create([
                'name' => $validated['name'],
                'email' => $invitation->email,
                'password' => bcrypt($validated['password']),
                'role' => $invitation->role,
                'organization_id' => $invitation->organization_id,
                'email_verified_at' => now(), // Auto-verify email for invited users
            ]);

            // Assign permission groups if present
            if (! empty($invitation->permission_group_ids)) {
                $user->assignPermissionGroups($invitation->permission_group_ids);
            }

            // Mark invitation as accepted
            $invitation->markAsAccepted();

            // Log the user in
            auth()->login($user);
        });

        return redirect()->route('dashboard')
            ->with('success', 'Welcome! Your account has been created successfully.');
    }

    /**
     * Cancel/delete a pending invitation.
     */
    public function cancel(string $id): RedirectResponse
    {
        $invitation = UserInvitation::findOrFail($id);

        // Only allow canceling pending invitations
        if ($invitation->isAccepted()) {
            return redirect()->back()
                ->with('error', 'Cannot cancel an accepted invitation.');
        }

        $invitation->delete();

        return redirect()->back()
            ->with('success', 'Invitation cancelled successfully.');
    }

    /**
     * Resend an invitation email.
     */
    public function resend(string $id): RedirectResponse
    {
        $invitation = UserInvitation::findOrFail($id);

        // Only resend pending invitations
        if ($invitation->isAccepted()) {
            return redirect()->back()
                ->with('error', 'Cannot resend an accepted invitation.');
        }

        // Update expiry date
        $invitation->update([
            'expires_at' => now()->addDays(7),
        ]);

        // Dispatch the job to send the invitation email
        SendUserInvitationJob::dispatch($invitation->id);

        return redirect()->back()
            ->with('success', 'Invitation resent successfully.');
    }
}
