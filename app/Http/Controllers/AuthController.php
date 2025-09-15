<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;
use App\Models\Payment;

class AuthController extends Controller
{
    /**
     * Inscription d'un nouvel utilisateur
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'in:user,artist,producer',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:1000',
            'location' => 'nullable|string|max:255'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'user',
            'phone' => $request->phone,
            'bio' => $request->bio,
            'location' => $request->location,
            'status' => 'active'
        ]);

        // Créer un token d'authentification
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Inscription réussie',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'location' => $user->location,
                'status' => $user->status,
                'profile_photo_url' => $user->profile_photo_url,
                'created_at' => $user->created_at,
            ],
            'token' => $token
        ], 201);
    }

    /**
     * Connexion d'un utilisateur
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Votre compte a été suspendu. Contactez l\'administration.'],
            ]);
        }

        // Supprimer les anciens tokens
        $user->tokens()->delete();

        // Créer un nouveau token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Mettre à jour la dernière connexion
        $user->update(['last_login_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'location' => $user->location,
                'status' => $user->status,
                'profile_photo_url' => $user->profile_photo_url,
                'last_login_at' => $user->last_login_at,
            ],
            'token' => $token
        ]);
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        // Supprimer le token actuel
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }

    /**
     * Déconnexion de tous les appareils
     */
    public function logoutAll(Request $request)
    {
        // Supprimer tous les tokens de l'utilisateur
        $request->user()->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion de tous les appareils réussie'
        ]);
    }

    /**
     * Obtenir les informations de l'utilisateur connecté
     */
    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'location' => $user->location,
                'status' => $user->status,
                'profile_photo_url' => $user->profile_photo_url,
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at,
            ]
        ]);
    }

    /**
     * Mettre à jour le profil
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:1000',
            'location' => 'nullable|string|max:255'
        ]);

        $user->update($request->only(['name', 'phone', 'bio', 'location']));

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'location' => $user->location,
                'status' => $user->status,
                'profile_photo_url' => $user->profile_photo_url,
            ]
        ]);
    }

    /**
     * Changer le mot de passe
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // Supprimer tous les autres tokens pour forcer une nouvelle connexion
        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe mis à jour avec succès'
        ]);
    }

    /**
     * Mise à jour de la photo de profil
     */
    public function updateProfilePhoto(Request $request)
    {
        $request->validate([
            'profile_photo' => ['required', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
        ]);

        $user = $request->user();

        try {
            // Vérifier et créer le lien symbolique si nécessaire
            $publicPath = public_path('storage');
            $storagePath = storage_path('app/public');

            if (!file_exists($publicPath) && file_exists($storagePath)) {
                try {
                    if (PHP_OS_FAMILY === 'Windows') {
                        // Sur Windows, utiliser mklink
                        exec("mklink /D \"$publicPath\" \"$storagePath\"");
                    } else {
                        // Sur Unix/Linux, utiliser symlink
                        symlink($storagePath, $publicPath);
                    }
                } catch (\Exception $e) {
                    Log::warning('Impossible de créer le lien symbolique: ' . $e->getMessage());
                }
            }

            // Sauvegarder l'ancien chemin pour suppression
            $oldPhotoPath = $user->profile_photo_path;

            // Sauvegarder la nouvelle photo
            $path = $request->file('profile_photo')->store('profile-photos', 'public');

            // Mettre à jour le chemin dans la base de données
            $user->update([
                'profile_photo_path' => $path
            ]);

            // Supprimer l'ancienne photo après avoir sauvegardé la nouvelle
            if ($oldPhotoPath && $oldPhotoPath !== $path) {
                try {
                    if (Storage::disk('public')->exists($oldPhotoPath)) {
                        Storage::disk('public')->delete($oldPhotoPath);
                        Log::info("Ancienne photo supprimée: {$oldPhotoPath}");
                    }
                } catch (\Exception $deleteException) {
                    Log::warning("Impossible de supprimer l'ancienne photo: {$oldPhotoPath}. Erreur: " . $deleteException->getMessage());
                }
            }

            // Rafraîchir le modèle pour obtenir les dernières données
            $user->refresh();

            // Générer une URL unique avec timestamp pour éviter le cache
            $uniqueTimestamp = time();

            return response()->json([
                'success' => true,
                'message' => 'Photo de profil mise à jour avec succès',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'bio' => $user->bio,
                    'location' => $user->location,
                    'status' => $user->status,
                    'profile_photo_url' => $user->profile_photo_url . '?v=' . $uniqueTimestamp,
                    'profile_photo_path' => $user->profile_photo_path,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'photo_timestamp' => $uniqueTimestamp
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la photo de profil: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la photo de profil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir le profil complet de l'utilisateur avec achats, favoris, etc.
     */
    public function getCompleteProfile(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            // Version simplifiée pour tester
            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'role_display' => $user->role_display_name ?? 'Utilisateur',
                    'phone' => $user->phone,
                    'bio' => $user->bio,
                    'location' => $user->location,
                    'status' => $user->status,
                    'profile_photo_url' => $user->profile_photo_url,
                    'created_at' => $user->created_at,
                    'last_login_at' => $user->last_login_at,
                ],
                'purchased_sounds' => [],
                'purchased_events' => [],
                'user_sounds' => [],
                'user_events' => [],
                'following' => [],
                'followers' => [],
                'stats' => [
                    'sounds_purchased' => 0,
                    'events_attended' => 0,
                    'sounds_created' => 0,
                    'events_organized' => 0,
                    'following_count' => 0,
                    'followers_count' => 0,
                    'total_spent' => 0,
                    'total_earned' => 0,
                    'total_plays' => 0,
                    'total_downloads' => 0,
                    'total_likes' => 0,
                ],
                'playlist' => [],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dans getCompleteProfile: ' . $e->getMessage() . ' - Trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement du profil complet',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur'
            ], 500);
        }
    }
}
