<?php

namespace App\Services;

use App\Enums\VerificationType;
use App\Enums\VotingAccessMode;
use App\Models\Poll;
use App\Models\PollQrToken;
use App\Models\User;
use App\Models\VotingAccessToken;

class PresenceVerificationService
{
    /**
     * Default QR token time-to-live in seconds (2 minutes).
     */
    public const QR_TOKEN_TTL = 120;

    /**
     * Default voting access token time-to-live in seconds (24 hours).
     */
    public const ACCESS_TOKEN_TTL = 86400;

    /**
     * Generate a new QR token for a poll.
     *
     * @param  int  $ttlSeconds  Time to live in seconds
     */
    public function generateQrToken(Poll $poll, int $ttlSeconds = self::QR_TOKEN_TTL): PollQrToken
    {
        if (! $poll->supportsOnPremiseVerification()) {
            throw new \InvalidArgumentException('This poll does not support on-premise verification.');
        }

        return PollQrToken::generateForPoll($poll, $ttlSeconds);
    }

    /**
     * Refresh an existing QR token for a poll.
     */
    public function refreshQrToken(Poll $poll, int $ttlSeconds = self::QR_TOKEN_TTL): PollQrToken
    {
        return $this->generateQrToken($poll, $ttlSeconds);
    }

    /**
     * Get the current active QR token for a poll.
     */
    public function getActiveQrToken(Poll $poll): ?PollQrToken
    {
        return PollQrToken::getActiveForPoll($poll);
    }

    /**
     * Verify a QR token and issue a voting access token.
     *
     * @return array{success: bool, message: string, access_token?: VotingAccessToken}
     */
    public function verifyQrToken(string $token, User $user): array
    {
        $qrToken = PollQrToken::findValidToken($token);

        if (! $qrToken) {
            return [
                'success' => false,
                'message' => 'Invalid or expired QR code. Please scan a valid QR code.',
            ];
        }

        $poll = $qrToken->poll;

        // Check if poll supports on-premise verification
        if (! $poll->supportsOnPremiseVerification()) {
            return [
                'success' => false,
                'message' => 'This poll does not support on-premise verification.',
            ];
        }

        // Check if poll can be voted on by this user
        if (! $poll->canBeVotedOnBy($user)) {
            return [
                'success' => false,
                'message' => 'You are not eligible to vote in this poll.',
            ];
        }

        // Check if poll is active
        if (! $poll->isActiveNow()) {
            return [
                'success' => false,
                'message' => 'This poll is not currently active.',
            ];
        }

        // Check if user already has a valid on-premise access token
        $existingToken = VotingAccessToken::forPoll($poll)
            ->forUser($user)
            ->valid()
            ->first();

        if ($existingToken && $existingToken->isOnPremise()) {
            return [
                'success' => true,
                'message' => 'You have already verified your presence for this poll.',
                'access_token' => $existingToken,
            ];
        }

        // Issue a new voting access token
        $accessToken = $this->issueVotingAccessToken($poll, $user, VerificationType::OnPremise);

        return [
            'success' => true,
            'message' => 'Presence verified successfully. You can now vote.',
            'access_token' => $accessToken,
        ];
    }

    /**
     * Issue a voting access token for a user.
     *
     * @param  int  $ttlSeconds  Time to live in seconds
     */
    public function issueVotingAccessToken(
        Poll $poll,
        User $user,
        VerificationType $verificationType,
        int $ttlSeconds = self::ACCESS_TOKEN_TTL
    ): VotingAccessToken {
        // Delete any existing tokens for this user/poll combination
        VotingAccessToken::forPoll($poll)
            ->forUser($user)
            ->delete();

        return VotingAccessToken::create([
            'poll_id' => $poll->id,
            'user_id' => $user->id,
            'verification_type' => $verificationType,
            'issued_at' => now(),
            'expires_at' => now()->addSeconds($ttlSeconds),
        ]);
    }

    /**
     * Issue a remote voting access token for a user.
     */
    public function issueRemoteAccessToken(Poll $poll, User $user): VotingAccessToken
    {
        if (! $poll->supportsRemoteVoting()) {
            throw new \InvalidArgumentException('This poll does not support remote voting.');
        }

        return $this->issueVotingAccessToken($poll, $user, VerificationType::Remote);
    }

    /**
     * Check if a user can vote on a poll based on their verification status.
     *
     * @return array{can_vote: bool, reason?: string, verification_type?: VerificationType}
     */
    public function checkVotingEligibility(Poll $poll, User $user): array
    {
        // Basic eligibility check
        if (! $poll->canBeVotedOnBy($user)) {
            return [
                'can_vote' => false,
                'reason' => 'You are not eligible to vote in this poll.',
            ];
        }

        // Check if poll is active
        if (! $poll->isActiveNow()) {
            return [
                'can_vote' => false,
                'reason' => 'This poll is not currently active.',
            ];
        }

        // Check voting access mode
        $accessMode = $poll->voting_access_mode ?? VotingAccessMode::Hybrid;

        switch ($accessMode) {
            case VotingAccessMode::RemoteOnly:
                // No verification needed
                return [
                    'can_vote' => true,
                    'verification_type' => VerificationType::Remote,
                ];

            case VotingAccessMode::OnPremiseOnly:
                // Must have on-premise verification
                $accessToken = VotingAccessToken::forPoll($poll)
                    ->forUser($user)
                    ->valid()
                    ->first();

                if (! $accessToken || ! $accessToken->isOnPremise()) {
                    return [
                        'can_vote' => false,
                        'reason' => 'On-site verification is required for this poll. Please scan the QR code at the venue.',
                    ];
                }

                return [
                    'can_vote' => true,
                    'verification_type' => VerificationType::OnPremise,
                ];

            case VotingAccessMode::Hybrid:
            default:
                // Check if user has on-premise verification
                $accessToken = VotingAccessToken::forPoll($poll)
                    ->forUser($user)
                    ->valid()
                    ->first();

                if ($accessToken && $accessToken->isOnPremise()) {
                    return [
                        'can_vote' => true,
                        'verification_type' => VerificationType::OnPremise,
                    ];
                }

                // Can vote remotely
                return [
                    'can_vote' => true,
                    'verification_type' => VerificationType::Remote,
                ];
        }
    }

    /**
     * Get the user's verification status for a poll.
     *
     * @return array{is_verified: bool, verification_type: ?VerificationType, can_vote_remotely: bool, requires_verification: bool}
     */
    public function getUserVerificationStatus(Poll $poll, User $user): array
    {
        $accessToken = VotingAccessToken::forPoll($poll)
            ->forUser($user)
            ->valid()
            ->first();

        return [
            'is_verified' => $accessToken !== null && $accessToken->isOnPremise(),
            'verification_type' => $accessToken?->verification_type,
            'can_vote_remotely' => $poll->supportsRemoteVoting(),
            'requires_verification' => $poll->requiresOnPremiseVerification(),
        ];
    }
}
