<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'role' => $user->role->value,
                    'role_label' => $user->role->label(),
                    'is_super_admin' => $user->isSuperAdmin(),
                    'is_client_super_admin' => $user->isClientSuperAdmin(),
                    'is_admin' => $user->isAdmin(),
                    'is_user' => $user->isUser(),
                    'permissions' => $user->getAllPermissions(),
                    'organization_id' => $user->organization_id,
                    'profile_photo_url' => $user->profile_photo_url,
                    'profile_photo_path' => $user->profile_photo_path,
                ] : null,
            ],
            // Share organization slug from route parameter for tenant context
            // Share organization slug from bound organization or route parameter
            'organization_slug' => app()->bound('organization')
                ? app('organization')->slug
                : $request->route('organization_slug'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
                'warning' => $request->session()->get('warning'),
            ],
            'notifications' => fn () => $user ? [
                'items' => $user->unreadNotifications()->latest()->take(10)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'type' => $n->data['type'] ?? 'info',
                    'icon' => $n->data['icon'] ?? 'bell',
                    'color' => $n->data['color'] ?? 'slate',
                    'title' => $n->data['title'] ?? 'Notification',
                    'message' => $n->data['message'] ?? '',
                    'action_url' => $n->data['action_url'] ?? null,
                    'action_text' => $n->data['action_text'] ?? null,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at->diffForHumans(),
                ]),
                'unread_count' => $user->unreadNotifications()->count(),
            ] : null,
        ];
    }
}
