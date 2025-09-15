<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sound;
use App\Models\User;
use App\Notifications\SoundApproved;
use App\Notifications\SoundRejected;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * Obtenir tous les sons pour l'administration
     */
    public function getSounds(Request $request)
    {
        try {
            // Vérifier que l'utilisateur est connecté et admin
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $user = auth('sanctum')->user();
            if ($user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux administrateurs'
                ], 403);
            }

            // Récupérer tous les sons avec leurs relations
            $sounds = Sound::with(['user', 'category'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($sound) {
                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'slug' => $sound->slug,
                        'description' => $sound->description,
                        'status' => $sound->status,
                        'created_at' => $sound->created_at->toISOString(),
                        'updated_at' => $sound->updated_at->toISOString(),
                        'price' => $sound->price,
                        'category' => $sound->category ? $sound->category->name : 'Uncategorized',
                        'genre' => $sound->genre,
                        'bpm' => $sound->bpm,
                        'key' => $sound->key,
                        'plays_count' => $sound->plays_count ?? 0,
                        'likes_count' => $sound->likes_count ?? 0,
                        'downloads_count' => $sound->downloads_count ?? 0,
                        'tags' => $sound->tags ?? [],
                        'license_type' => $sound->license_type,
                        'copyright_owner' => $sound->copyright_owner,
                        'composer' => $sound->composer,
                        'artist' => [
                            'id' => $sound->user->id,
                            'name' => $sound->user->name,
                            'email' => $sound->user->email
                        ],
                        'cover_image_url' => $sound->cover_image_url,
                        'audio_file_url' => $sound->file_url,
                        'is_free' => $sound->is_free,
                        'is_featured' => $sound->is_featured
                    ];
                });

            return response()->json($sounds);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des sons',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approuver un son
     */
    public function approveSound(Request $request, $id)
    {
        try {
            // Vérifier que l'utilisateur est connecté et admin
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $admin = auth('sanctum')->user();
            if ($admin->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux administrateurs'
                ], 403);
            }

            // Récupérer le son
            $sound = Sound::with('user')->findOrFail($id);

            // Vérifier que le son est en attente
            if ($sound->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce son n\'est pas en attente d\'approbation'
                ], 400);
            }

            // Approuver le son
            $sound->update([
                'status' => 'published'
            ]);

            // Envoyer la notification à l'utilisateur
            $sound->user->notify(new SoundApproved($sound));

            return response()->json([
                'success' => true,
                'message' => 'Son approuvé avec succès',
                'sound' => $sound->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation du son',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rejeter un son
     */
    public function rejectSound(Request $request, $id)
    {
        try {
            // Vérifier que l'utilisateur est connecté et admin
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $admin = auth('sanctum')->user();
            if ($admin->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux administrateurs'
                ], 403);
            }

            // Validation de la raison
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|min:10|max:1000'
            ], [
                'reason.required' => 'La raison du rejet est obligatoire',
                'reason.min' => 'La raison doit contenir au moins 10 caractères',
                'reason.max' => 'La raison ne peut pas dépasser 1000 caractères'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Récupérer le son
            $sound = Sound::with('user')->findOrFail($id);

            // Vérifier que le son est en attente
            if ($sound->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce son n\'est pas en attente d\'approbation'
                ], 400);
            }

            // Rejeter le son
            $sound->update([
                'status' => 'rejected'
            ]);

            // Envoyer la notification à l'utilisateur avec la raison
            $sound->user->notify(new SoundRejected($sound, $request->reason));

            return response()->json([
                'success' => true,
                'message' => 'Son rejeté avec succès',
                'sound' => $sound->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet du son',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Envoyer une notification manuelle à un utilisateur
     */
    public function sendNotification(Request $request)
    {
        try {
            // Vérifier que l'utilisateur est connecté et admin
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $admin = auth('sanctum')->user();
            if ($admin->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux administrateurs'
                ], 403);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'title' => 'required|string|max:255',
                'message' => 'required|string|max:1000',
                'type' => 'nullable|in:info,success,warning,danger'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Récupérer l'utilisateur
            $user = User::findOrFail($request->user_id);

            // Créer la notification dans la base de données
            $user->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => 'App\Notifications\AdminNotification',
                'data' => [
                    'type' => $request->type ?? 'info',
                    'title' => $request->title,
                    'message' => $request->message,
                    'admin_id' => $admin->id,
                    'admin_name' => $admin->name,
                    'metadata' => $request->metadata ?? []
                ],
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification envoyée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi de la notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}