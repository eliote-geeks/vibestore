<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CanUploadClips
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Vérifier que l'utilisateur est connecté
        if (!$user) {
            return response()->json([
                'message' => 'Authentification requise'
            ], 401);
        }

        // Vérifier que l'utilisateur a le bon rôle (artiste, producteur ou admin)
        if (!in_array($user->role, ['artist', 'producer', 'admin'])) {
            return response()->json([
                'message' => 'Vous devez être artiste, producteur ou administrateur pour uploader des clips'
            ], 403);
        }

        // Vérifier que l'utilisateur est actif
        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Votre compte doit être actif pour uploader des clips'
            ], 403);
        }

        return $next($request);
    }
}
