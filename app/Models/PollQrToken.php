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

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the poll that this QR token belongs to.
     */
    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    /**
     * Check if the QR token is valid (active and not expired).
     */
    public function isValid(): bool
    {
        return $this->is_active && $this->expires_at->isFuture();
    }

    /**
     * Check if the QR token has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Deactivate this QR token.
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    /**
     * Generate a new QR token for a poll.
     * This will deactivate any existing active tokens for the poll.
     *
     * @param  int  $ttlSeconds  Time to live in seconds (default: 120 seconds / 2 minutes)
     */
    public static function generateForPoll(Poll $poll, int $ttlSeconds = 120): self
    {
        // Deactivate any existing active tokens for this poll
        self::where('poll_id', $poll->id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        return self::create([
            'poll_id' => $poll->id,
            'token' => self::generateSecureToken(),
            'expires_at' => now()->addSeconds($ttlSeconds),
            'is_active' => true,
        ]);
    }

    /**
     * Refresh an existing token or generate a new one if expired.
     *
     * @param  int  $ttlSeconds  Time to live in seconds
     */
    public static function refreshForPoll(Poll $poll, int $ttlSeconds = 120): self
    {
        return self::generateForPoll($poll, $ttlSeconds);
    }

    /**
     * Find a valid token by its token string.
     */
    public static function findValidToken(string $token): ?self
    {
        return self::where('token', $token)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Get the active token for a poll if it exists and is valid.
     */
    public static function getActiveForPoll(Poll|int $poll): ?self
    {
        $pollId = $poll instanceof Poll ? $poll->id : $poll;

        return self::where('poll_id', $pollId)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Generate a cryptographically secure random token.
     */
    private static function generateSecureToken(): string
    {
        return Str::random(64);
    }

    /**
     * Scope to get only active tokens.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only valid (active and not expired) tokens.
     */
    public function scopeValid($query)
    {
        return $query->where('is_active', true)
            ->where('expires_at', '>', now());
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
     * Get the remaining time in seconds before the token expires.
     */
    public function getRemainingSecondsAttribute(): int
    {
        if ($this->isExpired()) {
            return 0;
        }

        return (int) now()->diffInSeconds($this->expires_at, false);
    }

    /**
     * Get the URL that should be encoded in the QR code.
     * This generates a verification URL that users can scan.
     */
    public function getVerificationUrlAttribute(): string
    {
        return route('presence.verify.scan', ['token' => $this->token]);
    }
}
