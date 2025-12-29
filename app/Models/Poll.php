<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Poll extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'question',
        'description',
        'type',
        'status',
        'start_at',
        'end_at',
        'created_by',
        'organization_id',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    /**
     * Get the organization that owns the poll.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the user who created the poll.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the options for the poll.
     */
    public function options(): HasMany
    {
        return $this->hasMany(PollOption::class)->orderBy('order');
    }

    /**
     * Get the votes for the poll.
     */
    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    /**
     * Scope a query to only include polls for a specific organization.
     */
    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    /**
     * Scope a query to only include system polls.
     */
    public function scopeSystem($query)
    {
        return $query->whereNull('organization_id');
    }

    /**
     * Scope a query to only include active polls.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Check if the poll has ended based on end_at timestamp.
     */
    public function hasEnded(): bool
    {
        if (! $this->end_at) {
            return false;
        }

        return now()->isAfter($this->end_at);
    }

    /**
     * Check if the poll should be activated (scheduled -> active).
     */
    public function shouldBeActivated(): bool
    {
        if ($this->status !== 'scheduled') {
            return false;
        }

        if (! $this->start_at) {
            return false;
        }

        return now()->isAfter($this->start_at) || now()->equalTo($this->start_at);
    }

    /**
     * Check if the poll is currently active (status & time-based).
     */
    public function isActiveNow(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        // Check if poll has ended
        if ($this->hasEnded()) {
            return false;
        }

        // Check if poll has started
        if ($this->start_at && now()->isBefore($this->start_at)) {
            return false;
        }

        return true;
    }

    /**
     * Check if the poll can be voted on by the given user.
     * System polls (organization_id = null) can only be voted on by users without an organization.
     * Organization polls can only be voted on by users in that specific organization.
     */
    public function canBeVotedOnBy(User $user): bool
    {
        // System poll (no organization)
        if ($this->organization_id === null) {
            // Only users without organization can vote on system polls
            // This prevents organization users AND super admins with organizations from voting
            return $user->organization_id === null;
        }

        // Organization poll
        // Only users from the same organization can vote
        // This prevents super admins (who have no organization) from voting on org polls
        return $user->organization_id === $this->organization_id;
    }
}
