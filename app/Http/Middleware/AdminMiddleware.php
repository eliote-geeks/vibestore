<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Non authentifié'
            ], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Accès refusé - Privilèges administrateur requis'
            ], 403);
        }

        return $next($request);
    }
}
