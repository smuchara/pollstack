<?php

use App\Models\Department;
use App\Models\Organization;
use App\Models\Poll;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

describe('Poll Visibility', function () {
    it('defaults to public visibility', function () {
        $organization = Organization::factory()->create();
        $user = User::factory()->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $user->id,
        ]);

        expect($poll->visibility)->toBe(Poll::VISIBILITY_PUBLIC)
            ->and($poll->isPublic())->toBeTrue()
            ->and($poll->isInviteOnly())->toBeFalse();
    });

    it('can be set to invite-only', function () {
        $organization = Organization::factory()->create();
        $user = User::factory()->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $user->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        expect($poll->isInviteOnly())->toBeTrue()
            ->and($poll->isPublic())->toBeFalse();
    });
});

describe('Poll User Invitations', function () {
    it('can invite individual users', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $invitee = User::factory()->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteUsers([$invitee->id], $creator->id);

        expect($poll->invitedUsers()->count())->toBe(1)
            ->and($poll->isUserInvited($invitee))->toBeTrue()
            ->and($poll->isUserInvited($creator))->toBeFalse();
    });

    it('can invite multiple users', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $users = User::factory()->count(3)->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteUsers($users->pluck('id')->toArray(), $creator->id);

        expect($poll->invitedUsers()->count())->toBe(3);
    });

    it('can revoke user invitations', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $invitee = User::factory()->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteUsers([$invitee->id], $creator->id);
        expect($poll->isUserInvited($invitee))->toBeTrue();

        $poll->revokeUserInvitations([$invitee->id]);
        expect($poll->isUserInvited($invitee))->toBeFalse();
    });
});

describe('Poll Department Invitations (QuickInvite)', function () {
    it('can invite entire departments', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $department = $organization->departments()->first();

        // Add users to department
        $users = User::factory()->count(3)->create(['organization_id' => $organization->id]);
        $department->users()->attach($users->pluck('id'));

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteDepartments([$department->id], $creator->id);

        expect($poll->invitedDepartments()->count())->toBe(1);

        // All users in department should be considered invited
        foreach ($users as $user) {
            expect($poll->isUserInvited($user))->toBeTrue();
        }
    });

    it('can revoke department invitations', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $department = $organization->departments()->first();

        $user = User::factory()->create(['organization_id' => $organization->id]);
        $department->users()->attach($user->id);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteDepartments([$department->id], $creator->id);
        expect($poll->isUserInvited($user))->toBeTrue();

        $poll->revokeDepartmentInvitations([$department->id]);
        expect($poll->isUserInvited($user))->toBeFalse();
    });

    it('considers user invited if in any invited department', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);

        $dept1 = $organization->departments()->first();
        $dept2 = $organization->departments()->skip(1)->first();

        $user = User::factory()->create(['organization_id' => $organization->id]);
        $dept1->users()->attach($user->id);
        $dept2->users()->attach($user->id);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        // Only invite dept1
        $poll->inviteDepartments([$dept1->id], $creator->id);

        expect($poll->isUserInvited($user))->toBeTrue();
    });
});

describe('Poll Visibility Scope', function () {
    it('returns all public polls', function () {
        $organization = Organization::factory()->create();
        $user = User::factory()->create(['organization_id' => $organization->id]);

        Poll::factory()->count(3)->create([
            'organization_id' => $organization->id,
            'created_by' => $user->id,
            'visibility' => Poll::VISIBILITY_PUBLIC,
        ]);

        $visiblePolls = Poll::forOrganization($organization->id)->visibleTo($user)->get();

        expect($visiblePolls->count())->toBe(3);
    });

    it('hides invite-only polls from non-invited users', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $nonInvitedUser = User::factory()->create(['organization_id' => $organization->id]);

        Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $visiblePolls = Poll::forOrganization($organization->id)->visibleTo($nonInvitedUser)->get();

        expect($visiblePolls->count())->toBe(0);
    });

    it('shows invite-only polls to directly invited users', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $invitedUser = User::factory()->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteUsers([$invitedUser->id], $creator->id);

        $visiblePolls = Poll::forOrganization($organization->id)->visibleTo($invitedUser)->get();

        expect($visiblePolls->count())->toBe(1);
    });

    it('shows invite-only polls to users via department invitation', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $department = $organization->departments()->first();

        $user = User::factory()->create(['organization_id' => $organization->id]);
        $department->users()->attach($user->id);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteDepartments([$department->id], $creator->id);

        $visiblePolls = Poll::forOrganization($organization->id)->visibleTo($user)->get();

        expect($visiblePolls->count())->toBe(1);
    });
});

describe('Poll canBeVotedOnBy with Visibility', function () {
    it('allows voting on public polls', function () {
        $organization = Organization::factory()->create();
        $user = User::factory()->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $user->id,
            'visibility' => Poll::VISIBILITY_PUBLIC,
        ]);

        expect($poll->canBeVotedOnBy($user))->toBeTrue();
    });

    it('prevents voting on invite-only polls for non-invited users', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $nonInvitedUser = User::factory()->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        expect($poll->canBeVotedOnBy($nonInvitedUser))->toBeFalse();
    });

    it('allows voting on invite-only polls for invited users', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $invitedUser = User::factory()->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteUsers([$invitedUser->id], $creator->id);

        expect($poll->canBeVotedOnBy($invitedUser))->toBeTrue();
    });

    it('allows voting on invite-only polls via department invitation', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $department = $organization->departments()->first();

        $user = User::factory()->create(['organization_id' => $organization->id]);
        $department->users()->attach($user->id);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteDepartments([$department->id], $creator->id);

        expect($poll->canBeVotedOnBy($user))->toBeTrue();
    });
});

describe('Get All Invited Users', function () {
    it('returns all directly invited users', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $users = User::factory()->count(3)->create(['organization_id' => $organization->id]);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteUsers($users->pluck('id')->toArray(), $creator->id);

        expect($poll->getAllInvitedUsers()->count())->toBe(3);
    });

    it('returns users from invited departments', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $department = $organization->departments()->first();

        $users = User::factory()->count(3)->create(['organization_id' => $organization->id]);
        $department->users()->attach($users->pluck('id'));

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        $poll->inviteDepartments([$department->id], $creator->id);

        expect($poll->getAllInvitedUsers()->count())->toBe(3);
    });

    it('returns unique users when invited directly and via department', function () {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create(['organization_id' => $organization->id]);
        $department = $organization->departments()->first();

        $user = User::factory()->create(['organization_id' => $organization->id]);
        $department->users()->attach($user->id);

        $poll = Poll::factory()->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'visibility' => Poll::VISIBILITY_INVITE_ONLY,
        ]);

        // Invite both directly and via department
        $poll->inviteUsers([$user->id], $creator->id);
        $poll->inviteDepartments([$department->id], $creator->id);

        // Should only return the user once
        expect($poll->getAllInvitedUsers()->count())->toBe(1);
    });
});
