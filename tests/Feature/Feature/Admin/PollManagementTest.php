<?php

use App\Models\Organization;
use App\Models\Poll;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('organization admin can create poll for their organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin()->create(['organization_id' => $organization->id]);

    $pollData = [
        'question' => 'What is your favorite feature?',
        'description' => 'Help us improve',
        'type' => 'open',
        'status' => 'active',
        'options' => [
            ['text' => 'Feature A'],
            ['text' => 'Feature B'],
            ['text' => 'Feature C'],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post("/organization/{$organization->slug}/admin/polls", $pollData);

    $response->assertRedirect();
    $this->assertDatabaseHas('polls', [
        'question' => 'What is your favorite feature?',
        'organization_id' => $organization->id,
        'created_by' => $admin->id,
    ]);
});

test('poll created by organization admin is automatically scoped to organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin()->create(['organization_id' => $organization->id]);

    $pollData = [
        'question' => 'Test Poll',
        'type' => 'open',
        'status' => 'active',
        'options' => [
            ['text' => 'Option 1'],
            ['text' => 'Option 2'],
        ],
    ];

    $this->actingAs($admin)
        ->post("/organization/{$organization->slug}/admin/polls", $pollData);

    $poll = Poll::where('question', 'Test Poll')->first();

    expect($poll)->not->toBeNull();
    expect($poll->organization_id)->toBe($organization->id);
});

test('organization admin can update polls in their organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin()->create(['organization_id' => $organization->id]);

    $poll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'question' => 'Original Question',
        'status' => 'scheduled', // Must be scheduled to allow updates (active polls cannot be edited)
    ]);

    $updateData = [
        'question' => 'Updated Question',
        'description' => 'Updated description',
        'type' => 'closed',
        'status' => 'active',
        'options' => [
            ['text' => 'New Option 1'],
            ['text' => 'New Option 2'],
        ],
    ];

    $response = $this->actingAs($admin)
        ->put("/organization/{$organization->slug}/admin/polls/{$poll->id}", $updateData);

    $response->assertRedirect();
    $this->assertDatabaseHas('polls', [
        'id' => $poll->id,
        'question' => 'Updated Question',
        'type' => 'closed',
    ]);
});

test('organization admin cannot update polls from other organizations', function () {
    $organization1 = Organization::factory()->create();
    $organization2 = Organization::factory()->create();

    $admin1 = User::factory()->admin()->create(['organization_id' => $organization1->id]);

    $poll2 = Poll::factory()->create([
        'organization_id' => $organization2->id,
    ]);

    $updateData = [
        'question' => 'Hacked Question',
        'type' => 'open',
        'status' => 'active',
        'options' => [
            ['text' => 'Option 1'],
            ['text' => 'Option 2'],
        ],
    ];

    $response = $this->actingAs($admin1)
        ->put("/organization/{$organization1->slug}/admin/polls/{$poll2->id}", $updateData);

    $response->assertStatus(403);
});

test('organization admin can delete polls in their organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin()->create(['organization_id' => $organization->id]);

    $poll = Poll::factory()->create([
        'organization_id' => $organization->id,
    ]);

    $response = $this->actingAs($admin)
        ->delete("/organization/{$organization->slug}/admin/polls/{$poll->id}");

    $response->assertRedirect();
    $this->assertSoftDeleted('polls', ['id' => $poll->id]);
});

test('organization admin cannot delete polls from other organizations', function () {
    $organization1 = Organization::factory()->create();
    $organization2 = Organization::factory()->create();

    $admin1 = User::factory()->admin()->create(['organization_id' => $organization1->id]);

    $poll2 = Poll::factory()->create([
        'organization_id' => $organization2->id,
    ]);

    $response = $this->actingAs($admin1)
        ->delete("/organization/{$organization1->slug}/admin/polls/{$poll2->id}");

    $response->assertStatus(403);
    $this->assertDatabaseHas('polls', ['id' => $poll2->id]);
});

test('organization admin can view poll results for their organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin()->create(['organization_id' => $organization->id]);

    $poll = Poll::factory()->create([
        'organization_id' => $organization->id,
    ]);

    $response = $this->actingAs($admin)
        ->get("/organization/{$organization->slug}/admin/polls/{$poll->id}/results");

    $response->assertStatus(200);
    $response->assertInertia(
        fn($page) => $page
            ->component('admin/polls/results')
            ->has('poll')
            ->where('poll.id', $poll->id)
    );
});

test('organization admin can list all polls in their organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin()->create(['organization_id' => $organization->id]);

    // Create 3 polls for this organization
    Poll::factory()->count(3)->create(['organization_id' => $organization->id]);

    // Create polls for another organization
    $otherOrg = Organization::factory()->create();
    Poll::factory()->count(2)->create(['organization_id' => $otherOrg->id]);

    $response = $this->actingAs($admin)
        ->get("/organization/{$organization->slug}/admin/polls");

    $response->assertStatus(200);
    $response->assertInertia(
        fn($page) => $page
            ->component('admin/polls')
            ->has('polls.data', 3) // Should only see 3 polls from their org
    );
});

test('regular user cannot access organization admin poll routes', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->user()->create(['organization_id' => $organization->id]);

    $response = $this->actingAs($user)
        ->get("/organization/{$organization->slug}/admin/polls");

    $response->assertStatus(403);
});
