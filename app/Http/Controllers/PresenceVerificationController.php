<?php

namespace App\Http\Controllers;

use App\Models\Poll;
use App\Services\PresenceVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PresenceVerificationController extends Controller
{
    public function __construct(
        private PresenceVerificationService $presenceService
    ) {}

    /**
     * Generate or refresh a QR code for a poll.
     * Used by poll organizers at the venue.
     */
    public function generateQrCode(Poll $poll): JsonResponse
    {
        // Authorization check - only poll creator or org admin can generate
        $user = request()->user();

        if (! $this->canManagePollPresence($poll, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to manage presence verification for this poll.',
            ], 403);
        }

        if (! $poll->supportsOnPremiseVerification()) {
            return response()->json([
                'success' => false,
                'message' => 'This poll does not support on-premise verification.',
            ], 400);
        }

        $qrToken = $this->presenceService->generateQrToken($poll);

        return response()->json([
            'success' => true,
            'token' => $qrToken->token,
            'verification_url' => $qrToken->verification_url,
            'expires_at' => $qrToken->expires_at->toIso8601String(),
            'remaining_seconds' => $qrToken->remaining_seconds,
        ]);
    }

    /**
     * Get the current active QR token for a poll.
     */
    public function getActiveQrToken(Poll $poll): JsonResponse
    {
        $user = request()->user();

        if (! $this->canManagePollPresence($poll, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to view presence verification for this poll.',
            ], 403);
        }

        $qrToken = $this->presenceService->getActiveQrToken($poll);

        if (! $qrToken) {
            return response()->json([
                'success' => false,
                'message' => 'No active QR token found for this poll.',
            ]);
        }

        return response()->json([
            'success' => true,
            'token' => $qrToken->token,
            'verification_url' => $qrToken->verification_url,
            'expires_at' => $qrToken->expires_at->toIso8601String(),
            'remaining_seconds' => $qrToken->remaining_seconds,
        ]);
    }

    /**
     * Verify presence by scanning a QR code.
     * This is called when a user scans a QR code.
     */
    public function verifyPresence(Request $request): JsonResponse|Response
    {
        $request->validate([
            'token' => ['required', 'string', 'size:64'],
        ]);

        $user = $request->user();

        if (! $user) {
            // For unauthenticated users, redirect to login with the token
            return response()->json([
                'success' => false,
                'message' => 'Please log in to verify your presence.',
                'redirect' => route('login', ['redirect' => route('presence.verify', ['token' => $request->token])]),
            ], 401);
        }

        $result = $this->presenceService->verifyQrToken($request->token, $user);

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        $accessToken = $result['access_token'];

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'poll' => [
                'id' => $accessToken->poll->id,
                'question' => $accessToken->poll->question,
            ],
            'redirect' => route('polls.index'),
        ]);
    }

    /**
     * Handle QR code scan from the URL.
     * This is called when a user opens the verification URL from scanning a QR code.
     */
    public function scanQrCode(string $token): Response|RedirectResponse
    {
        $user = request()->user();

        if (! $user) {
            // Store token in session and redirect to login
            session(['pending_presence_token' => $token]);

            return redirect()->route('login')->with('message', 'Please log in to verify your presence.');
        }

        $result = $this->presenceService->verifyQrToken($token, $user);

        if (! $result['success']) {
            return Inertia::render('presence/verification-failed', [
                'message' => $result['message'],
            ]);
        }

        $accessToken = $result['access_token'];

        return redirect()
            ->route('polls.index')
            ->with('success', 'Presence verified successfully. You can now vote.');
    }

    /**
     * Get the user's verification status for a poll.
     */
    public function getVerificationStatus(Poll $poll): JsonResponse
    {
        $user = request()->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required.',
            ], 401);
        }

        $status = $this->presenceService->getUserVerificationStatus($poll, $user);
        $eligibility = $this->presenceService->checkVotingEligibility($poll, $user);

        return response()->json([
            'success' => true,
            'poll' => [
                'id' => $poll->id,
                'question' => $poll->question,
                'voting_access_mode' => $poll->voting_access_mode?->value ?? 'hybrid',
            ],
            'verification' => [
                'is_verified' => $status['is_verified'],
                'verification_type' => $status['verification_type']?->value,
                'can_vote_remotely' => $status['can_vote_remotely'],
                'requires_verification' => $status['requires_verification'],
            ],
            'eligibility' => [
                'can_vote' => $eligibility['can_vote'],
                'reason' => $eligibility['reason'] ?? null,
                'verification_type' => $eligibility['verification_type']?->value ?? null,
            ],
        ]);
    }

    /**
     * Check if the user can manage presence verification for a poll.
     */
    private function canManagePollPresence(Poll $poll, $user): bool
    {
        if (! $user) {
            return false;
        }

        // Poll creator can manage
        if ($poll->created_by === $user->id) {
            return true;
        }

        // Organization admin can manage
        if ($poll->organization_id && $user->organization_id === $poll->organization_id) {
            if ($user->isAdmin() || $user->isSuperAdmin()) {
                return true;
            }
        }

        // Super admin can manage any poll
        if ($user->isSuperAdmin()) {
            return true;
        }

        return false;
    }
}
