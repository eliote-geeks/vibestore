<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        try {
            $query = Event::query();

            // Filtrer par statut actif si demandé
            if ($request->has('active') && $request->active == '1') {
                $query->where('status', 'active');
            }

            // Filtrer par catégorie si demandé
            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            // Filtrer par ville si demandé
            if ($request->has('city') && $request->city !== 'all') {
                $query->where('city', $request->city);
            }

            // Recherche par titre ou description
            if ($request->has('search') && !empty($request->search)) {
                $query->where(function($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%')
                      ->orWhere('description', 'like', '%' . $request->search . '%')
                      ->orWhere('artist', 'like', '%' . $request->search . '%');
                });
            }

            // Ordonner par date d'événement
            $query->orderBy('event_date', 'asc');

            $events = $query->get();

            return response()->json([
                'success' => true,
                'events' => $events,
                'total' => $events->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des événements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un nouvel événement
     */
    public function store(Request $request)
    {
        try {
            // Vérifier l'authentification
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié'
                ], 401);
            }

            // Validation des données selon les champs envoyés par AddEvent.jsx
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'category' => 'required|string|in:concert,festival,showcase,workshop,conference,party',
                'event_date' => 'required|date|after_or_equal:today',
                'start_time' => 'required|string',
                'end_time' => 'nullable|string',
                'venue' => 'required|string|max:255',
                'address' => 'required|string|max:500',
                'city' => 'required|string|max:100',
                'country' => 'nullable|string|max:100',
                'is_free' => 'nullable|boolean',
                'ticket_price' => 'nullable|numeric|min:0',
                'max_attendees' => 'nullable|integer|min:1',
                'poster_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'gallery_images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'artists.*' => 'nullable|string|max:255', // Tableau d'artistes
                'sponsors.*' => 'nullable|string|max:255', // Tableau de sponsors
                'requirements' => 'nullable|string',
                'contact_email' => 'required|email',
                'contact_phone' => 'required|string|max:20',
                'website_url' => 'nullable|url'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Créer l'événement avec les champs existants
            $eventData = $request->except(['poster_image', 'gallery_images', 'artists', 'sponsors']);
            $eventData['slug'] = Str::slug($request->title);
            $eventData['status'] = 'pending'; // En attente de validation (valeur maintenant valide)
            $eventData['user_id'] = auth('sanctum')->user()->id;

            // Traiter les artistes si fourni (convertir en JSON pour la BDD)
            if ($request->has('artists') && is_array($request->artists) && !empty($request->artists)) {
                $eventData['artists'] = json_encode(array_filter($request->artists));
            }

            // Traiter les sponsors si fourni (convertir en JSON pour la BDD)
            if ($request->has('sponsors') && is_array($request->sponsors) && !empty($request->sponsors)) {
                $eventData['sponsors'] = json_encode(array_filter($request->sponsors));
            }

            // Gérer l'image poster
            if ($request->hasFile('poster_image')) {
                $image = $request->file('poster_image');
                $imageName = time() . '_poster_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $imagePath = $image->storeAs('events/posters', $imageName, 'public');
                $eventData['poster_image'] = $imagePath;
            }

            $event = Event::create($eventData);

            // Gérer les images de galerie
            if ($request->hasFile('gallery_images')) {
                $galleryImages = [];
                foreach ($request->file('gallery_images') as $index => $image) {
                    $imageName = time() . '_gallery_' . $index . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                    $imagePath = $image->storeAs('events/gallery', $imageName, 'public');
                    $galleryImages[] = $imagePath;
                }
                $event->update(['gallery_images' => json_encode($galleryImages)]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Événement créé avec succès ! Il sera disponible après validation.',
                'event' => $event
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
    public function show($id)
    {
        try {
            $event = Event::findOrFail($id);

            return response()->json([
                'success' => true,
                'event' => $event
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Événement non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mettre à jour un événement
     */
    public function update(Request $request, $id)
    {
        try {
            // Vérifier l'authentification
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié'
                ], 401);
            }

            $event = Event::findOrFail($id);

            // Vérifier que l'utilisateur peut modifier cet événement
            $user = auth('sanctum')->user();
            if ($event->user_id !== $user->id && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Non autorisé à modifier cet événement'
                ], 403);
            }

            // Validation des données
            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|required|string',
                'category' => 'sometimes|required|string|in:festival,concert,soiree,showcase,workshop,conference,party',
                'event_date' => 'sometimes|required|date',
                'start_time' => 'sometimes|required|string',
                'end_time' => 'nullable|string',
                'venue' => 'nullable|string|max:255',
                'location' => 'sometimes|required|string|max:255',
                'city' => 'sometimes|required|string|max:100',
                'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'poster_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $eventData = $request->except(['featured_image', 'poster_image']);

            // Gérer l'image principale si fournie
            if ($request->hasFile('featured_image')) {
                // Supprimer l'ancienne image
                if ($event->featured_image) {
                    Storage::disk('public')->delete($event->featured_image);
                }

                $image = $request->file('featured_image');
                $imageName = time() . '_featured_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $imagePath = $image->storeAs('events/featured', $imageName, 'public');
                $eventData['featured_image'] = $imagePath;
            }

            // Gérer l'image poster si fournie
            if ($request->hasFile('poster_image')) {
                // Supprimer l'ancienne image
                if ($event->poster_image) {
                    Storage::disk('public')->delete($event->poster_image);
                }

                $image = $request->file('poster_image');
                $imageName = time() . '_poster_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $imagePath = $image->storeAs('events/posters', $imageName, 'public');
                $eventData['poster_image'] = $imagePath;
            }

            $event->update($eventData);

            return response()->json([
                'success' => true,
                'message' => 'Événement mis à jour avec succès',
                'event' => $event
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
    public function destroy($id)
    {
        try {
            // Vérifier l'authentification
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié'
                ], 401);
            }

            $event = Event::findOrFail($id);

            // Vérifier que l'utilisateur peut supprimer cet événement
            $user = auth('sanctum')->user();
            if ($event->user_id !== $user->id && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Non autorisé à supprimer cet événement'
                ], 403);
            }

            // Supprimer les images associées
            if ($event->featured_image) {
                Storage::disk('public')->delete($event->featured_image);
            }

            if ($event->poster_image) {
                Storage::disk('public')->delete($event->poster_image);
            }

            if ($event->gallery_images) {
                $galleryImages = is_array($event->gallery_images) ? $event->gallery_images : json_decode($event->gallery_images, true);
                if (is_array($galleryImages)) {
                    foreach ($galleryImages as $imagePath) {
                        Storage::disk('public')->delete($imagePath);
                    }
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
     * Approuver un événement (admin uniquement)
     */
    public function approve($id)
    {
        try {
            // Vérifier l'authentification
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié'
                ], 401);
            }

            $user = auth('sanctum')->user();

            // Vérifier que l'utilisateur est admin
            if ($user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les administrateurs peuvent approuver des événements'
                ], 403);
            }

            $event = Event::findOrFail($id);

            // Vérifier que l'événement est en attente
            if ($event->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet événement n\'est pas en attente d\'approbation'
                ], 400);
            }

            // Approuver l'événement (changer seulement le statut)
            $event->update([
                'status' => 'published'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Événement approuvé avec succès',
                'event' => $event->fresh() // Récupérer les données mises à jour
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation de l\'événement',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
