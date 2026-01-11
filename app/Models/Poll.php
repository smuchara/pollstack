<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Poll extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Poll visibility types.
     */
    public const VISIBILITY_PUBLIC = 'public';

    public const VISIBILITY_INVITE_ONLY = 'invite_only';

    /**
     * Poll type constants.
     */
    public const POLL_TYPE_STANDARD = 'standard';

    public const POLL_TYPE_PROFILE = 'profile';

    protected $fillable = [
        'question',
        'description',
        'type',
        'poll_type',
        'visibility',
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
     * Get the users directly invited to this poll.
     */
    public function invitedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'poll_invitations')
            ->withPivot(['invited_by', 'invited_at'])
            ->withTimestamps();
    }

    /**
     * Get the departments invited to this poll (QuickInvite™).
     */
    public function invitedDepartments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'poll_department_invitations')
            ->withPivot(['invited_by', 'invited_at'])
            ->withTimestamps();
    }

    /**
     * Get the proxies assigned for this poll.
     */
    public function proxies(): HasMany
    {
        return $this->hasMany(PollProxy::class);
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
     * Scope a query to only include public polls.
     */
    public function scopePublic($query)
    {
        return $query->where('visibility', self::VISIBILITY_PUBLIC);
    }

    /**
     * Scope a query to only include invite-only polls.
     */
    public function scopeInviteOnly($query)
    {
        return $query->where('visibility', self::VISIBILITY_INVITE_ONLY);
    }

    /**
     * Scope a query to include polls visible to a specific user.
     * This handles both public polls and invite-only polls where the user is invited.
     */
    public function scopeVisibleTo($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            // Public polls are always visible
            $q->where('visibility', self::VISIBILITY_PUBLIC)
                // Or invite-only polls where user is directly invited
                ->orWhere(function ($inviteQ) use ($user) {
                    $inviteQ->where('visibility', self::VISIBILITY_INVITE_ONLY)
                        ->where(function ($accessQ) use ($user) {
                            // Directly invited
                            $accessQ->whereHas('invitedUsers', function ($userQ) use ($user) {
                                $userQ->where('users.id', $user->id);
                            })
                                // Or invited via department
                                ->orWhereHas('invitedDepartments', function ($deptQ) use ($user) {
                                $deptQ->whereHas('users', function ($userQ) use ($user) {
                                    $userQ->where('users.id', $user->id);
                                });
                            });
                        });
                });
        });
    }

    /**
     * Check if the poll has ended based on end_at timestamp.
     */
    public function hasEnded(): bool
    {
        if (!$this->end_at) {
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

        if (!$this->start_at) {
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
     * Check if the poll is public (visible to all org users).
     */
    public function isPublic(): bool
    {
        return $this->visibility === self::VISIBILITY_PUBLIC;
    }

    /**
     * Check if the poll is invite-only.
     */
    public function isInviteOnly(): bool
    {
        return $this->visibility === self::VISIBILITY_INVITE_ONLY;
    }

    /**
     * Check if a user is invited to this poll (directly or via department).
     */
    public function isUserInvited(User $user): bool
    {
        // Check direct invitation
        if ($this->invitedUsers()->where('users.id', $user->id)->exists()) {
            return true;
        }

        // Check department invitation
        $invitedDeptIds = $this->invitedDepartments()->pluck('departments.id')->toArray();

        return $user->belongsToAnyDepartment($invitedDeptIds);
    }

    /**
     * Check if the poll is visible to a user.
     */
    public function isVisibleTo(User $user): bool
    {
        // Public polls are visible to all users in the organization
        if ($this->isPublic()) {
            return true;
        }

        // Invite-only polls require invitation
        return $this->isUserInvited($user);
    }

    /**
     * Check if the poll can be voted on by the given user.
     * System polls (organization_id = null) can only be voted on by users without an organization.
     * Organization polls can only be voted on by users in that specific organization.
     * Invite-only polls require the user to be invited.
     */
    public function canBeVotedOnBy(User $user): bool
    {
        // System poll (no organization)
        if ($this->organization_id === null) {
            // Only users without organization can vote on system polls
            // This prevents organization users AND super admins with organizations from voting
            return $user->organization_id === null;
        }

        // Organization poll - must belong to same organization
        if ($user->organization_id !== $this->organization_id) {
            return false;
        }

        // Check visibility - invite-only polls require invitation
        if ($this->isInviteOnly() && !$this->isUserInvited($user)) {
            return false;
        }

        return true;
    }

    /**
     * Invite individual users to this poll.
     *
     * @param  array<int>  $userIds
     */
    public function inviteUsers(array $userIds, ?int $invitedById = null): array
    {
        $data = [];
        foreach ($userIds as $userId) {
            $data[$userId] = [
                'invited_by' => $invitedById,
                'invited_at' => now(),
            ];
        }

        return $this->invitedUsers()->syncWithoutDetaching($data);
    }

    /**
     * Invite departments to this poll (QuickInvite™).
     *
     * @param  array<int>  $departmentIds
     */
    public function inviteDepartments(array $departmentIds, ?int $invitedById = null): array
    {
        $data = [];
        foreach ($departmentIds as $departmentId) {
            $data[$departmentId] = [
                'invited_by' => $invitedById,
                'invited_at' => now(),
            ];
        }

        return $this->invitedDepartments()->syncWithoutDetaching($data);
    }

    /**
     * Remove user invitations from this poll.
     *
     * @param  array<int>  $userIds
     */
    public function revokeUserInvitations(array $userIds): void
    {
        $this->invitedUsers()->detach($userIds);
    }

    /**
     * Remove department invitations from this poll.
     *
     * @param  array<int>  $departmentIds
     */
    public function revokeDepartmentInvitations(array $departmentIds): void
    {
        $this->invitedDepartments()->detach($departmentIds);
    }

    /**
     * Get all users who can see this poll (for invite-only polls).
     * Returns all directly invited users + users from invited departments.
     */
    public function getAllInvitedUsers()
    {
        // Get directly invited users
        $directUsers = $this->invitedUsers()->pluck('users.id');

        // Get users from invited departments
        $departmentUserIds = User::whereHas('departments', function ($query) {
            $query->whereIn('departments.id', $this->invitedDepartments()->pluck('departments.id'));
        })->pluck('id');

        return User::whereIn('id', $directUsers->merge($departmentUserIds)->unique())->get();
    }

    /**
     * Check if the poll is a standard (text-based) poll.
     */
    public function isStandardPoll(): bool
    {
        return $this->poll_type === self::POLL_TYPE_STANDARD;
    }

    /**
     * Check if the poll is a profile (image-based) poll.
     */
    public function isProfilePoll(): bool
    {
        return $this->poll_type === self::POLL_TYPE_PROFILE;
    }

    /**
     * Scope a query to only include standard polls.
     */
    public function scopeStandardPolls($query)
    {
        return $query->where('poll_type', self::POLL_TYPE_STANDARD);
    }

    /**
     * Scope a query to only include profile polls.
     */
    public function scopeProfilePolls($query)
    {
        return $query->where('poll_type', self::POLL_TYPE_PROFILE);
    }
}
