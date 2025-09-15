<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventController extends Controller
{
    /**
     * Afficher la liste des événements
     */
    public function index(Request $request)
    {
        $query = Event::with('user');

        // Filtrer par utilisateur si demandé
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filtrer par catégorie
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Filtrer par ville
        if ($request->filled('city')) {
            $query->where('city', 'like', '%' . $request->city . '%');
        }

        // Filtrer par statut
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Par défaut, ne montrer que les événements publiés pour les utilisateurs non-admin
            if (!$request->user() || $request->user()->role !== 'admin') {
                $query->published();
            }
        }

        // Recherche par titre
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        // Événements à venir seulement
        if ($request->boolean('upcoming')) {
            $query->upcoming();
        }

        // Événements gratuits uniquement
        if ($request->boolean('free')) {
            $query->free();
        }

        // Événements en vedette
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Filtrer par date
        if ($request->filled('date_from')) {
            $query->where('event_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('event_date', '<=', $request->date_to);
        }

        // Ordre
        $orderBy = $request->get('order_by', 'event_date');
        $orderDirection = $request->get('order_direction', 'asc');
        $query->orderBy($orderBy, $orderDirection);

        $perPage = $request->get('per_page', 12);
        $events = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'events' => $events
        ]);
    }

    /**
     * Stocker un nouvel événement
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:3000',
            'venue' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'country' => 'nullable|string|max:100',
            'event_date' => 'required|date|after:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'poster_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'gallery_images.*' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'category' => 'required|in:concert,festival,showcase,workshop,conference,party',
            'is_free' => 'boolean',
            'ticket_price' => 'nullable|numeric|min:0',
            'max_attendees' => 'nullable|integer|min:1',
            'artists' => 'nullable|array',
            'sponsors' => 'nullable|array',
            'requirements' => 'nullable|string|max:1000',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'website_url' => 'nullable|url|max:255',
            'social_links' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Upload de l'affiche si fournie
            $posterPath = null;
            if ($request->hasFile('poster_image')) {
                $posterPath = $request->file('poster_image')->store('events/posters', 'public');
            }

            // Upload des images de galerie si fournies
            $galleryPaths = [];
            if ($request->hasFile('gallery_images')) {
                foreach ($request->file('gallery_images') as $image) {
                    $galleryPaths[] = $image->store('events/gallery', 'public');
                }
            }

            $eventData = [
                'title' => $request->title,
                'slug' => Str::slug($request->title),
                'description' => $request->description,
                'user_id' => $request->user()->id,
                'venue' => $request->venue,
                'address' => $request->address,
                'city' => $request->city,
                'country' => $request->country ?? 'Cameroun',
                'event_date' => $request->event_date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'poster_image' => $posterPath,
                'gallery_images' => $galleryPaths,
                'category' => $request->category,
                'is_free' => $request->boolean('is_free', false),
                'ticket_price' => $request->boolean('is_free') ? null : $request->ticket_price,
                'max_attendees' => $request->max_attendees,
                'artists' => $request->artists,
                'sponsors' => $request->sponsors,
                'requirements' => $request->requirements,
                'contact_phone' => $request->contact_phone,
                'contact_email' => $request->contact_email,
                'website_url' => $request->website_url,
                'social_links' => $request->social_links,
                'status' => 'pending', // En attente de validation
            ];

            $event = Event::create($eventData);

            return response()->json([
                'success' => true,
                'message' => 'Événement créé avec succès',
                'event' => $event->load('user')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'événement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un événement spécifique
     */
    public function show(Event $event)
    {
        return response()->json([
            'success' => true,
            'event' => $event->load('user')
        ]);
    }

    /**
     * Mettre à jour un événement
     */
    public function update(Request $request, Event $event)
    {
        // Vérifier que l'utilisateur peut modifier cet événement
        if ($request->user()->id !== $event->user_id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé à modifier cet événement'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string|max:3000',
            'venue' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:500',
            'city' => 'sometimes|required|string|max:100',
            'country' => 'nullable|string|max:100',
            'event_date' => 'sometimes|required|date',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'poster_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'gallery_images.*' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'category' => 'sometimes|required|in:concert,festival,showcase,workshop,conference,party',
            'status' => 'sometimes|in:draft,published,cancelled,completed',
            'is_free' => 'boolean',
            'ticket_price' => 'nullable|numeric|min:0',
            'max_attendees' => 'nullable|integer|min:1',
            'artists' => 'nullable|array',
            'sponsors' => 'nullable|array',
            'requirements' => 'nullable|string|max:1000',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'website_url' => 'nullable|url|max:255',
            'social_links' => 'nullable|array',
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
                'title', 'description', 'venue', 'address', 'city', 'country',
                'event_date', 'start_time', 'end_time', 'category', 'is_free',
                'ticket_price', 'max_attendees', 'artists', 'sponsors',
                'requirements', 'contact_phone', 'contact_email',
                'website_url', 'social_links'
            ]);

            // Upload de la nouvelle affiche si fournie
            if ($request->hasFile('poster_image')) {
                // Supprimer l'ancienne affiche
                if ($event->poster_image) {
                    Storage::disk('public')->delete($event->poster_image);
                }
                $updateData['poster_image'] = $request->file('poster_image')->store('events/posters', 'public');
            }

            // Upload des nouvelles images de galerie si fournies
            if ($request->hasFile('gallery_images')) {
                // Supprimer les anciennes images de galerie
                if ($event->gallery_images) {
                    foreach ($event->gallery_images as $image) {
                        Storage::disk('public')->delete($image);
                    }
                }

                $galleryPaths = [];
                foreach ($request->file('gallery_images') as $image) {
                    $galleryPaths[] = $image->store('events/gallery', 'public');
                }
                $updateData['gallery_images'] = $galleryPaths;
            }

            // Seuls les admins peuvent changer le statut
            if ($request->has('status') && $request->user()->role === 'admin') {
                $updateData['status'] = $request->status;
            }

            // Régénérer le slug si le titre a changé
            if (isset($updateData['title'])) {
                $updateData['slug'] = Str::slug($updateData['title']);
            }

            $event->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Événement mis à jour avec succès',
                'event' => $event->fresh()->load('user')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'événement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un événement
     */
    public function destroy(Request $request, Event $event)
    {
        // Vérifier que l'utilisateur peut supprimer cet événement
        if ($request->user()->id !== $event->user_id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé à supprimer cet événement'
            ], 403);
        }

        try {
            // Supprimer les fichiers associés
            if ($event->poster_image) {
                Storage::disk('public')->delete($event->poster_image);
            }
            if ($event->gallery_images) {
                foreach ($event->gallery_images as $image) {
                    Storage::disk('public')->delete($image);
                }
            }

            $event->delete();

            return response()->json([
                'success' => true,
                'message' => 'Événement supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'événement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * S'inscrire à un événement
     */
    public function register(Request $request, Event $event)
    {
        // Vérifier que l'événement est publié et pas complet
        if ($event->status !== 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Cet événement n\'est pas disponible'
            ], 403);
        }

        if ($event->isSoldOut()) {
            return response()->json([
                'success' => false,
                'message' => 'Cet événement est complet'
            ], 403);
        }

        if ($event->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Cet événement est déjà passé'
            ], 403);
        }

        // Ici vous pourriez ajouter la logique d'inscription
        // (créer une table event_registrations, traiter le paiement, etc.)

        $event->incrementAttendees();

        return response()->json([
            'success' => true,
            'message' => 'Inscription réussie à l\'événement'
        ]);
    }
}
