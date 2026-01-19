<?php

use App\Models\Organization;
use App\Models\Poll;
use App\Models\PollProxy;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can vote for themselves', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->user()->create(['organization_id' => $organization->id]);

    $poll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    $option = $poll->options()->first();

    $response = $this->actingAs($user)->postJson("/polls/{$poll->id}/vote", [
        'option_id' => $option->id,
    ]);

    $response->assertStatus(302);
    expect(Vote::count())->toBe(1);
    expect(Vote::first()->user_id)->toBe($user->id);
    expect(Vote::first()->proxy_user_id)->toBeNull();
});

test('proxy can vote on behalf of principal', function () {
    $organization = Organization::factory()->create();
    $principal = User::factory()->user()->create(['organization_id' => $organization->id]);
    $proxy = User::factory()->user()->create(['organization_id' => $organization->id]);

    $poll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    PollProxy::create([
        'poll_id' => $poll->id,
        'user_id' => $principal->id,
        'proxy_user_id' => $proxy->id,
        'created_by' => $principal->id,
    ]);

    $option = $poll->options()->first();

    $response = $this->actingAs($proxy)->postJson("/polls/{$poll->id}/vote", [
        'option_id' => $option->id,
        'on_behalf_of' => $principal->id,
    ]);

    $response->assertStatus(302);
    expect(Vote::count())->toBe(1);
    $vote = Vote::first();
    expect($vote->user_id)->toBe($principal->id);
    expect($vote->proxy_user_id)->toBe($proxy->id);
});

test('proxy cannot vote if not assigned', function () {
    $organization = Organization::factory()->create();
    $principal = User::factory()->user()->create(['organization_id' => $organization->id]);
    $proxy = User::factory()->user()->create(['organization_id' => $organization->id]);

    $poll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    $option = $poll->options()->first();

    $response = $this->actingAs($proxy)->postJson("/polls/{$poll->id}/vote", [
        'option_id' => $option->id,
        'on_behalf_of' => $principal->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['on_behalf_of']);
});

test('proxy can vote for themselves and principal', function () {
    $organization = Organization::factory()->create();
    $principal = User::factory()->user()->create(['organization_id' => $organization->id]);
    $proxy = User::factory()->user()->create(['organization_id' => $organization->id]);

    $poll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    PollProxy::create([
        'poll_id' => $poll->id,
        'user_id' => $principal->id,
        'proxy_user_id' => $proxy->id,
        'created_by' => $principal->id,
    ]);

    $option = $poll->options()->first();

    // Vote for self
    $this->actingAs($proxy)->postJson("/polls/{$poll->id}/vote", [
        'option_id' => $option->id,
    ])->assertStatus(302);

    // Vote for principal
    $this->actingAs($proxy)->postJson("/polls/{$poll->id}/vote", [
        'option_id' => $option->id,
        'on_behalf_of' => $principal->id,
    ])->assertStatus(302);

    expect(Vote::count())->toBe(2);

    // Check self vote
    $selfVote = Vote::where('user_id', $proxy->id)->first();
    expect($selfVote->proxy_user_id)->toBeNull();

    // Check proxy vote
    $proxyVote = Vote::where('user_id', $principal->id)->first();
    expect($proxyVote->proxy_user_id)->toBe($proxy->id);
});

test('principal cannot be voted for twice', function () {
    $organization = Organization::factory()->create();
    $principal = User::factory()->user()->create(['organization_id' => $organization->id]);
    $proxy = User::factory()->user()->create(['organization_id' => $organization->id]);

    $poll = Poll::factory()->withOptions()->create([
        'organization_id' => $organization->id,
        'status' => 'active',
    ]);

    PollProxy::create([
        'poll_id' => $poll->id,
        'user_id' => $principal->id,
        'proxy_user_id' => $proxy->id,
        'created_by' => $principal->id,
    ]);

    $option = $poll->options()->first();

    // First vote
    $this->actingAs($proxy)->postJson("/polls/{$poll->id}/vote", [
        'option_id' => $option->id,
        'on_behalf_of' => $principal->id,
    ])->assertStatus(302);

    // Second vote attempt
    $response = $this->actingAs($proxy)->postJson("/polls/{$poll->id}/vote", [
        'option_id' => $option->id,
        'on_behalf_of' => $principal->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['poll']);
    expect($response->json('errors.poll.0'))->toBe('This user has already voted in this poll.');
});
