<?php

use App\Models\Organization;
use App\Models\Poll;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('super admin cannot vote on organization polls', function () {
    $superAdmin = User::factory()->superAdmin()->create(['organization_id' => null]);
    $organization = Organization::factory()->create();

    $orgPoll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    $option = $orgPoll->options()->first();

    $response = $this->actingAs($superAdmin)->postJson("/polls/{$orgPoll->id}/vote", [
        'option_id' => $option->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['poll']);
    expect($response->json('errors.poll.0'))->toBe('The user you are voting for is not eligible to vote in this poll.');

    // Verify no vote was recorded
    expect(Vote::count())->toBe(0);
});

test('super admin can vote on system polls', function () {
    $superAdmin = User::factory()->superAdmin()->create(['organization_id' => null]);

    $systemPoll = Poll::factory()->withOptions()->create([
        'organization_id' => null,
        'status' => 'active',
    ]);

    $option = $systemPoll->options()->first();

    $response = $this->actingAs($superAdmin)->postJson("/polls/{$systemPoll->id}/vote", [
        'option_id' => $option->id,
    ]);

    $response->assertStatus(302); // Redirect after successful vote

    // Verify vote was recorded
    expect(Vote::count())->toBe(1);
    expect(Vote::first()->user_id)->toBe($superAdmin->id);
    expect(Vote::first()->poll_id)->toBe($systemPoll->id);
});

test('organization users can vote on their own organization polls', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->user()->create(['organization_id' => $organization->id]);

    $orgPoll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    $option = $orgPoll->options()->first();

    $response = $this->actingAs($user)->postJson("/polls/{$orgPoll->id}/vote", [
        'option_id' => $option->id,
    ]);

    $response->assertStatus(302); // Redirect after successful vote

    // Verify vote was recorded
    expect(Vote::count())->toBe(1);
    expect(Vote::first()->user_id)->toBe($user->id);
    expect(Vote::first()->poll_id)->toBe($orgPoll->id);
});

test('organization users cannot vote on other organizations polls', function () {
    $organization1 = Organization::factory()->create();
    $organization2 = Organization::factory()->create();

    $user = User::factory()->user()->create(['organization_id' => $organization1->id]);

    $org2Poll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization2->id,
        'status' => 'active',
    ]);

    $option = $org2Poll->options()->first();

    $response = $this->actingAs($user)->postJson("/polls/{$org2Poll->id}/vote", [
        'option_id' => $option->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['poll']);
    expect($response->json('errors.poll.0'))->toBe('The user you are voting for is not eligible to vote in this poll.');

    // Verify no vote was recorded
    expect(Vote::count())->toBe(0);
});

test('organization users cannot vote on system polls', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->user()->create(['organization_id' => $organization->id]);

    $systemPoll = Poll::factory()->withOptions()->create([
        'organization_id' => null,
        'status' => 'active',
    ]);

    $option = $systemPoll->options()->first();

    $response = $this->actingAs($user)->postJson("/polls/{$systemPoll->id}/vote", [
        'option_id' => $option->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['poll']);
    expect($response->json('errors.poll.0'))->toBe('The user you are voting for is not eligible to vote in this poll.');

    // Verify no vote was recorded
    expect(Vote::count())->toBe(0);
});

test('users without organization can vote on system polls', function () {
    // This would be a regular user in the system (not super admin, no organization)
    $user = User::factory()->user()->create(['organization_id' => null]);

    $systemPoll = Poll::factory()->withOptions()->create([
        'organization_id' => null,
        'status' => 'active',
    ]);

    $option = $systemPoll->options()->first();

    $response = $this->actingAs($user)->postJson("/polls/{$systemPoll->id}/vote", [
        'option_id' => $option->id,
    ]);

    $response->assertStatus(302); // Redirect after successful vote

    // Verify vote was recorded
    expect(Vote::count())->toBe(1);
    expect(Vote::first()->user_id)->toBe($user->id);
    expect(Vote::first()->poll_id)->toBe($systemPoll->id);
});

test('organization admin can vote on their organization polls', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin()->create(['organization_id' => $organization->id]);

    $orgPoll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    $option = $orgPoll->options()->first();

    $response = $this->actingAs($admin)->postJson("/polls/{$orgPoll->id}/vote", [
        'option_id' => $option->id,
    ]);

    $response->assertStatus(302); // Redirect after successful vote

    // Verify vote was recorded
    expect(Vote::count())->toBe(1);
    expect(Vote::first()->user_id)->toBe($admin->id);
    expect(Vote::first()->poll_id)->toBe($orgPoll->id);
});

test('organization admin cannot vote on system polls', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin()->create(['organization_id' => $organization->id]);

    $systemPoll = Poll::factory()->withOptions()->create([
        'organization_id' => null,
        'status' => 'active',
    ]);

    $option = $systemPoll->options()->first();

    $response = $this->actingAs($admin)->postJson("/polls/{$systemPoll->id}/vote", [
        'option_id' => $option->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['poll']);
    expect($response->json('errors.poll.0'))->toBe('The user you are voting for is not eligible to vote in this poll.');

    // Verify no vote was recorded
    expect(Vote::count())->toBe(0);
});
