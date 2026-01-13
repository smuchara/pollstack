# Presence-Aware Voting Implementation Plan

## Overview

This document outlines the implementation plan for adding **Presence-Aware Voting** (On-Premise, Remote, Hybrid) to PollStack. The feature introduces voting access modes that determine how users can participate in polls based on presence verification.

---

## Table of Contents

1. [Feature Summary](#feature-summary)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Phases](#implementation-phases)
4. [Phase 1: Database & Backend Foundation](#phase-1-database--backend-foundation)
5. [Phase 2: QR Code & Verification System](#phase-2-qr-code--verification-system)
6. [Phase 3: Frontend UI Updates](#phase-3-frontend-ui-updates)
7. [Phase 4: Voting Flow Integration](#phase-4-voting-flow-integration)
8. [Phase 5: Testing & Validation](#phase-5-testing--validation)
9. [File Changes Summary](#file-changes-summary)

---

## Feature Summary

### Voting Access Modes

| Mode                 | Description                                                | Verification Required |
| -------------------- | ---------------------------------------------------------- | --------------------- |
| **Remote Only**      | Fully online participation                                 | No                    |
| **On-Premise Only**  | Must verify physical presence via QR code before voting    | Yes                   |
| **Hybrid** (Default) | Can vote remotely OR verify on-premise for stronger signal | Optional              |

### Key Principle

> **Presence is verified BEFORE voting, not during voting.**

- QR code scanning = check-in mechanism
- Check-in issues a short-lived, single-use Voting Access Token
- Token unlocks voting eligibility
- Voting logic remains unchanged; it simply checks eligibility

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         POLL CREATION                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ New Field: voting_access_mode (ENUM)                     │   │
│  │ Options: REMOTE_ONLY | ON_PREMISE_ONLY | HYBRID          │   │
│  │ Default: HYBRID                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      QR VERIFICATION FLOW                       │
│                                                                 │
│  1. Admin generates QR code for poll                            │
│  2. QR encodes short-lived verification token (60-120s TTL)     │
│  3. User scans QR → Backend validates token                     │
│  4. Backend issues Voting Access Token                          │
│     - poll_id, user_id, verification_type=ON_PREMISE            │
│  5. Token stored in voting_access_tokens table                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        VOTING FLOW                              │
│                                                                 │
│  PollVoteController::store()                                    │
│  ├── Check poll.voting_access_mode                              │
│  ├── REMOTE_ONLY → Allow immediately                            │
│  ├── ON_PREMISE_ONLY → Require valid access token               │
│  └── HYBRID → Allow (mark verification_type in vote)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database & Backend Foundation

**Estimated Effort:** 2-3 hours

#### 1.1 Create VotingAccessMode Enum

**File:** `app/Enums/VotingAccessMode.php`

```php
<?php

namespace App\Enums;

enum VotingAccessMode: string
{
    case RemoteOnly = 'remote_only';
    case OnPremiseOnly = 'on_premise_only';
    case Hybrid = 'hybrid';

    public function label(): string
    {
        return match ($this) {
            self::RemoteOnly => 'Remote Only',
            self::OnPremiseOnly => 'On-Premise Only',
            self::Hybrid => 'Hybrid',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::RemoteOnly => 'Fully online participation, no verification required',
            self::OnPremiseOnly => 'Users must verify physical presence via QR code before voting',
            self::Hybrid => 'Users may vote remotely or verify on-premise via QR code',
        };
    }

    public static function default(): self
    {
        return self::Hybrid;
    }
}
```

#### 1.2 Create VerificationType Enum

**File:** `app/Enums/VerificationType.php`

```php
<?php

namespace App\Enums;

enum VerificationType: string
{
    case Remote = 'remote';
    case OnPremise = 'on_premise';

    public function label(): string
    {
        return match ($this) {
            self::Remote => 'Remote',
            self::OnPremise => 'On-Premise',
        };
    }
}
```

#### 1.3 Database Migrations

**Migration 1:** Add voting_access_mode to polls table
**File:** `database/migrations/2026_01_13_XXXXXX_add_voting_access_mode_to_polls_table.php`

```php
Schema::table('polls', function (Blueprint $table) {
    $table->string('voting_access_mode')->default('hybrid')->after('visibility');
});
```

**Migration 2:** Create voting_access_tokens table
**File:** `database/migrations/2026_01_13_XXXXXX_create_voting_access_tokens_table.php`

```php
Schema::create('voting_access_tokens', function (Blueprint $table) {
    $table->id();
    $table->foreignId('poll_id')->constrained()->onDelete('cascade');
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('verification_type'); // 'remote' or 'on_premise'
    $table->timestamp('issued_at');
    $table->timestamp('expires_at');
    $table->timestamp('consumed_at')->nullable();
    $table->timestamps();

    // Unique constraint: one token per user per poll
    $table->unique(['poll_id', 'user_id']);

    // Index for quick lookups
    $table->index(['poll_id', 'user_id', 'expires_at']);
});
```

**Migration 3:** Create poll_qr_tokens table
**File:** `database/migrations/2026_01_13_XXXXXX_create_poll_qr_tokens_table.php`

```php
Schema::create('poll_qr_tokens', function (Blueprint $table) {
    $table->id();
    $table->foreignId('poll_id')->constrained()->onDelete('cascade');
    $table->string('token', 64)->unique(); // Cryptographically secure token
    $table->timestamp('expires_at');
    $table->boolean('is_active')->default(true);
    $table->timestamps();

    $table->index(['token', 'expires_at', 'is_active']);
});
```

**Migration 4:** Add verification_type to votes table
**File:** `database/migrations/2026_01_13_XXXXXX_add_verification_type_to_votes_table.php`

```php
Schema::table('votes', function (Blueprint $table) {
    $table->string('verification_type')->nullable()->after('ip_address');
});
```

#### 1.4 Update Poll Model

**File:** `app/Models/Poll.php`

Add:

- Constant definitions for access modes
- `voting_access_mode` to `$fillable`
- Cast for voting_access_mode enum
- Helper methods: `isRemoteOnly()`, `isOnPremiseOnly()`, `isHybrid()`
- Relationship to `votingAccessTokens()`
- Relationship to `qrTokens()`

#### 1.5 Create VotingAccessToken Model

**File:** `app/Models/VotingAccessToken.php`

```php
<?php

namespace App\Models;

use App\Enums\VerificationType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VotingAccessToken extends Model
{
    protected $fillable = [
        'poll_id',
        'user_id',
        'verification_type',
        'issued_at',
        'expires_at',
        'consumed_at',
    ];

    protected function casts(): array
    {
        return [
            'verification_type' => VerificationType::class,
            'issued_at' => 'datetime',
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isValid(): bool
    {
        return $this->expires_at->isFuture() && is_null($this->consumed_at);
    }

    public function consume(): void
    {
        $this->update(['consumed_at' => now()]);
    }
}
```

#### 1.6 Create PollQrToken Model

**File:** `app/Models/PollQrToken.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PollQrToken extends Model
{
    protected $fillable = [
        'poll_id',
        'token',
        'expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    public function isValid(): bool
    {
        return $this->is_active && $this->expires_at->isFuture();
    }

    public static function generateForPoll(Poll $poll, int $ttlSeconds = 120): self
    {
        // Deactivate any existing tokens for this poll
        self::where('poll_id', $poll->id)->update(['is_active' => false]);

        return self::create([
            'poll_id' => $poll->id,
            'token' => Str::random(64),
            'expires_at' => now()->addSeconds($ttlSeconds),
            'is_active' => true,
        ]);
    }
}
```

---

### Phase 2: QR Code & Verification System

**Estimated Effort:** 3-4 hours

#### 2.1 Create QR Code Generation Controller

**File:** `app/Http/Controllers/Admin/PollQrController.php`

Endpoints:

- `GET  /admin/polls/{poll}/qr` - Generate/refresh QR code
- `GET  /admin/polls/{poll}/qr/status` - Get current QR token status

#### 2.2 Create Presence Verification Controller

**File:** `app/Http/Controllers/PresenceVerificationController.php`

Endpoints:

- `POST /presence/verify` - Verify QR token and issue voting access token
    - Request body: `{ qr_token: string }`
    - Validates token, issues VotingAccessToken
- `GET  /presence/status/{poll}` - Check user's verification status for a poll

#### 2.3 Create VotingAccessService

**File:** `app/Services/VotingAccessService.php`

```php
<?php

namespace App\Services;

use App\Enums\VerificationType;
use App\Enums\VotingAccessMode;
use App\Models\Poll;
use App\Models\PollQrToken;
use App\Models\User;
use App\Models\VotingAccessToken;

class VotingAccessService
{
    /**
     * Check if user can vote on the poll.
     */
    public function canVote(Poll $poll, User $user): array
    {
        // First check basic eligibility (organization, visibility, etc.)
        if (!$poll->canBeVotedOnBy($user)) {
            return ['allowed' => false, 'reason' => 'not_eligible'];
        }

        // Check if already voted
        if ($poll->votes()->where('user_id', $user->id)->exists()) {
            return ['allowed' => false, 'reason' => 'already_voted'];
        }

        // Check access mode requirements
        return match ($poll->voting_access_mode) {
            VotingAccessMode::RemoteOnly->value => ['allowed' => true, 'verification_type' => 'remote'],
            VotingAccessMode::OnPremiseOnly->value => $this->checkOnPremiseAccess($poll, $user),
            VotingAccessMode::Hybrid->value => $this->checkHybridAccess($poll, $user),
            default => ['allowed' => true, 'verification_type' => 'remote'],
        };
    }

    private function checkOnPremiseAccess(Poll $poll, User $user): array
    {
        $token = $this->getValidToken($poll, $user);

        if (!$token || $token->verification_type !== VerificationType::OnPremise) {
            return [
                'allowed' => false,
                'reason' => 'on_premise_verification_required',
                'message' => 'On-site verification required. Please scan the QR code.',
            ];
        }

        return ['allowed' => true, 'verification_type' => 'on_premise'];
    }

    private function checkHybridAccess(Poll $poll, User $user): array
    {
        $token = $this->getValidToken($poll, $user);

        return [
            'allowed' => true,
            'verification_type' => $token?->verification_type?->value ?? 'remote',
            'is_verified_on_premise' => $token?->verification_type === VerificationType::OnPremise,
        ];
    }

    public function getValidToken(Poll $poll, User $user): ?VotingAccessToken
    {
        return VotingAccessToken::where('poll_id', $poll->id)
            ->where('user_id', $user->id)
            ->where('expires_at', '>', now())
            ->whereNull('consumed_at')
            ->first();
    }

    public function verifyQrToken(string $qrToken, User $user): array
    {
        $pollQrToken = PollQrToken::where('token', $qrToken)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->first();

        if (!$pollQrToken) {
            return ['success' => false, 'error' => 'invalid_or_expired_token'];
        }

        // Create/update voting access token
        $accessToken = VotingAccessToken::updateOrCreate(
            [
                'poll_id' => $pollQrToken->poll_id,
                'user_id' => $user->id,
            ],
            [
                'verification_type' => VerificationType::OnPremise,
                'issued_at' => now(),
                'expires_at' => now()->addHours(4), // Access valid for 4 hours
                'consumed_at' => null,
            ]
        );

        return [
            'success' => true,
            'poll_id' => $pollQrToken->poll_id,
            'access_token' => $accessToken,
        ];
    }
}
```

#### 2.4 Update Routes

**File:** `routes/tenant.php`

Add new routes for admin:

```php
// QR Code Management
Route::get('polls/{poll}/qr', [PollQrController::class, 'generate'])->name('polls.qr.generate');
Route::get('polls/{poll}/qr/status', [PollQrController::class, 'status'])->name('polls.qr.status');
```

**File:** `routes/web.php`

Add new routes for users:

```php
// Presence Verification
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/presence/verify', [PresenceVerificationController::class, 'verify'])->name('presence.verify');
    Route::get('/presence/status/{poll}', [PresenceVerificationController::class, 'status'])->name('presence.status');
});
```

---

### Phase 3: Frontend UI Updates

**Estimated Effort:** 4-5 hours

#### 3.1 Update Poll Creation Form

**Files to modify:**

- `resources/js/components/polls/poll-form-shared.tsx`
- `resources/js/components/polls/poll-creation-drawer.tsx`

Add new section: **Voting Access Mode**

- Radio buttons or segmented control
- Options: Remote Only, On-Premise Only, Hybrid (Default)
- Description text for each option

#### 3.2 Create VotingAccessModeSelector Component

**File:** `resources/js/components/polls/voting-access-mode-selector.tsx`

```tsx
import { Globe, MapPin, Shuffle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type VotingAccessMode = 'remote_only' | 'on_premise_only' | 'hybrid';

interface VotingAccessModeSelectorProps {
    value: VotingAccessMode;
    onChange: (value: VotingAccessMode) => void;
    disabled?: boolean;
}

const modes = [
    {
        value: 'remote_only' as const,
        label: 'Remote Only',
        description: 'Fully online participation. No verification required.',
        icon: Globe,
    },
    {
        value: 'on_premise_only' as const,
        label: 'On-Premise Only',
        description:
            'Users must verify physical presence via QR code before voting.',
        icon: MapPin,
    },
    {
        value: 'hybrid' as const,
        label: 'Hybrid',
        description:
            'Users may vote remotely or verify on-premise via QR code.',
        icon: Shuffle,
        default: true,
    },
];

export function VotingAccessModeSelector({
    value,
    onChange,
    disabled,
}: VotingAccessModeSelectorProps) {
    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Voting Access Mode</Label>
            <p className="text-muted-foreground text-sm">
                Choose how participants are allowed to vote in this poll.
            </p>
            <RadioGroup
                value={value}
                onValueChange={(v) => onChange(v as VotingAccessMode)}
                disabled={disabled}
                className="grid gap-3"
            >
                {modes.map((mode) => (
                    <div
                        key={mode.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${value === mode.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'} ${disabled ? 'cursor-not-allowed opacity-50' : ''} `}
                        onClick={() => !disabled && onChange(mode.value)}
                    >
                        <RadioGroupItem
                            value={mode.value}
                            id={mode.value}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <mode.icon className="text-muted-foreground h-4 w-4" />
                                <Label
                                    htmlFor={mode.value}
                                    className="cursor-pointer font-medium"
                                >
                                    {mode.label}
                                </Label>
                                {mode.default && (
                                    <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs">
                                        Default
                                    </span>
                                )}
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {mode.description}
                            </p>
                        </div>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
}
```

#### 3.3 Create QR Code Display Component (Admin)

**File:** `resources/js/components/polls/poll-qr-code.tsx`

For admin to display QR code to on-premise participants.

#### 3.4 Create Presence Verification Modal (User)

**File:** `resources/js/components/polls/presence-verification-modal.tsx`

Modal that appears when:

- `ON_PREMISE_ONLY` poll and user not verified
- `HYBRID` poll offering choice between remote & on-premise

#### 3.5 Create QR Scanner Component

**File:** `resources/js/components/polls/qr-scanner.tsx`

Use a library like `html5-qrcode` or `react-qr-reader` for camera-based scanning.

#### 3.6 Update Poll Type/Interface Definitions

**File:** `resources/js/types/index.d.ts` or inline types

Add:

```typescript
type VotingAccessMode = 'remote_only' | 'on_premise_only' | 'hybrid';
type VerificationType = 'remote' | 'on_premise';

interface Poll {
    // ... existing fields
    voting_access_mode: VotingAccessMode;
}

interface Vote {
    // ... existing fields
    verification_type?: VerificationType;
}
```

---

### Phase 4: Voting Flow Integration

**Estimated Effort:** 2-3 hours

#### 4.1 Update PollVoteController

**File:** `app/Http/Controllers/PollVoteController.php`

```php
public function store(Request $request, Poll $poll)
{
    $user = $request->user();
    $votingAccessService = app(VotingAccessService::class);

    // Check voting access
    $accessCheck = $votingAccessService->canVote($poll, $user);

    if (!$accessCheck['allowed']) {
        throw ValidationException::withMessages([
            'poll' => $this->getAccessErrorMessage($accessCheck['reason']),
        ]);
    }

    // Create vote with verification type
    Vote::create([
        'poll_id' => $poll->id,
        'poll_option_id' => $validated['option_id'],
        'user_id' => $user->id,
        'ip_address' => $request->ip(),
        'verification_type' => $accessCheck['verification_type'] ?? null,
    ]);

    // Consume the access token if it exists
    if ($token = $votingAccessService->getValidToken($poll, $user)) {
        $token->consume();
    }

    return back()->with('success', 'Vote cast successfully.');
}
```

#### 4.2 Update PollController (Frontend Data)

**File:** `app/Http/Controllers/PollController.php`

Add to the poll data transformation:

- `voting_access_mode`
- `user_verification_status` (for the current user)
- `requires_verification` (computed based on access mode)

#### 4.3 Update Poll Index Page (User-facing)

**File:** `resources/js/pages/polls/index.tsx`

Update `renderActivePoll` to:

1. Check `poll.voting_access_mode`
2. For `on_premise_only`: Show verification prompt instead of vote options if not verified
3. For `hybrid`: Show choice between "Continue Remotely" and "I'm On-Premise (Scan QR)"

---

### Phase 5: Testing & Validation

**Estimated Effort:** 3-4 hours

#### 5.1 Unit Tests

**File:** `tests/Unit/VotingAccessServiceTest.php`

- Test `canVote()` for each access mode
- Test QR token verification
- Test token expiration

**File:** `tests/Unit/PollQrTokenTest.php`

- Test token generation
- Test token validation
- Test token deactivation

#### 5.2 Feature Tests

**File:** `tests/Feature/PresenceAwareVotingTest.php`

- Test creating polls with different access modes
- Test voting flow for each access mode
- Test QR code generation and verification
- Test error cases (expired token, already voted, etc.)

**File:** `tests/Feature/PollQrCodeTest.php`

- Test QR code generation endpoint
- Test QR token refresh
- Test admin-only access to QR generation

#### 5.3 Browser Tests (Pest v4)

**File:** `tests/Browser/PresenceVerificationFlowTest.php`

- End-to-end test of the verification flow
- Test modal interactions
- Test QR scanner (with mock)

---

## File Changes Summary

### New Files

| File                                                                | Type       | Description                |
| ------------------------------------------------------------------- | ---------- | -------------------------- |
| `app/Enums/VotingAccessMode.php`                                    | Enum       | Voting access mode options |
| `app/Enums/VerificationType.php`                                    | Enum       | Verification type options  |
| `app/Models/VotingAccessToken.php`                                  | Model      | Voting access token model  |
| `app/Models/PollQrToken.php`                                        | Model      | QR token model             |
| `app/Services/VotingAccessService.php`                              | Service    | Voting access logic        |
| `app/Http/Controllers/Admin/PollQrController.php`                   | Controller | QR code management         |
| `app/Http/Controllers/PresenceVerificationController.php`           | Controller | Presence verification      |
| `database/migrations/..._add_voting_access_mode_to_polls_table.php` | Migration  | Add field to polls         |
| `database/migrations/..._create_voting_access_tokens_table.php`     | Migration  | Create tokens table        |
| `database/migrations/..._create_poll_qr_tokens_table.php`           | Migration  | Create QR tokens table     |
| `database/migrations/..._add_verification_type_to_votes_table.php`  | Migration  | Track verification type    |
| `resources/js/components/polls/voting-access-mode-selector.tsx`     | Component  | Access mode selector       |
| `resources/js/components/polls/poll-qr-code.tsx`                    | Component  | QR code display            |
| `resources/js/components/polls/presence-verification-modal.tsx`     | Component  | Verification modal         |
| `resources/js/components/polls/qr-scanner.tsx`                      | Component  | QR scanner                 |
| `tests/Feature/PresenceAwareVotingTest.php`                         | Test       | Feature tests              |
| `tests/Unit/VotingAccessServiceTest.php`                            | Test       | Unit tests                 |

### Modified Files

| File                                                     | Changes                                             |
| -------------------------------------------------------- | --------------------------------------------------- |
| `app/Models/Poll.php`                                    | Add voting_access_mode field, casts, helper methods |
| `app/Models/Vote.php`                                    | Add verification_type field                         |
| `app/Http/Controllers/PollVoteController.php`            | Integrate access checking                           |
| `app/Http/Controllers/PollController.php`                | Pass verification status to frontend                |
| `app/Http/Controllers/Admin/PollController.php`          | Handle voting_access_mode in CRUD                   |
| `app/Http/Requests/Admin/StorePollRequest.php`           | Validate voting_access_mode                         |
| `app/Http/Requests/Admin/UpdatePollRequest.php`          | Validate voting_access_mode                         |
| `routes/tenant.php`                                      | Add QR code routes                                  |
| `routes/web.php`                                         | Add presence verification routes                    |
| `resources/js/components/polls/poll-form-shared.tsx`     | Add VotingAccessModeSelector                        |
| `resources/js/components/polls/poll-creation-drawer.tsx` | Handle voting_access_mode state                     |
| `resources/js/pages/polls/index.tsx`                     | Integrate verification flow                         |
| `resources/js/pages/admin/polls.tsx`                     | Display voting_access_mode                          |
| `database/factories/PollFactory.php`                     | Add voting_access_mode to factory                   |

---

## Backward Compatibility

1. **Existing polls**: Will default to `hybrid` access mode (most permissive)
2. **Existing votes**: Will have `null` verification_type (untracked)
3. **Existing voting flows**: Continue to work unchanged
4. **API responses**: New fields are additive, not breaking

---

## Dependencies

### NPM Packages (Frontend)

- `html5-qrcode` or `@yudiel/react-qr-scanner` - For QR code scanning
- `qrcode.react` - For QR code generation/display

### Composer Packages (Backend)

- No additional packages required

---

## Implementation Order

1. ✅ Create Enums (VotingAccessMode, VerificationType)
2. ✅ Create Migrations
3. ✅ Create Models (VotingAccessToken, PollQrToken)
4. ✅ Update Poll Model
5. ✅ Update Vote Model
6. ✅ Create VotingAccessService
7. ✅ Create Controllers (PollQrController, PresenceVerificationController)
8. ✅ Update PollVoteController
9. ✅ Update routes
10. ✅ Update Form Requests
11. ✅ Create Frontend Components
12. ✅ Integrate into Poll Creation Form
13. ✅ Integrate into Voting Flow
14. ✅ Write Tests
15. ✅ Run Pint & ESLint
16. ✅ Run Full Test Suite

---

## Questions for Clarification

1. **QR Token Lifespan**: The spec mentions 60-120 seconds. Should this be configurable per-poll or organization?
2. **Voting Access Token Duration**: How long should the on-premise verification remain valid? (Suggested: 4 hours or until poll ends)
3. **Multiple Devices**: If a user scans QR on their phone, can they then vote on their laptop?
4. **Admin QR Display**: Should there be a dedicated admin page for displaying the QR code on a presentation screen?

---

## Ready to Proceed

This implementation plan covers all aspects of the Presence-Aware Voting feature. Would you like me to begin implementation starting with Phase 1 (Database & Backend Foundation)?
