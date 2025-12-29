<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->route('organization_slug');

        if (! $slug) {
            abort(404);
        }

        $organization = \App\Models\Organization::where('slug', $slug)->firstOrFail();

        // Bind to container
        app()->instance('organization', $organization);

        // Remove slug from route parameters to prevent it from being inferred as a controller argument
        $request->route()->forgetParameter('organization_slug');

        return $next($request);
    }
}
