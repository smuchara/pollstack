<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasAnyRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $roleEnums = array_map(fn($role) => Role::from($role), $roles);

        if (!$request->user() || !$request->user()->hasAnyRole($roleEnums)) {
            abort(403, 'Unauthorized. You do not have any of the required roles.');
        }

        return $next($request);
    }
}
