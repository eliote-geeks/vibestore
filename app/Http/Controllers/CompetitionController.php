<?php

namespace App\Http\Controllers;

use App\Models\Competition;
use App\Models\CompetitionParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CompetitionController extends Controller
{
    /**
     * Afficher la liste des compétitions
     */
    public function index(Request $request)
    {
        $query = Competition::with('user')->active();

        // Filtrage par statut
        if ($request->filled('status')) {
            $query->byStatus($request->get('status'));
        }

        // Filtrage par catégorie
        if ($request->filled('category') && $request->get('category') !== 'all') {
            $query->byCategory($request->get('category'));
        }

        // Recherche
        if ($request->filled('search')) {
            $query->search($request->get('search'));
        }

        // Tri
        switch ($request->get('sort_by')) {
            case 'start_date':
                $query->orderBy('start_date');
                break;
            case 'entry_fee':
                $query->orderBy('entry_fee');
                break;
            case 'participants':
                $query->orderByDesc('current_participants');
                break;
            case 'prize_pool':
                $query->orderByDesc('total_prize_pool');
                break;
            default:
                $query->orderByDesc('created_at');
                break;
        }

        $competitions = $query->paginate(12);

        // Ajouter les informations calculées
        $competitions->getCollection()->transform(function ($competition) {
            $competition->can_register = $competition->can_register;
            $competition->is_full = $competition->is_full;
            $competition->formatted_entry_fee = $competition->formatted_entry_fee;
            $competition->formatted_total_prize_pool = $competition->formatted_total_prize_pool;
            $competition->formatted_duration = $competition->formatted_duration;
            return $competition;
        });

        return response()->json([
            'competitions' => $competitions,
            'message' => 'Compétitions récupérées avec succès'
        ]);
    }

    /**
     * Afficher une compétition spécifique
     */
    public function show($id)
    {
        $competition = Competition::with([
            'user',
            'participants.user',
            'winners.user'
        ])->findOrFail($id);

        // Vérifier si l'utilisateur actuel participe
        $userParticipation = null;
        if (Auth::check()) {
            $userParticipation = $competition->participants()
                ->where('user_id', Auth::id())
                ->first();
        }

        return response()->json([
            'competition' => $competition,
            'user_participation' => $userParticipation,
            'prize_amounts' => $competition->prize_amounts,
            'message' => 'Compétition récupérée avec succès'
        ]);
    }

    /**
     * Créer une nouvelle compétition
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string|max:100',
            'entry_fee' => 'required|numeric|min:500',
            'max_participants' => 'required|integer|min:2|max:50',
            'start_date' => 'required|date|after:today',
            'start_time' => 'required|date_format:H:i',
            'duration' => 'required|integer|min:30',
            'rules' => 'required|array|min:1',
            'rules.*' => 'string',
            'prizes' => 'required|array|min:1',
            'prizes.*.position' => 'required|integer',
            'prizes.*.percentage' => 'required|numeric|min:0|max:100',
            'prizes.*.label' => 'required|string',
            'judging_criteria' => 'required|array|min:1',
            'judging_criteria.*.name' => 'required|string',
            'judging_criteria.*.weight' => 'required|numeric|min:0|max:100',
            'image' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Validation personnalisée pour les pourcentages de prix
        $totalPrizePercentage = array_sum(array_column($request->get('prizes', []), 'percentage'));
        if ($totalPrizePercentage !== 100) {
            $validator->errors()->add('prizes', 'Le total des pourcentages de prix doit égaler 100%');
        }

        // Validation pour les poids des critères
        $totalWeight = array_sum(array_column($request->get('judging_criteria', []), 'weight'));
        if ($totalWeight !== 100) {
            $validator->errors()->add('judging_criteria', 'Le total des poids des critères doit égaler 100%');
        }

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $competitionData = [
                'title' => $request->get('title'),
                'description' => $request->get('description'),
                'category' => $request->get('category'),
                'entry_fee' => $request->get('entry_fee'),
                'max_participants' => $request->get('max_participants'),
                'start_date' => $request->get('start_date'),
                'start_time' => $request->get('start_time'),
                'duration' => $request->get('duration'),
                'rules' => array_filter($request->get('rules')), // Enlever les règles vides
                'prizes' => $request->get('prizes'),
                'judging_criteria' => $request->get('judging_criteria'),
                'status' => 'published', // Publier directement
                'user_id' => Auth::id(),
            ];

            // Upload de l'image si fournie
            if ($request->hasFile('image')) {
                $imageFile = $request->file('image');
                $competitionData['image_path'] = $imageFile->store('competitions/images', 'public');
            }

            // Calculer la deadline d'inscription (24h avant le début)
            $startDateTime = Carbon::parse($request->get('start_date') . ' ' . $request->get('start_time'));
            $competitionData['registration_deadline'] = $startDateTime->subDay();

            $competition = Competition::create($competitionData);

            return response()->json([
                'competition' => $competition->load('user'),
                'message' => 'Compétition créée avec succès !'
            ], 201);

        } catch (\Exception $e) {
            // Nettoyer le fichier uploadé en cas d'erreur
            if (isset($competitionData['image_path'])) {
                Storage::disk('public')->delete($competitionData['image_path']);
            }

            return response()->json([
                'message' => 'Erreur lors de la création de la compétition',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour une compétition
     */
    public function update(Request $request, $id)
    {
        $competition = Competition::findOrFail($id);

        // Vérifier que l'utilisateur est propriétaire de la compétition ou admin
        if ($competition->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Empêcher la modification si la compétition a déjà commencé
        if ($competition->status === 'active' || $competition->status === 'completed') {
            return response()->json([
                'message' => 'Impossible de modifier une compétition en cours ou terminée'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'category' => 'sometimes|required|string|max:100',
            'entry_fee' => 'sometimes|required|numeric|min:500',
            'max_participants' => 'sometimes|required|integer|min:2|max:50',
            'start_date' => 'sometimes|required|date|after:today',
            'start_time' => 'sometimes|required|date_format:H:i',
            'duration' => 'sometimes|required|integer|min:30',
            'rules' => 'sometimes|required|array|min:1',
            'prizes' => 'sometimes|required|array|min:1',
            'judging_criteria' => 'sometimes|required|array|min:1',
            'image' => 'sometimes|file|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = [];

            // Mise à jour des champs simples
            $fieldsToUpdate = ['title', 'description', 'category', 'entry_fee', 'max_participants', 'start_date', 'start_time', 'duration'];
            foreach ($fieldsToUpdate as $field) {
                if ($request->filled($field)) {
                    $updateData[$field] = $request->get($field);
                }
            }

            // Mise à jour des champs JSON
            if ($request->filled('rules')) {
                $updateData['rules'] = array_filter($request->get('rules'));
            }
            if ($request->filled('prizes')) {
                $updateData['prizes'] = $request->get('prizes');
            }
            if ($request->filled('judging_criteria')) {
                $updateData['judging_criteria'] = $request->get('judging_criteria');
            }

            // Upload nouvelle image si fournie
            if ($request->hasFile('image')) {
                // Supprimer l'ancienne image
                if ($competition->image_path) {
                    Storage::disk('public')->delete($competition->image_path);
                }

                $imageFile = $request->file('image');
                $updateData['image_path'] = $imageFile->store('competitions/images', 'public');
            }

            $competition->update($updateData);

            return response()->json([
                'competition' => $competition->fresh()->load('user'),
                'message' => 'Compétition mise à jour avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une compétition
     */
    public function destroy($id)
    {
        $competition = Competition::findOrFail($id);

        // Vérifier que l'utilisateur est propriétaire de la compétition ou admin
        if ($competition->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Empêcher la suppression si la compétition a des participants
        if ($competition->current_participants > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer une compétition avec des participants'
            ], 400);
        }

        try {
            // Supprimer l'image
            if ($competition->image_path) {
                Storage::disk('public')->delete($competition->image_path);
            }

            $competition->delete();

            return response()->json([
                'message' => 'Compétition supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * S'inscrire à une compétition
     */
    public function register(Request $request, $id)
    {
        $competition = Competition::findOrFail($id);
        $userId = Auth::id();

        // Vérifications
        if (!$competition->can_register) {
            return response()->json([
                'message' => 'Les inscriptions sont fermées pour cette compétition'
            ], 400);
        }

        if ($competition->hasParticipant($userId)) {
            return response()->json([
                'message' => 'Vous êtes déjà inscrit à cette compétition'
            ], 400);
        }

        try {
            $participant = $competition->addParticipant($userId, $competition->entry_fee);

            return response()->json([
                'participant' => $participant,
                'message' => 'Inscription réussie !'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'inscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Se désinscrire d'une compétition
     */
    public function unregister($id)
    {
        $competition = Competition::findOrFail($id);
        $userId = Auth::id();

        if (!$competition->hasParticipant($userId)) {
            return response()->json([
                'message' => 'Vous n\'êtes pas inscrit à cette compétition'
            ], 400);
        }

        // Empêcher la désinscription si la compétition a commencé
        if ($competition->status === 'active' || $competition->status === 'completed') {
            return response()->json([
                'message' => 'Impossible de se désinscrire d\'une compétition en cours'
            ], 400);
        }

        try {
            $competition->removeParticipant($userId);

            return response()->json([
                'message' => 'Désinscription réussie'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la désinscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les catégories disponibles depuis la base de données
     */
    public function getCategories()
    {
        try {
            $categories = \App\Models\Category::active()
                ->ordered()
                ->select('id', 'name', 'color', 'icon', 'description')
                ->get();

            return response()->json([
                'categories' => $categories,
                'message' => 'Catégories récupérées avec succès'
            ]);
        } catch (\Exception $e) {
            // Fallback avec categories hardcodées si erreur
            $fallbackCategories = [
                ['id' => null, 'name' => 'Rap', 'color' => '#4ECDC4', 'icon' => 'faMicrophone'],
                ['id' => null, 'name' => 'Afrobeat', 'color' => '#FF6B35', 'icon' => 'faHeart'],
                ['id' => null, 'name' => 'Makossa', 'color' => '#45B7D1', 'icon' => 'faMusic'],
                ['id' => null, 'name' => 'Gospel', 'color' => '#DDA0DD', 'icon' => 'faHandsPraying'],
                ['id' => null, 'name' => 'Jazz', 'color' => '#A29BFE', 'icon' => 'faMusic'],
                ['id' => null, 'name' => 'Reggae', 'color' => '#00B894', 'icon' => 'faLeaf'],
                ['id' => null, 'name' => 'Hip-Hop', 'color' => '#636E72', 'icon' => 'faMicrophone'],
                ['id' => null, 'name' => 'RnB', 'color' => '#FFEAA7', 'icon' => 'faHeartbeat'],
                ['id' => null, 'name' => 'Pop', 'color' => '#74B9FF', 'icon' => 'faStar'],
                ['id' => null, 'name' => 'Folk', 'color' => '#00B894', 'icon' => 'faLeaf']
            ];

            return response()->json([
                'categories' => $fallbackCategories,
                'message' => 'Catégories de fallback utilisées'
            ]);
        }
    }

    /**
     * Obtenir les compétitions à venir
     */
    public function upcoming()
    {
        $competitions = Competition::with('user')
            ->upcoming()
            ->orderBy('start_date')
            ->limit(10)
            ->get();

        return response()->json([
            'competitions' => $competitions,
            'message' => 'Compétitions à venir récupérées'
        ]);
    }

    /**
     * Obtenir les compétitions populaires
     */
    public function popular()
    {
        $competitions = Competition::with('user')
            ->active()
            ->orderByDesc('current_participants')
            ->orderByDesc('total_prize_pool')
            ->limit(10)
            ->get();

        return response()->json([
            'competitions' => $competitions,
            'message' => 'Compétitions populaires récupérées'
        ]);
    }

    /**
     * Obtenir les compétitions de l'utilisateur connecté
     */
    public function getUserCompetitions(Request $request)
    {
        try {
            $user = Auth::user();

            $query = Competition::where('user_id', $user->id)->with('user');

            // Filtrage par statut
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $competitions = $query->paginate($request->get('per_page', 12));

            // Ajouter les informations supplémentaires
            $competitions->getCollection()->transform(function ($competition) {
                $competition->can_register = $competition->can_register;
                $competition->is_full = $competition->is_full;
                $competition->formatted_entry_fee = $competition->formatted_entry_fee;
                $competition->formatted_total_prize_pool = $competition->formatted_total_prize_pool;
                $competition->formatted_duration = $competition->formatted_duration;
                return $competition;
            });

            return response()->json([
                'success' => true,
                'competitions' => $competitions->items(),
                'pagination' => [
                    'current_page' => $competitions->currentPage(),
                    'last_page' => $competitions->lastPage(),
                    'per_page' => $competitions->perPage(),
                    'total' => $competitions->total(),
                    'has_more' => $competitions->hasMorePages()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des compétitions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les compétitions d'un artiste spécifique
     */
    public function getArtistCompetitions(Request $request, $id)
    {
        try {
            $query = Competition::where('user_id', $id)
                               ->where('status', 'published')
                               ->with('user');

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $competitions = $query->paginate($request->get('per_page', 12));

            // Ajouter les informations supplémentaires
            $competitions->getCollection()->transform(function ($competition) {
                $competition->can_register = $competition->can_register;
                $competition->is_full = $competition->is_full;
                $competition->formatted_entry_fee = $competition->formatted_entry_fee;
                $competition->formatted_total_prize_pool = $competition->formatted_total_prize_pool;
                $competition->formatted_duration = $competition->formatted_duration;
                return $competition;
            });

            return response()->json([
                'success' => true,
                'competitions' => $competitions->items(),
                'pagination' => [
                    'current_page' => $competitions->currentPage(),
                    'last_page' => $competitions->lastPage(),
                    'per_page' => $competitions->perPage(),
                    'total' => $competitions->total(),
                    'has_more' => $competitions->hasMorePages()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des compétitions de l\'artiste',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les participants d'une compétition
     */
    public function getParticipants($id)
    {
        try {
            $competition = Competition::findOrFail($id);
            
            $participants = \App\Models\CompetitionParticipant::where('competition_id', $id)
                ->with(['user'])
                ->orderBy('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'participants' => $participants,
                'message' => 'Participants récupérés'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les messages de chat d'une compétition
     */
    public function getChatMessages($id)
    {
        try {
            $competition = Competition::findOrFail($id);
            
            $messages = \App\Models\CompetitionChatMessage::forCompetition($id)
                ->visible()
                ->with(['user'])
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->reverse()
                ->values();

            return response()->json([
                'success' => true,
                'messages' => $messages,
                'message' => 'Messages de chat récupérés'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement du chat',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Envoyer un message dans le chat
     */
    public function sendChatMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'competition_id' => 'required|exists:competitions,id',
            'message' => 'required|string|max:500',
            'type' => 'in:text,emoji',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            $competition = Competition::findOrFail($request->competition_id);

            // Vérifier si l'utilisateur peut envoyer des messages
            if ($competition->status !== 'active' && $competition->status !== 'published') {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat non disponible pour cette compétition'
                ], 400);
            }

            $message = \App\Models\CompetitionChatMessage::create([
                'competition_id' => $request->competition_id,
                'user_id' => $user->id,
                'message' => $request->message,
                'type' => $request->type ?? 'text'
            ]);

            return response()->json([
                'success' => true,
                'message' => $message->load('user'),
                'message_text' => 'Message envoyé'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi du message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajouter une réaction à un participant
     */
    public function addReaction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'participant_id' => 'required|exists:competition_participants,id',
            'reaction_type' => 'required|in:hearts,likes,fire,clap,wow,sad',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            $participant = \App\Models\CompetitionParticipant::findOrFail($request->participant_id);
            
            // Vérifier que la compétition est active
            if ($participant->competition->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Les réactions ne sont disponibles que pendant les compétitions actives'
                ], 400);
            }

            // Créer ou mettre à jour la réaction
            $reaction = \App\Models\CompetitionReaction::updateOrCreate([
                'competition_id' => $participant->competition_id,
                'participant_id' => $request->participant_id,
                'user_id' => $user->id,
                'reaction_type' => $request->reaction_type
            ], [
                'reacted_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'reaction' => $reaction,
                'message' => 'Réaction ajoutée'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout de la réaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajouter un vote pour un participant
     */
    public function addVote(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'participant_id' => 'required|exists:competition_participants,id',
            'vote_type' => 'required|in:up,down',
            'comment' => 'nullable|string|max:200'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            $participant = \App\Models\CompetitionParticipant::findOrFail($request->participant_id);
            
            // Vérifier que l'utilisateur ne vote pas pour lui-même
            if ($participant->user_id === $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez pas voter pour vous-même'
                ], 400);
            }

            // Créer ou mettre à jour le vote
            $vote = \App\Models\CompetitionVote::updateOrCreate([
                'competition_id' => $participant->competition_id,
                'participant_id' => $request->participant_id,
                'user_id' => $user->id,
            ], [
                'vote_type' => $request->vote_type,
                'score' => $request->vote_type === 'up' ? 1 : -1,
                'comment' => $request->comment,
                'voted_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'vote' => $vote,
                'message' => 'Vote enregistré'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement du vote',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soumettre une performance audio
     */
    public function submitPerformance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'competition_id' => 'required|exists:competitions,id',
            'audio' => 'required|file|mimes:wav,mp3,ogg|max:10240', // 10MB max
            'title' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'duration' => 'nullable|integer|min:1|max:180' // 3 minutes max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            $competition = Competition::findOrFail($request->competition_id);

            // Vérifier que l'utilisateur est inscrit
            $participant = \App\Models\CompetitionParticipant::where([
                'competition_id' => $competition->id,
                'user_id' => $user->id
            ])->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous devez être inscrit à cette compétition'
                ], 400);
            }

            // Vérifier qu'une performance n'existe pas déjà
            $existingPerformance = \App\Models\CompetitionPerformance::where([
                'competition_id' => $competition->id,
                'participant_id' => $participant->id
            ])->first();

            if ($existingPerformance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez déjà soumis une performance pour cette compétition'
                ], 400);
            }

            // Upload du fichier audio
            $audioFile = $request->file('audio');
            $fileName = time() . '_' . $user->id . '_' . $audioFile->getClientOriginalName();
            $filePath = $audioFile->storeAs('competitions/performances', $fileName, 'public');

            // Créer la performance
            $performance = \App\Models\CompetitionPerformance::create([
                'competition_id' => $competition->id,
                'participant_id' => $participant->id,
                'title' => $request->title,
                'description' => $request->description,
                'audio_file_path' => $filePath,
                'audio_file_name' => $fileName,
                'duration_seconds' => $request->duration ?? 0,
                'file_size_kb' => round($audioFile->getSize() / 1024),
                'metadata' => [
                    'original_name' => $audioFile->getClientOriginalName(),
                    'mime_type' => $audioFile->getMimeType(),
                    'uploaded_at' => now()
                ]
            ]);

            return response()->json([
                'success' => true,
                'performance' => $performance,
                'message' => 'Performance soumise avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la soumission de la performance',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
