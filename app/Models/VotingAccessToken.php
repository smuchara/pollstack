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

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'verification_type' => VerificationType::class,
            'issued_at' => 'datetime',
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }

    /**
     * Get the poll that this token belongs to.
     */
    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    /**
     * Get the user that this token belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the token is valid (not expired and not consumed).
     */
    public function isValid(): bool
    {
        return $this->expires_at->isFuture() && is_null($this->consumed_at);
    }

    /**
     * Check if the token has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the token has been consumed.
     */
    public function isConsumed(): bool
    {
        return ! is_null($this->consumed_at);
    }

    /**
     * Mark the token as consumed.
     */
    public function consume(): void
    {
        $this->update(['consumed_at' => now()]);
    }

    /**
     * Check if this is an on-premise verification.
     */
    public function isOnPremise(): bool
    {
        return $this->verification_type === VerificationType::OnPremise;
    }

    /**
     * Check if this is a remote verification.
     */
    public function isRemote(): bool
    {
        return $this->verification_type === VerificationType::Remote;
    }

    /**
     * Scope to get only valid (not expired, not consumed) tokens.
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now())
            ->whereNull('consumed_at');
    }

    /**
     * Scope to get tokens for a specific poll.
     */
    public function scopeForPoll($query, Poll|int $poll)
    {
        $pollId = $poll instanceof Poll ? $poll->id : $poll;

        return $query->where('poll_id', $pollId);
    }

    /**
     * Scope to get tokens for a specific user.
     */
    public function scopeForUser($query, User|int $user)
    {
        $userId = $user instanceof User ? $user->id : $user;

        return $query->where('user_id', $userId);
    }
}
