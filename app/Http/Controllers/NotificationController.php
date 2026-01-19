<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get the authenticated user's notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->take(50)
            ->get()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                'type' => $notification->data['type'] ?? 'info',
                'icon' => $notification->data['icon'] ?? 'bell',
                'color' => $notification->data['color'] ?? 'slate',
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'details' => $notification->data['details'] ?? [],
                'action_url' => $notification->data['action_url'] ?? null,
                'action_text' => $notification->data['action_text'] ?? null,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at->diffForHumans(),
                'created_at_iso' => $notification->created_at->toISOString(),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if (! $notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read',
            'unread_count' => 0,
        ]);
    }

    /**
     * Delete a specific notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if (! $notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted',
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }
}
