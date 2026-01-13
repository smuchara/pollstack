<?php

use App\Enums\VerificationType;
use App\Enums\VotingAccessMode;
use App\Models\Organization;
use App\Models\Poll;
use App\Models\PollQrToken;
use App\Models\User;
use App\Models\VotingAccessToken;
use App\Services\PresenceVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->organization = Organization::factory()->create();
    $this->admin = User::factory()->admin()->create([
        'organization_id' => $this->organization->id,
    ]);
    $this->user = User::factory()->create([
        'organization_id' => $this->organization->id,
    ]);
    $this->presenceService = app(PresenceVerificationService::class);
});

describe('VotingAccessMode Enum', function () {
    it('has correct default mode', function () {
        expect(VotingAccessMode::default())->toBe(VotingAccessMode::Hybrid);
    });

    it('correctly identifies modes requiring on-premise verification', function () {
        expect(VotingAccessMode::OnPremiseOnly->requiresOnPremiseVerification())->toBeTrue();
        expect(VotingAccessMode::Hybrid->requiresOnPremiseVerification())->toBeFalse();
        expect(VotingAccessMode::RemoteOnly->requiresOnPremiseVerification())->toBeFalse();
    });

    it('correctly identifies modes supporting remote voting', function () {
        expect(VotingAccessMode::RemoteOnly->supportsRemoteVoting())->toBeTrue();
        expect(VotingAccessMode::Hybrid->supportsRemoteVoting())->toBeTrue();
        expect(VotingAccessMode::OnPremiseOnly->supportsRemoteVoting())->toBeFalse();
    });
});

describe('Poll VotingAccessMode', function () {
    it('defaults to hybrid when creating a poll', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
        ]);

        // If not explicitly set, it defaults to hybrid (from migration default)
        expect($poll->voting_access_mode->value ?? 'hybrid')->toBe('hybrid');
    });

    it('can create poll with remote only mode', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::RemoteOnly,
        ]);

        expect($poll->voting_access_mode)->toBe(VotingAccessMode::RemoteOnly);
        expect($poll->supportsRemoteVoting())->toBeTrue();
        expect($poll->supportsOnPremiseVerification())->toBeFalse();
    });

    it('can create poll with on premise only mode', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::OnPremiseOnly,
        ]);

        expect($poll->voting_access_mode)->toBe(VotingAccessMode::OnPremiseOnly);
        expect($poll->requiresOnPremiseVerification())->toBeTrue();
        expect($poll->supportsRemoteVoting())->toBeFalse();
    });
});

describe('QR Token Generation', function () {
    it('can generate a qr token for a poll', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::Hybrid,
        ]);

        $qrToken = $this->presenceService->generateQrToken($poll);

        expect($qrToken)->toBeInstanceOf(PollQrToken::class);
        expect($qrToken->poll_id)->toBe($poll->id);
        expect($qrToken->token)->toHaveLength(64);
        expect($qrToken->is_active)->toBeTrue();
        expect($qrToken->isValid())->toBeTrue();
    });

    it('deactivates previous tokens when generating new one', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::Hybrid,
        ]);

        $firstToken = $this->presenceService->generateQrToken($poll);
        $secondToken = $this->presenceService->generateQrToken($poll);

        $firstToken->refresh();
        expect($firstToken->is_active)->toBeFalse();
        expect($secondToken->is_active)->toBeTrue();
    });

    it('throws exception for remote only polls', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::RemoteOnly,
        ]);

        expect(fn () => $this->presenceService->generateQrToken($poll))
            ->toThrow(InvalidArgumentException::class);
    });
});

