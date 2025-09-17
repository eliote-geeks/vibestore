<?php

namespace App\Http\Controllers;

use App\Models\Sound;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SoundController extends Controller
{
    /**
     * Afficher la liste des sons
     */
    public function index(Request $request)
    {
        $query = Sound::with(['user', 'category']);

        // Filtrer par utilisateur si demandé
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filtrer par catégorie
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filtrer par statut
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Par défaut, ne montrer que les sons publiés pour les utilisateurs non-admin
            if (!$request->user() || $request->user()->role !== 'admin') {
                $query->published();
            }
        }

        // Recherche par titre
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        // Filtrer par genre
        if ($request->filled('genre')) {
            $query->where('genre', $request->genre);
        }

        // Sons gratuits uniquement
        if ($request->boolean('free')) {
            $query->free();
        }

        // Sons en vedette
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Ordre
        $orderBy = $request->get('order_by', 'created_at');
        $orderDirection = $request->get('order_direction', 'desc');
        $query->orderBy($orderBy, $orderDirection);

        $perPage = $request->get('per_page', 12);
        $sounds = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'sounds' => $sounds
        ]);
    }

    /**
     * Stocker un nouveau son
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'category_id' => 'required|exists:categories,id',
            'audio_file' => 'required|mimes:mp3,wav,m4a,aac|max:20480', // 20MB max
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'genre' => 'nullable|string|max:100',
            'price' => 'nullable|numeric|min:0',
            'is_free' => 'boolean',
            'tags' => 'nullable|array',
            'bpm' => 'nullable|string|max:20',
            'key' => 'nullable|string|max:20',
            'credits' => 'nullable|string|max:1000',

            // Validation des nouveaux champs de licence et droits d'auteur
            'license_type' => 'required|in:royalty_free,creative_commons,exclusive,custom',
            'copyright_owner' => 'required|string|max:255',
            'composer' => 'required|string|max:255',
            'performer' => 'nullable|string|max:255',
            'producer' => 'nullable|string|max:255',
            'release_date' => 'nullable|date',
            'isrc_code' => 'nullable|string|max:20',
            'publishing_rights' => 'nullable|string|max:1000',
            'usage_rights' => 'nullable|array',
            'commercial_use' => 'boolean',
            'attribution_required' => 'boolean',
            'modifications_allowed' => 'boolean',
            'distribution_allowed' => 'boolean',
            'license_duration' => 'required|in:perpetual,1_year,5_years,10_years',
            'territory' => 'required|in:worldwide,africa,cameroon,francophone',
            'rights_statement' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            // Log des erreurs pour débogage
            \Log::error('Erreurs de validation lors de l\'ajout d\'un son:', [
                'errors' => $validator->errors()->toArray(),
                'input_data' => $request->except(['audio_file', 'cover_image']),
                'user_id' => $request->user()->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Upload du fichier audio
            $audioPath = $request->file('audio_file')->store('sounds/audio', 'public');

            // Upload de l'image de couverture si fournie
            $coverImagePath = null;
            if ($request->hasFile('cover_image')) {
                $coverImagePath = $request->file('cover_image')->store('sounds/covers', 'public');
            }

            // Calculer la durée du fichier audio (optionnel)
            $duration = null;
            // Note: Vous pouvez utiliser une bibliothèque comme getID3 pour extraire la durée

            $soundData = [
                'title' => $request->title,
                'slug' => Str::slug($request->title),
                'description' => $request->description,
                'user_id' => $request->user()->id,
                'category_id' => $request->category_id,
                'file_path' => $audioPath,
                'cover_image' => $coverImagePath,
                'duration' => $duration,
                'genre' => $request->genre,
                'price' => $request->boolean('is_free') ? 0 : ($request->price ?? 0),
                'is_free' => $request->boolean('is_free', false),
                'tags' => $request->tags,
                'bpm' => $request->bpm,
                'key' => $request->key,
                'credits' => $request->credits,
                'status' => 'pending', // En attente de validation

                // Nouveaux champs de licence et droits d'auteur
                'license_type' => $request->license_type,
                'copyright_owner' => $request->copyright_owner,
                'composer' => $request->composer,
                'performer' => $request->performer,
                'producer' => $request->producer,
                'release_date' => $request->release_date,
                'isrc_code' => $request->isrc_code,
                'publishing_rights' => $request->publishing_rights,
                'usage_rights' => $request->usage_rights,
                'commercial_use' => $request->boolean('commercial_use', true),
                'attribution_required' => $request->boolean('attribution_required', false),
                'modifications_allowed' => $request->boolean('modifications_allowed', true),
                'distribution_allowed' => $request->boolean('distribution_allowed', true),
                'license_duration' => $request->license_duration,
                'territory' => $request->territory,
                'rights_statement' => $request->rights_statement,
            ];

            $sound = Sound::create($soundData);

            return response()->json([
                'success' => true,
                'message' => 'Son ajouté avec succès',
                'sound' => $sound->load(['user', 'category'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout du son',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un son spécifique
     */
    public function show(Sound $sound)
    {
        // Incrémenter le compteur de vues
        $sound->incrementPlays();

        return response()->json([
            'success' => true,
            'sound' => $sound->load(['user', 'category'])
        ]);
    }

    /**
     * Mettre à jour un son
     */
    public function update(Request $request, Sound $sound)
    {
        // Vérifier que l'utilisateur peut modifier ce son
        if ($request->user()->id !== $sound->user_id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé à modifier ce son'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'category_id' => 'sometimes|required|exists:categories,id',
            'audio_file' => 'nullable|mimes:mp3,wav,m4a,aac|max:20480',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'genre' => 'nullable|string|max:100',
            'price' => 'nullable|numeric|min:0',
            'is_free' => 'boolean',
            'status' => 'sometimes|in:draft,pending,published,rejected',
            'tags' => 'nullable|array',
            'bpm' => 'nullable|string|max:20',
            'key' => 'nullable|string|max:20',
            'credits' => 'nullable|string|max:1000',

            // Validation des nouveaux champs de licence et droits d'auteur
            'license_type' => 'sometimes|required|in:royalty_free,creative_commons,exclusive,custom',
            'copyright_owner' => 'sometimes|required|string|max:255',
            'composer' => 'sometimes|required|string|max:255',
            'performer' => 'nullable|string|max:255',
            'producer' => 'nullable|string|max:255',
            'release_date' => 'nullable|date',
            'isrc_code' => 'nullable|string|max:20',
            'publishing_rights' => 'nullable|string|max:1000',
            'usage_rights' => 'nullable|array',
            'commercial_use' => 'boolean',
            'attribution_required' => 'boolean',
            'modifications_allowed' => 'boolean',
            'distribution_allowed' => 'boolean',
            'license_duration' => 'sometimes|required|in:perpetual,1_year,5_years,10_years',
            'territory' => 'sometimes|required|in:worldwide,africa,cameroon,francophone',
            'rights_statement' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = $request->only([
                'title', 'description', 'category_id', 'genre', 'price',
                'is_free', 'tags', 'bpm', 'key', 'credits',
                // Nouveaux champs de licence et droits d'auteur
                'license_type', 'copyright_owner', 'composer', 'performer',
                'producer', 'release_date', 'isrc_code', 'publishing_rights',
                'usage_rights', 'commercial_use', 'attribution_required',
                'modifications_allowed', 'distribution_allowed',
                'license_duration', 'territory', 'rights_statement'
            ]);

            // Upload du nouveau fichier audio si fourni
            if ($request->hasFile('audio_file')) {
                // Supprimer l'ancien fichier
                if ($sound->file_path) {
                    Storage::disk('public')->delete($sound->file_path);
                }
                $updateData['file_path'] = $request->file('audio_file')->store('sounds/audio', 'public');
            }

            // Upload de la nouvelle image de couverture si fournie
            if ($request->hasFile('cover_image')) {
                // Supprimer l'ancienne image
                if ($sound->cover_image) {
                    Storage::disk('public')->delete($sound->cover_image);
                }
                $updateData['cover_image'] = $request->file('cover_image')->store('sounds/covers', 'public');
            }

            // Seuls les admins peuvent changer le statut
            if ($request->has('status') && $request->user()->role === 'admin') {
                $updateData['status'] = $request->status;
            }

            // Régénérer le slug si le titre a changé
            if (isset($updateData['title'])) {
                $updateData['slug'] = Str::slug($updateData['title']);
            }

            $sound->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Son mis à jour avec succès',
                'sound' => $sound->fresh()->load(['user', 'category'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du son',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un son
     */
    public function destroy(Request $request, Sound $sound)
    {
        // Vérifier que l'utilisateur peut supprimer ce son
        if ($request->user()->id !== $sound->user_id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé à supprimer ce son'
            ], 403);
        }

        try {
            // Supprimer les fichiers associés
            if ($sound->file_path) {
                Storage::disk('public')->delete($sound->file_path);
            }
            if ($sound->cover_image) {
                Storage::disk('public')->delete($sound->cover_image);
            }

            $sound->delete();

            return response()->json([
                'success' => true,
                'message' => 'Son supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du son',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Télécharger un son
     */
    public function download(Sound $sound)
    {
        // Vérifier que le son est publié
        if ($sound->status !== 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Ce son n\'est pas disponible au téléchargement'
            ], 403);
        }

        // Incrémenter le compteur de téléchargements
        $sound->incrementDownloads();

        $filePath = storage_path('app/public/' . $sound->file_path);

        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'Fichier non trouvé'
            ], 404);
        }

        return response()->download($filePath, $sound->title . '.mp3');
    }

    /**
     * Obtenir les catégories pour le formulaire
     */
    public function getCategories()
    {
        $categories = Category::active()->ordered()->get();

        return response()->json([
            'success' => true,
            'categories' => $categories
        ]);
    }
}
