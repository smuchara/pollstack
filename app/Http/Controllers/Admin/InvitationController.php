<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\InviteUsersRequest;
use App\Jobs\SendUserInvitationJob;
use App\Models\UserInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

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

        $invitations = [];
        $successCount = 0;

        DB::transaction(function () use ($emails, $role, $invitedBy, &$invitations, &$successCount) {
            foreach ($emails as $email) {
                try {
                    // Create the invitation
                    $invitation = UserInvitation::create([
                        'email' => $email,
                        'token' => UserInvitation::generateToken(),
                        'invited_by' => $invitedBy,
                        'role' => $role,
                        'expires_at' => now()->addDays(7), // 7 days expiry
                    ]);

                    $invitations[] = $invitation;
                    $successCount++;

                    // Dispatch the job to send the invitation email
                    SendUserInvitationJob::dispatch($invitation);
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
                'email_verified_at' => now(), // Auto-verify email for invited users
            ]);

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
        SendUserInvitationJob::dispatch($invitation);

        return redirect()->back()
            ->with('success', 'Invitation resent successfully.');
    }
}
