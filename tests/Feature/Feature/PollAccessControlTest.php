<?php

use App\Models\Organization;
use App\Models\Poll;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('system polls are visible to super admins without organization', function () {
    // Create a super admin without an organization
    $superAdmin = User::factory()->superAdmin()->create(['organization_id' => null]);

    // Create a system poll (no organization)
    $systemPoll = Poll::factory()->withOptions()->create([
        'organization_id' => null,
        'status' => 'active',
        'created_by' => $superAdmin->id,
    ]);

    $response = $this->actingAs($superAdmin)->get('/polls');

    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
            ->component('polls/index')
            ->has('polls.data', 1)
            ->where('polls.data.0.id', $systemPoll->id)
    );
});

test('system polls are not visible to organization members', function () {
    $organization = Organization::factory()->create();
    $organizationUser = User::factory()->user()->create(['organization_id' => $organization->id]);

    // Create a system poll
    $systemPoll = Poll::factory()->withOptions()->create([
        'organization_id' => null,
        'status' => 'active',
    ]);

    $response = $this->actingAs($organizationUser)->get('/polls');

    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
            ->component('polls/index')
            ->has('polls.data', 0) // Should not see any system polls
    );
});

test('organization polls are visible only to members of that organization', function () {
    $organization1 = Organization::factory()->create();
    $organization2 = Organization::factory()->create();

    $user1 = User::factory()->user()->create(['organization_id' => $organization1->id]);
    $user2 = User::factory()->user()->create(['organization_id' => $organization2->id]);

    // Create poll for organization 1
    $org1Poll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization1->id,
        'status' => 'active',
    ]);

    // Create poll for organization 2
    $org2Poll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization2->id,
        'status' => 'active',
    ]);

    // User 1 should only see org1's poll
    $response = $this->actingAs($user1)->get('/polls');
    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
            ->has('polls.data', 1)
            ->where('polls.data.0.id', $org1Poll->id)
    );

    // User 2 should only see org2's poll
    $response = $this->actingAs($user2)->get('/polls');
    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
            ->has('polls.data', 1)
            ->where('polls.data.0.id', $org2Poll->id)
    );
});

test('organization admin can see organization polls', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin()->create(['organization_id' => $organization->id]);

    $orgPoll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($admin)->get('/polls');

    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
            ->has('polls.data', 1)
            ->where('polls.data.0.id', $orgPoll->id)
    );
});

test('super admins without organization do not see organization polls', function () {
    $superAdmin = User::factory()->superAdmin()->create(['organization_id' => null]);
    $organization = Organization::factory()->create();

    // Create organization poll
    $orgPoll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($superAdmin)->get('/polls');

    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
            ->has('polls.data', 0) // Should not see organization polls
    );
});

test('inactive polls are not visible in public poll list', function () {
    $superAdmin = User::factory()->superAdmin()->create(['organization_id' => null]);

    // Create active poll
    $activePoll = Poll::factory()->withOptions()->create([
        'organization_id' => null,
        'status' => 'active',
    ]);

    // Create scheduled poll
    $scheduledPoll = Poll::factory()->withOptions()->create([
        'organization_id' => null,
        'status' => 'scheduled',
    ]);

    $response = $this->actingAs($superAdmin)->get('/polls');

    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
            ->has('polls.data', 1) // Only active poll
            ->where('polls.data.0.id', $activePoll->id)
    );
});