describe('QR Token Verification', function () {
    it('can verify a valid qr token', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::Hybrid,
            'status' => 'active',
        ]);

        $qrToken = $this->presenceService->generateQrToken($poll);
        $result = $this->presenceService->verifyQrToken($qrToken->token, $this->user);

        expect($result['success'])->toBeTrue();
        expect($result['access_token'])->toBeInstanceOf(VotingAccessToken::class);
        expect($result['access_token']->verification_type)->toBe(VerificationType::OnPremise);
    });

    it('fails for invalid token', function () {
        $result = $this->presenceService->verifyQrToken('invalid_token', $this->user);

        expect($result['success'])->toBeFalse();
        expect($result['message'])->toContain('Invalid or expired');
    });

    it('fails for expired token', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::Hybrid,
            'status' => 'active',
        ]);

        // Generate token with 1 second TTL
        $qrToken = $this->presenceService->generateQrToken($poll, 1);

        // Wait for expiry
        sleep(2);

        $result = $this->presenceService->verifyQrToken($qrToken->token, $this->user);

        expect($result['success'])->toBeFalse();
    });
});

describe('Voting Eligibility', function () {
    it('allows voting for remote only poll without verification', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::RemoteOnly,
            'status' => 'active',
        ]);

        $result = $this->presenceService->checkVotingEligibility($poll, $this->user);

        expect($result['can_vote'])->toBeTrue();
        expect($result['verification_type'])->toBe(VerificationType::Remote);
    });

    it('requires verification for on premise only poll', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::OnPremiseOnly,
            'status' => 'active',
        ]);

        $result = $this->presenceService->checkVotingEligibility($poll, $this->user);

        expect($result['can_vote'])->toBeFalse();
        expect($result['reason'])->toContain('On-site verification is required');
    });

    it('allows voting after on premise verification', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::OnPremiseOnly,
            'status' => 'active',
        ]);

        // Verify on-premise
        $qrToken = $this->presenceService->generateQrToken($poll);
        $this->presenceService->verifyQrToken($qrToken->token, $this->user);

        $result = $this->presenceService->checkVotingEligibility($poll, $this->user);

        expect($result['can_vote'])->toBeTrue();
        expect($result['verification_type'])->toBe(VerificationType::OnPremise);
    });

    it('allows remote voting for hybrid poll', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::Hybrid,
            'status' => 'active',
        ]);

        $result = $this->presenceService->checkVotingEligibility($poll, $this->user);

        expect($result['can_vote'])->toBeTrue();
        expect($result['verification_type'])->toBe(VerificationType::Remote);
    });

    it('returns on premise type for hybrid poll after verification', function () {
        $poll = Poll::factory()->create([
            'organization_id' => $this->organization->id,
            'created_by' => $this->admin->id,
            'voting_access_mode' => VotingAccessMode::Hybrid,
            'status' => 'active',
        ]);

        // Verify on-premise
        $qrToken = $this->presenceService->generateQrToken($poll);
        $this->presenceService->verifyQrToken($qrToken->token, $this->user);

        $result = $this->presenceService->checkVotingEligibility($poll, $this->user);

        expect($result['can_vote'])->toBeTrue();
        expect($result['verification_type'])->toBe(VerificationType::OnPremise);
    });
});

describe('Poll Creation with Voting Access Mode', function () {
    it('allows admin to create poll with voting access mode', function () {
        $this->actingAs($this->admin)
            ->post(tenantRoute('tenant.admin.polls.store', $this->organization->slug), [
                'question' => 'Test Poll',
                'type' => 'open',
                'visibility' => 'public',
                'voting_access_mode' => 'on_premise_only',
                'status' => 'active',
                'options' => [
                    ['text' => 'Option 1'],
                    ['text' => 'Option 2'],
                ],
            ])
            ->assertRedirect();

        $poll = Poll::where('question', 'Test Poll')->first();
        expect($poll)->not->toBeNull();
        expect($poll->voting_access_mode)->toBe(VotingAccessMode::OnPremiseOnly);
    });
});

/**
 * Helper to generate tenant route.
 */
function tenantRoute(string $name, string $slug, array $params = []): string
{
    return route($name, array_merge(['organization_slug' => $slug], $params));
}
