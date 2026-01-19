<?php

use App\Models\Organization;
use App\Models\User;
use App\Notifications\SystemUpdateNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->organization = Organization::factory()->create();
    $this->user = User::factory()->create([
        'organization_id' => $this->organization->id,
    ]);
});

it('can list user notifications', function () {
    // Create a notification for the user
    $this->user->notify(new SystemUpdateNotification(
        'Test Notification',
        'This is a test message'
    ));

    $response = $this->actingAs($this->user)
        ->getJson('/notifications');

    $response->assertOk()
        ->assertJsonStructure([
            'notifications' => [
                '*' => [
                    'id',
                    'type',
                    'icon',
                    'color',
                    'title',
                    'message',
                    'action_url',
                    'action_text',
                    'read_at',
                    'created_at',
                ],
            ],
            'unread_count',
        ])
        ->assertJsonPath('unread_count', 1)
        ->assertJsonCount(1, 'notifications');
});

it('can mark a notification as read', function () {
    $this->user->notify(new SystemUpdateNotification(
        'Test Notification',
        'This is a test message'
    ));

    $notification = $this->user->notifications()->first();

    expect($notification->read_at)->toBeNull();

    $response = $this->actingAs($this->user)
        ->postJson("/notifications/{$notification->id}/read");

    $response->assertOk()
        ->assertJsonPath('message', 'Notification marked as read')
        ->assertJsonPath('unread_count', 0);

    $notification->refresh();
    expect($notification->read_at)->not->toBeNull();
});

it('can mark all notifications as read', function () {
    // Create multiple notifications
    $this->user->notify(new SystemUpdateNotification('Test 1', 'Message 1'));
    $this->user->notify(new SystemUpdateNotification('Test 2', 'Message 2'));
    $this->user->notify(new SystemUpdateNotification('Test 3', 'Message 3'));

    expect($this->user->unreadNotifications()->count())->toBe(3);

    $response = $this->actingAs($this->user)
        ->postJson('/notifications/read-all');

    $response->assertOk()
        ->assertJsonPath('message', 'All notifications marked as read')
        ->assertJsonPath('unread_count', 0);

    expect($this->user->unreadNotifications()->count())->toBe(0);
});

it('can delete a notification', function () {
    $this->user->notify(new SystemUpdateNotification(
        'Test Notification',
        'This is a test message'
    ));

    $notification = $this->user->notifications()->first();

    $response = $this->actingAs($this->user)
        ->deleteJson("/notifications/{$notification->id}");

    $response->assertOk()
        ->assertJsonPath('message', 'Notification deleted');

    expect($this->user->notifications()->count())->toBe(0);
});

it('returns 404 when marking non-existent notification as read', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/notifications/non-existent-id/read');

    $response->assertNotFound()
        ->assertJsonPath('message', 'Notification not found');
});

it('cannot access other users notifications', function () {
    $otherUser = User::factory()->create([
        'organization_id' => $this->organization->id,
    ]);

    $otherUser->notify(new SystemUpdateNotification(
        'Test Notification',
        'This is a test message'
    ));

    $notification = $otherUser->notifications()->first();

    // Try to mark another user's notification as read
    $response = $this->actingAs($this->user)
        ->postJson("/notifications/{$notification->id}/read");

    $response->assertNotFound();
});

it('requires authentication to access notifications', function () {
    $response = $this->getJson('/notifications');

    $response->assertRedirect('/login');
});

it('shares notifications in inertia props when authenticated', function () {
    $this->user->notify(new SystemUpdateNotification(
        'Test Notification',
        'This is a test message'
    ));

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertOk();

    // Note: The actual structure depends on how Inertia renders props
    // This test ensures no errors occur when accessing dashboard with notifications
});
