<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Event;
use App\Models\Sound;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArtistController extends Controller
{
    /**
     * Afficher la liste des artistes
     */
    public function index(Request $request)
    {
        try {
            $query = User::where('role', 'artist')
                         ->orWhere('role', 'producer');

            // Filtres
            if ($request->has('role') && $request->role !== 'all') {
                $query->where('role', $request->role);
            }

            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('bio', 'LIKE', "%{$search}%")
                      ->orWhere('city', 'LIKE', "%{$search}%")
                      ->orWhere('genre', 'LIKE', "%{$search}%");
                });
            }

            if ($request->has('city') && !empty($request->city)) {
                $query->where('city', $request->city);
            }

            if ($request->has('genre') && !empty($request->genre)) {
                $query->where('genre', $request->genre);
            }

            // Trier par nombre de followers décroissant
            $artists = $query->withCount(['sounds', 'events', 'followers'])
                            ->with(['sounds' => function($q) {
                                $q->where('status', 'published')
                                  ->orderBy('plays_count', 'desc')
                                  ->limit(3);
                            }])
                            ->orderByDesc('followers_count')
                            ->paginate($request->get('per_page', 12));

            // Ajouter des statistiques et le statut is_following pour chaque artiste
            $user = $request->user();
            $artists->getCollection()->transform(function ($artist) use ($user) {
                $artist->total_plays = $artist->sounds->sum('plays_count');
                $artist->total_likes = $artist->sounds->sum('likes_count');
                $artist->total_downloads = $artist->sounds->sum('downloads_count');
                $artist->average_rating = round($artist->sounds->avg('rating') ?? 0, 1);
                $artist->recent_activity = $artist->sounds->max('created_at');

                // Vérifier si l'utilisateur connecté suit cet artiste
                $artist->is_following = false;
                if ($user) {
                    $artist->is_following = $user->following()->where('followed_id', $artist->id)->exists();
                }

                // Ajouter l'URL de la photo de profil formatée
                $artist->profile_photo_url = $artist->profile_photo_path
                    ? asset('storage/' . $artist->profile_photo_path)
                    : "https://ui-avatars.com/api/?name=" . urlencode($artist->name) . "&color=7F9CF5&background=EBF4FF&size=200";

                // Formater les sons de l'artiste
                $artist->sounds = $artist->sounds->map(function($sound) {
                    // Ajouter l'URL de l'image de couverture formatée
                    $sound->cover_image_url = $sound->cover_image
                        ? asset('storage/' . $sound->cover_image)
                        : "https://ui-avatars.com/api/?name=" . urlencode($sound->title) . "&color=7F9CF5&background=EBF4FF&size=300";

                    // Ajouter la durée formatée
                    if ($sound->duration) {
                        $minutes = floor($sound->duration / 60);
                        $seconds = $sound->duration % 60;
                        $sound->formatted_duration = sprintf('%d:%02d', $minutes, $seconds);
                    } else {
                        $sound->formatted_duration = '0:00';
                    }

                    // Ajouter le prix formaté
                    if ($sound->is_free) {
                        $sound->formatted_price = 'Gratuit';
                    } else {
                        $sound->formatted_price = number_format($sound->price, 0, ',', ' ') . ' XAF';
                    }

                    return $sound;
                });

                return $artist;
            });

            return response()->json([
                'success' => true,
                'artists' => $artists,
                'filters' => [
                    'cities' => User::whereIn('role', ['artist', 'producer'])
                                   ->whereNotNull('city')
                                   ->distinct('city')
                                   ->pluck('city'),
                    'genres' => User::whereIn('role', ['artist', 'producer'])
                                   ->whereNotNull('genre')
                                   ->distinct('genre')
                                   ->pluck('genre')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des artistes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher le profil d'un artiste
     */
    public function show($id, Request $request)
    {
        try {
            $artist = User::whereIn('role', ['artist', 'producer'])
                         ->with(['sounds' => function($q) {
                             $q->where('status', 'published')
                               ->orderBy('created_at', 'desc');
                         }, 'events' => function($q) {
                             $q->where('status', 'published')
                               ->where('event_date', '>=', now())
                               ->orderBy('event_date', 'asc');
                         }])
                         ->withCount(['sounds', 'events', 'followers'])
                         ->findOrFail($id);

            // Statistiques de l'artiste
            $stats = [
                'total_plays' => $artist->sounds->sum('plays_count'),
                'total_downloads' => $artist->sounds->sum('downloads_count'),
                'total_likes' => $artist->sounds->sum('likes_count'),
                'total_revenue' => $artist->sounds->where('is_free', false)->sum('price'),
                'average_rating' => round($artist->sounds->avg('rating') ?? 0, 1),
                'events_organized' => $artist->events_count,
                'active_events' => $artist->events->where('event_date', '>=', now())->count(),
                'total_followers' => $artist->followers_count,
                'member_since' => $artist->created_at->format('Y-m-d'),
                'verification_status' => $artist->verified ?? false
            ];

            // Vérifier si l'utilisateur connecté suit cet artiste
            $isFollowing = false;
            if ($request->user()) {
                $isFollowing = $request->user()->following()->where('followed_id', $id)->exists();
            }

            // Événements récents et à venir
            $upcomingEvents = $artist->events()
                                    ->where('status', 'published')
                                    ->where('event_date', '>=', now())
                                    ->orderBy('event_date', 'asc')
                                    ->limit(6)
                                    ->get();

            // Sons populaires
            $popularSounds = $artist->sounds()
                                   ->where('status', 'published')
                                   ->orderBy('plays_count', 'desc')
                                   ->limit(8)
                                   ->get()
                                   ->map(function($sound) {
                                       // Ajouter l'URL de l'image de couverture formatée
                                       $sound->cover_image_url = $sound->cover_image
                                           ? asset('storage/' . $sound->cover_image)
                                           : "https://ui-avatars.com/api/?name=" . urlencode($sound->title) . "&color=7F9CF5&background=EBF4FF&size=300";

                                       // Ajouter la durée formatée
                                       if ($sound->duration) {
                                           $minutes = floor($sound->duration / 60);
                                           $seconds = $sound->duration % 60;
                                           $sound->formatted_duration = sprintf('%d:%02d', $minutes, $seconds);
                                       } else {
                                           $sound->formatted_duration = '0:00';
                                       }

                                       // Ajouter le prix formaté
                                       if ($sound->is_free) {
                                           $sound->formatted_price = 'Gratuit';
                                       } else {
                                           $sound->formatted_price = number_format($sound->price, 0, ',', ' ') . ' XAF';
                                       }

                                       return $sound;
                                   });

            // Sons récents
            $recentSounds = $artist->sounds()
                                  ->where('status', 'published')
                                  ->orderBy('created_at', 'desc')
                                  ->limit(6)
                                  ->get()
                                  ->map(function($sound) {
                                      // Ajouter l'URL de l'image de couverture formatée
                                      $sound->cover_image_url = $sound->cover_image
                                          ? asset('storage/' . $sound->cover_image)
                                          : "https://ui-avatars.com/api/?name=" . urlencode($sound->title) . "&color=7F9CF5&background=EBF4FF&size=300";

                                      // Ajouter la durée formatée
                                      if ($sound->duration) {
                                          $minutes = floor($sound->duration / 60);
                                          $seconds = $sound->duration % 60;
                                          $sound->formatted_duration = sprintf('%d:%02d', $minutes, $seconds);
                                      } else {
                                          $sound->formatted_duration = '0:00';
                                      }

                                      // Ajouter le prix formaté
                                      if ($sound->is_free) {
                                          $sound->formatted_price = 'Gratuit';
                                      } else {
                                          $sound->formatted_price = number_format($sound->price, 0, ',', ' ') . ' XAF';
                                      }

                                      return $sound;
                                  });

            // Ajouter les informations du profil complet
            $artist->makeVisible(['website', 'social_links', 'city', 'genre', 'verified', 'created_at']);

            // Ajouter l'URL de la photo de profil formatée
            $artist->profile_photo_url = $artist->profile_photo_path
                ? asset('storage/' . $artist->profile_photo_path)
                : "https://ui-avatars.com/api/?name=" . urlencode($artist->name) . "&color=7F9CF5&background=EBF4FF&size=200";

            return response()->json([
                'success' => true,
                'artist' => $artist,
                'stats' => $stats,
                'is_following' => $isFollowing,
                'upcoming_events' => $upcomingEvents,
                'popular_sounds' => $popularSounds,
                'recent_sounds' => $recentSounds
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Artiste non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Suivre/Ne plus suivre un artiste
     */
    public function toggleFollow($id, Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous devez être connecté pour suivre un artiste'
                ], 401);
            }

            $artist = User::whereIn('role', ['artist', 'producer'])->findOrFail($id);

            if ($user->id === $artist->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez pas vous suivre vous-même'
                ], 400);
            }

            $isFollowing = $user->following()->where('followed_id', $id)->exists();

            if ($isFollowing) {
                // Ne plus suivre
                $user->following()->detach($id);
                $action = 'unfollowed';
                $message = 'Vous ne suivez plus cet artiste';
            } else {
                // Suivre
                $user->following()->attach($id, ['created_at' => now(), 'updated_at' => now()]);
                $action = 'followed';
                $message = 'Vous suivez maintenant cet artiste';
            }

            // Compter les nouveaux followers
            $followersCount = $artist->followers()->count();

            return response()->json([
                'success' => true,
                'action' => $action,
                'message' => $message,
                'is_following' => !$isFollowing,
                'followers_count' => $followersCount
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les artistes populaires
     */
    public function popular(Request $request)
    {
        try {
            $artists = User::whereIn('role', ['artist', 'producer'])
                          ->withCount(['sounds', 'followers'])
                          ->having('followers_count', '>', 0)
                          ->orderByDesc('followers_count')
                          ->limit($request->get('limit', 8))
                          ->get();

            return response()->json([
                'success' => true,
                'artists' => $artists
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des artistes populaires',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les artistes recommandés
     */
    public function recommended(Request $request)
    {
        try {
            $user = $request->user();
            $artists = User::whereIn('role', ['artist', 'producer'])
                          ->withCount(['sounds', 'followers'])
                          ->when($user, function($query) use ($user) {
                              // Exclure les artistes déjà suivis
                              $followedIds = $user->following()->pluck('followed_id');
                              $query->whereNotIn('id', $followedIds);
                          })
                          ->where('sounds_count', '>', 0)
                          ->orderByDesc('followers_count')
                          ->limit($request->get('limit', 6))
                          ->get();

            return response()->json([
                'success' => true,
                'artists' => $artists
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des recommandations',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
