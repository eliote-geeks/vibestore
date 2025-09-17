<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Sound;
use App\Models\Event;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    /**
     * Afficher la liste des utilisateurs pour le dashboard admin
     */
    public function index(Request $request)
    {
        try {
            // Vérifier que l'utilisateur connecté est admin
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $user = auth('sanctum')->user();
            // Pour l'instant, on permet l'accès à tous les utilisateurs connectés
            // if (!$user->is_admin) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'Accès réservé aux administrateurs'
            //     ], 403);
            // }

            $query = User::query();

            // Filtrer par rôle
            if ($request->filled('role') && $request->role !== 'all') {
                $query->where('role', $request->role);
            }

            // Recherche
            if ($request->filled('search')) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('email', 'like', '%' . $request->search . '%');
                });
            }

            // Tri
            $sortBy = $request->get('sort', 'created_at');
            $sortOrder = $request->get('order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = min($request->get('per_page', 15), 50);
            $users = $query->paginate($perPage);

            // Formatter les données
            $users->getCollection()->transform(function ($user) {
                // Calculer les statistiques de l'utilisateur
                $soundsCount = Sound::where('user_id', $user->id)->count();
                $eventsCount = Event::where('user_id', $user->id)->count();

                $soundsRevenue = Sound::where('user_id', $user->id)
                    ->where('is_free', false)
                    ->sum('price');

                $totalPlays = Sound::where('user_id', $user->id)->sum('plays_count');

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'user',
                    'status' => 'active', // Par défaut
                    'avatar' => null, // À implémenter
                    'sounds_count' => $soundsCount,
                    'events_count' => $eventsCount,
                    'revenue' => $soundsRevenue,
                    'total_plays' => $totalPlays,
                    'join_date' => $user->created_at->format('Y-m-d'),
                    'email_verified' => $user->email_verified_at ? true : false,
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                ];
            });

            return response()->json([
                'success' => true,
                'users' => $users->items(),
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                    'has_more' => $users->hasMorePages()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des utilisateurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des utilisateurs
     */
    public function stats(Request $request)
    {
        try {
            // Vérifier l'authentification
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            // Statistiques générales
            $totalUsers = User::count();
            $newUsersThisMonth = User::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            $newUsersLastMonth = User::whereMonth('created_at', now()->subMonth()->month)
                ->whereYear('created_at', now()->subMonth()->year)
                ->count();

            $growthPercentage = $newUsersLastMonth > 0
                ? (($newUsersThisMonth - $newUsersLastMonth) / $newUsersLastMonth) * 100
                : 0;

            // Compter les artistes (utilisateurs avec des sons)
            $artistsCount = User::whereHas('sounds')->count();

            // Compter les producteurs (utilisateurs avec des événements)
            $producersCount = User::whereHas('events')->count();

            // Top artistes (par nombre de sons)
            $topArtists = User::withCount('sounds')
                ->having('sounds_count', '>', 0)
                ->orderBy('sounds_count', 'desc')
                ->limit(5)
                ->get(['id', 'name', 'sounds_count']);

            // Revenus totaux générés par les utilisateurs
            $totalRevenue = Sound::where('is_free', false)->sum('price');

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_users' => $totalUsers,
                    'new_users_this_month' => $newUsersThisMonth,
                    'growth_percentage' => round($growthPercentage, 2),
                    'artists_count' => $artistsCount,
                    'producers_count' => $producersCount,
                    'total_revenue' => $totalRevenue,
                    'top_artists' => $topArtists
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un utilisateur spécifique
     */
    public function show($id)
    {
        try {
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $authUser = auth('sanctum')->user();
            if (!$authUser->is_admin && $authUser->id != $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }

            $user = User::withCount(['sounds', 'events'])->findOrFail($id);

            // Calculer les statistiques détaillées
            $soundsRevenue = Sound::where('user_id', $user->id)
                ->where('is_free', false)
                ->sum('price');

            $totalPlays = Sound::where('user_id', $user->id)->sum('plays_count');
            $totalDownloads = Sound::where('user_id', $user->id)->sum('downloads_count');

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'user',
                    'status' => $user->status ?? 'active',
                    'avatar' => $user->avatar_url ?? null,
                    'sounds_count' => $user->sounds_count,
                    'events_count' => $user->events_count,
                    'revenue' => $soundsRevenue,
                    'total_plays' => $totalPlays,
                    'total_downloads' => $totalDownloads,
                    'join_date' => $user->created_at->format('Y-m-d'),
                    'last_login' => $user->last_login_at ? $user->last_login_at->format('Y-m-d H:i') : null,
                    'email_verified' => $user->email_verified_at ? true : false,
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, $id)
    {
        try {
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $authUser = auth('sanctum')->user();
            if (!$authUser->is_admin && $authUser->id != $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }

            $user = User::findOrFail($id);

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $id,
                'role' => 'sometimes|required|in:user,artist,producer,admin',
                'status' => 'sometimes|required|in:active,suspended,banned',
                'password' => 'sometimes|nullable|string|min:8',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Mise à jour
            $updateData = $request->only(['name', 'email', 'role', 'status']);

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur mis à jour avec succès',
                'user' => $user->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy($id)
    {
        try {
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $authUser = auth('sanctum')->user();
            if ($authUser->id == $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez pas supprimer votre propre compte'
                ], 403);
            }

            $user = User::findOrFail($id);
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les notifications de l'utilisateur connecté
     */
    public function getNotifications(Request $request)
    {
        try {
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $user = auth('sanctum')->user();

            // Récupérer les notifications avec pagination
            $perPage = $request->get('per_page', 10);
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Formater les notifications
            $formattedNotifications = $notifications->getCollection()->map(function ($notification) {
                $data = $notification->data;
                return [
                    'id' => $notification->id,
                    'type' => $data['type'] ?? 'info',
                    'title' => $data['title'] ?? 'Notification',
                    'message' => $data['message'] ?? '',
                    'icon' => $data['icon'] ?? 'fas fa-bell',
                    'color' => $data['color'] ?? 'primary',
                    'action_url' => $data['action_url'] ?? null,
                    'sound_id' => $data['sound_id'] ?? null,
                    'sound_title' => $data['sound_title'] ?? null,
                    'reason' => $data['reason'] ?? null,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at->toISOString(),
                    'created_at_human' => $notification->created_at->diffForHumans(),
                ];
            });

            return response()->json([
                'success' => true,
                'notifications' => $formattedNotifications,
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'last_page' => $notifications->lastPage(),
                ],
                'unread_count' => $user->unreadNotifications->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marquer une notification comme lue
     */
    public function markNotificationAsRead(Request $request, $notificationId)
    {
        try {
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $user = auth('sanctum')->user();

            $notification = $user->notifications()->where('id', $notificationId)->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification non trouvée'
                ], 404);
            }

            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marquée comme lue'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllNotificationsAsRead(Request $request)
    {
        try {
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $user = auth('sanctum')->user();
            $user->unreadNotifications->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Toutes les notifications ont été marquées comme lues'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une notification
     */
    public function deleteNotification(Request $request, $notificationId)
    {
        try {
            if (!auth('sanctum')->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $user = auth('sanctum')->user();

            $notification = $user->notifications()->where('id', $notificationId)->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification non trouvée'
                ], 404);
            }

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification supprimée'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les sons achetés par l'utilisateur
     */
    public function getPurchasedSounds(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            $purchasedSounds = $user->payments()
                ->where('type', 'sound')
                ->where('status', 'completed')
                ->with([
                    'sound.user:id,name',
                    'sound.category:id,name'
                ])
                ->whereHas('sound') // S'assurer que le son existe encore
                ->latest('paid_at')
                ->get()
                ->map(function ($payment) {
                    $sound = $payment->sound;

                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'artist' => $sound->user->name,
                        'category' => $sound->category->name ?? 'Non catégorisé',
                        'duration' => $sound->formatted_duration,
                        'cover_image_url' => $sound->cover_image_url,
                        'audio_file_url' => $sound->file_url,
                        'purchase_price' => $payment->amount,
                        'purchased_at' => $payment->paid_at ?? $payment->created_at,
                        'can_download' => true,
                        'can_play' => true,
                        'order_number' => $payment->transaction_id,
                        'file_size' => $sound->file_size ?? null,
                        'genre' => $sound->genre,
                        'bpm' => $sound->bpm,
                        'key' => $sound->key
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $purchasedSounds,
                'total' => $purchasedSounds->count(),
                'total_spent' => $purchasedSounds->sum('purchase_price')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des sons achetés',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les événements achetés par l'utilisateur
     */
    public function getPurchasedEvents(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            $purchasedEvents = $user->payments()
                ->where('type', 'event')
                ->where('status', 'completed')
                ->with([
                    'event.user:id,name'
                ])
                ->whereHas('event') // S'assurer que l'événement existe encore
                ->latest('paid_at')
                ->get()
                ->map(function ($payment) {
                    $event = $payment->event;
                    $metadata = $payment->metadata ?? [];
                    $quantity = $metadata['quantity'] ?? 1;

                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'organizer' => $event->user->name,
                        'venue' => $event->venue,
                        'address' => $event->address,
                        'city' => $event->city,
                        'country' => $event->country ?? 'Cameroun',
                        'event_date' => $event->event_date,
                        'start_time' => $event->start_time ? $event->start_time->format('H:i') : null,
                        'end_time' => $event->end_time ? $event->end_time->format('H:i') : null,
                        'poster_url' => $event->poster_image_url,
                        'ticket_price' => $payment->amount / $quantity,
                        'quantity' => $quantity,
                        'total_paid' => $payment->amount,
                        'purchased_at' => $payment->paid_at ?? $payment->created_at,
                        'order_number' => $payment->transaction_id,
                        'status' => 'confirmed',
                        'event_status' => $event->status,
                        'is_past' => $event->event_date < now(),
                        'days_until' => $event->event_date > now() ? now()->diffInDays($event->event_date) : null
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $purchasedEvents,
                'total' => $purchasedEvents->count(),
                'total_spent' => $purchasedEvents->sum('total_paid'),
                'upcoming_count' => $purchasedEvents->where('is_past', false)->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des événements achetés',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les sons de l'utilisateur connecté avec statistiques détaillées
     */
    public function getUserSounds(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            // Paramètres de pagination et filtres
            $perPage = $request->get('per_page', 10);
            $status = $request->get('status'); // draft, pending, published, rejected
            $category = $request->get('category');
            $sortBy = $request->get('sort_by', 'created_at'); // created_at, title, plays_count, likes_count, downloads_count
            $sortOrder = $request->get('sort_order', 'desc');

            // Construction de la requête
            $query = Sound::where('user_id', $user->id)
                ->with([
                    'category:id,name,slug',
                    'payments' => function($query) {
                        $query->where('status', 'completed');
                    }
                ])
                ->withCount([
                    'likes',
                    'payments as sales_count' => function($query) {
                        $query->where('status', 'completed');
                    }
                ]);

            // Filtres
            if ($status) {
                $query->where('status', $status);
            }

            if ($category) {
                $query->where('category_id', $category);
            }

            // Tri
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $sounds = $query->paginate($perPage);

            // Calcul des statistiques globales de l'utilisateur
            $totalSounds = Sound::where('user_id', $user->id)->count();
            $publishedSounds = Sound::where('user_id', $user->id)->where('status', 'published')->count();
            $totalPlays = Sound::where('user_id', $user->id)->sum('plays_count');
            $totalLikes = Sound::where('user_id', $user->id)->sum('likes_count');
            $totalDownloads = Sound::where('user_id', $user->id)->sum('downloads_count');

            // Calcul du revenu total
            $totalRevenue = \DB::table('payments')
                ->join('sounds', 'payments.sound_id', '=', 'sounds.id')
                ->where('sounds.user_id', $user->id)
                ->where('payments.status', 'completed')
                ->sum('payments.amount');

            // Transformation des données
            $soundsData = $sounds->getCollection()->map(function ($sound) {
                // Calcul du revenu pour ce son
                $revenue = $sound->payments->sum('amount');
                $salesCount = $sound->sales_count;

                // Calcul du taux de conversion (likes vers ventes)
                $conversionRate = $sound->likes_count > 0 ? ($salesCount / $sound->likes_count) * 100 : 0;

                // Statut de performance
                $performance = 'faible';
                if ($sound->plays_count > 100 && $sound->likes_count > 10) {
                    $performance = 'excellente';
                } elseif ($sound->plays_count > 50 && $sound->likes_count > 5) {
                    $performance = 'bonne';
                } elseif ($sound->plays_count > 20) {
                    $performance = 'moyenne';
                }

                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                    'slug' => $sound->slug,
                        'description' => $sound->description,
                    'category' => [
                        'id' => $sound->category->id ?? null,
                        'name' => $sound->category->name ?? 'Non catégorisé',
                        'slug' => $sound->category->slug ?? null
                    ],
                        'status' => $sound->status,
                    'status_label' => $this->getStatusLabel($sound->status),

                    // Informations du fichier
                    'duration' => $sound->duration,
                    'formatted_duration' => $sound->formatted_duration,
                    'genre' => $sound->genre,
                    'bpm' => $sound->bpm,
                    'key' => $sound->key,
                    'tags' => $sound->tags ?? [],

                    // URLs
                        'cover_image_url' => $sound->cover_image_url,
                        'file_url' => $sound->file_url,
                    'preview_url' => $sound->file_url, // Pour l'aperçu

                    // Informations de prix
                    'price' => $sound->price,
                    'formatted_price' => $sound->formatted_price,
                    'is_free' => $sound->is_free,
                    'is_featured' => $sound->is_featured,

                    // Statistiques détaillées
                    'stats' => [
                        'plays_count' => $sound->plays_count ?? 0,
                        'likes_count' => $sound->likes_count,
                        'downloads_count' => $sound->downloads_count ?? 0,
                        'sales_count' => $salesCount,
                        'revenue' => $revenue,
                        'formatted_revenue' => number_format($revenue, 0, ',', ' ') . ' XAF',
                        'conversion_rate' => round($conversionRate, 2),
                        'performance' => $performance
                    ],

                    // Informations de licence et droits
                    'license_info' => [
                        'license_type' => $sound->license_type,
                        'copyright_owner' => $sound->copyright_owner,
                        'composer' => $sound->composer,
                        'performer' => $sound->performer,
                        'producer' => $sound->producer,
                        'commercial_use' => $sound->commercial_use,
                        'attribution_required' => $sound->attribution_required,
                        'modifications_allowed' => $sound->modifications_allowed,
                        'distribution_allowed' => $sound->distribution_allowed
                    ],

                    // Dates
                    'created_at' => $sound->created_at,
                    'updated_at' => $sound->updated_at,
                    'release_date' => $sound->release_date,
                    'created_at_human' => $sound->created_at->diffForHumans(),

                    // Actions possibles
                    'can_edit' => in_array($sound->status, ['draft', 'rejected']),
                    'can_delete' => in_array($sound->status, ['draft', 'rejected']),
                    'can_publish' => $sound->status === 'draft',
                    'can_feature' => $sound->status === 'published' && !$sound->is_featured,
                ];
            });

            // Statistiques par statut
            $statusStats = [
                'draft' => Sound::where('user_id', $user->id)->where('status', 'draft')->count(),
                'pending' => Sound::where('user_id', $user->id)->where('status', 'pending')->count(),
                'published' => Sound::where('user_id', $user->id)->where('status', 'published')->count(),
                'rejected' => Sound::where('user_id', $user->id)->where('status', 'rejected')->count(),
            ];

            // Top 5 des sons les plus performants
            $topSounds = Sound::where('user_id', $user->id)
                ->where('status', 'published')
                ->orderByDesc('plays_count')
                ->limit(5)
                ->get(['id', 'title', 'plays_count', 'likes_count'])
                ->map(function($sound) {
                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'plays_count' => $sound->plays_count,
                        'likes_count' => $sound->likes_count
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $soundsData,
                'pagination' => [
                    'current_page' => $sounds->currentPage(),
                    'last_page' => $sounds->lastPage(),
                    'per_page' => $sounds->perPage(),
                    'total' => $sounds->total(),
                    'from' => $sounds->firstItem(),
                    'to' => $sounds->lastItem()
                ],
                'global_stats' => [
                    'total_sounds' => $totalSounds,
                    'published_sounds' => $publishedSounds,
                    'total_plays' => $totalPlays,
                    'total_likes' => $totalLikes,
                    'total_downloads' => $totalDownloads,
                    'total_revenue' => $totalRevenue,
                    'formatted_total_revenue' => number_format($totalRevenue, 0, ',', ' ') . ' XAF',
                    'average_plays_per_sound' => $totalSounds > 0 ? round($totalPlays / $totalSounds, 1) : 0,
                    'average_likes_per_sound' => $totalSounds > 0 ? round($totalLikes / $totalSounds, 1) : 0
                ],
                'status_stats' => $statusStats,
                'top_sounds' => $topSounds,
                'filters' => [
                    'status' => $status,
                    'category' => $category,
                    'sort_by' => $sortBy,
                    'sort_order' => $sortOrder
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur getUserSounds: ' . $e->getMessage(), [
                'user_id' => auth('sanctum')->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de vos créations',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur interne s\'est produite'
            ], 500);
        }
    }

    /**
     * Obtenir le libellé du statut
     */
    private function getStatusLabel($status)
    {
        $labels = [
            'draft' => 'Brouillon',
            'pending' => 'En attente de validation',
            'published' => 'Publié',
            'rejected' => 'Rejeté'
        ];

        return $labels[$status] ?? $status;
    }

    /**
     * Obtenir les sons favoris de l'utilisateur
     */
    public function getFavoriteSounds(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            $favoriteSounds = $user->likedSounds()
                ->with([
                    'user:id,name',
                    'category:id,name'
                ])
                ->where('status', 'published')
                ->latest('sound_likes.created_at')
                ->get()
                ->map(function ($sound) {
                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'artist' => $sound->user->name,
                        'category' => $sound->category->name ?? 'Non catégorisé',
                        'duration' => $sound->formatted_duration,
                        'cover_image_url' => $sound->cover_image_url,
                        'audio_file_url' => $sound->is_free ? $sound->file_url : null,
                        'price' => $sound->price,
                        'is_free' => $sound->is_free,
                        'can_play' => $sound->is_free,
                        'likes_count' => $sound->likes_count,
                        'plays_count' => $sound->plays_count ?? 0,
                        'downloads_count' => $sound->downloads_count ?? 0,
                        'liked_at' => $sound->pivot->created_at,
                        'genre' => $sound->genre,
                        'bpm' => $sound->bpm,
                        'status' => $sound->status
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $favoriteSounds,
                'total' => $favoriteSounds->count(),
                'free_count' => $favoriteSounds->where('is_free', true)->count(),
                'paid_count' => $favoriteSounds->where('is_free', false)->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des sons favoris',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les événements favoris de l'utilisateur
     */
    public function getFavoriteEvents(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            $favoriteEvents = $user->likedEvents()
                ->with([
                    'user:id,name'
                ])
                ->where('status', 'published')
                ->where('event_date', '>=', now()->subDays(30)) // Inclure les événements des 30 derniers jours
                ->latest('event_likes.created_at')
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'artist' => $event->user->name,
                        'event_date' => $event->event_date,
                        'start_time' => $event->start_time ? $event->start_time->format('H:i') : null,
                        'venue' => $event->venue,
                        'address' => $event->address,
                        'city' => $event->city,
                        'country' => $event->country ?? 'Cameroun',
                        'poster_url' => $event->poster_image_url,
                        'ticket_price' => $event->ticket_price ?? $event->price_min ?? 0,
                        'status' => $event->isPast() ? 'past' : 'upcoming',
                        'is_past' => $event->isPast(),
                        'is_upcoming' => $event->isUpcoming(),
                        'likes_count' => $event->likes_count,
                        'current_attendees' => $event->current_attendees ?? 0,
                        'max_attendees' => $event->max_attendees,
                        'liked_at' => $event->pivot->created_at,
                        'category' => $event->category,
                        'is_free' => $event->is_free,
                        'is_featured' => $event->is_featured
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $favoriteEvents,
                'total' => $favoriteEvents->count(),
                'upcoming_count' => $favoriteEvents->where('is_upcoming', true)->count(),
                'past_count' => $favoriteEvents->where('is_past', true)->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des événements favoris',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les artistes suivis par l'utilisateur
     */
    public function getFollowedArtists(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            $followedArtists = $user->following()
                ->withCount(['sounds', 'followers'])
                ->get()
                ->map(function ($artist) {
                    return [
                        'id' => $artist->id,
                        'name' => $artist->name,
                        'profile_photo_url' => $artist->profile_photo_url,
                        'followers_count' => $artist->followers_count,
                        'sounds_count' => $artist->sounds_count,
                        'role' => $artist->role,
                        'bio' => $artist->bio,
                        'location' => $artist->location,
                        'followed_at' => $artist->pivot->created_at
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $followedArtists,
                'total' => $followedArtists->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des artistes suivis',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques détaillées de l'utilisateur
     */
    public function getUserStats(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            // Statistiques des achats de sons
            $soundPurchases = $user->payments()
                ->where('type', 'sound')
                ->where('status', 'completed')
                ->selectRaw('COUNT(*) as count, SUM(amount) as total_spent')
                ->first();

            // Statistiques des achats d'événements
            $eventPurchases = $user->payments()
                ->where('type', 'event')
                ->where('status', 'completed')
                ->selectRaw('COUNT(*) as count, SUM(amount) as total_spent')
                ->first();

            // Statistiques des favoris
            $favoriteSounds = $user->likedSounds()->count();
            $favoriteEvents = $user->likedEvents()->count();

            // Statistiques des suivis
            $followingCount = $user->following()->count();
            $followersCount = $user->followers()->count();

            // Statistiques des créations (si artiste)
            $createdSounds = $user->sounds()->count();
            $createdEvents = $user->events()->count();

            // Revenus générés (si artiste)
            $soundRevenue = $user->sales()
                ->where('type', 'sound')
                ->where('status', 'completed')
                ->sum('seller_amount');

            $eventRevenue = $user->sales()
                ->where('type', 'event')
                ->where('status', 'completed')
                ->sum('seller_amount');

            return response()->json([
                'success' => true,
                'stats' => [
                    'purchases' => [
                        'sounds' => [
                            'count' => $soundPurchases->count ?? 0,
                            'total_spent' => $soundPurchases->total_spent ?? 0
                        ],
                        'events' => [
                            'count' => $eventPurchases->count ?? 0,
                            'total_spent' => $eventPurchases->total_spent ?? 0
                        ],
                        'total_purchases' => ($soundPurchases->count ?? 0) + ($eventPurchases->count ?? 0),
                        'total_spent' => ($soundPurchases->total_spent ?? 0) + ($eventPurchases->total_spent ?? 0)
                    ],
                    'favorites' => [
                        'sounds' => $favoriteSounds,
                        'events' => $favoriteEvents,
                        'total' => $favoriteSounds + $favoriteEvents
                    ],
                    'social' => [
                        'following' => $followingCount,
                        'followers' => $followersCount
                    ],
                    'creations' => [
                        'sounds' => $createdSounds,
                        'events' => $createdEvents,
                        'total' => $createdSounds + $createdEvents
                    ],
                    'revenue' => [
                        'sounds' => $soundRevenue,
                        'events' => $eventRevenue,
                        'total' => $soundRevenue + $eventRevenue
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les événements de l'utilisateur connecté avec statistiques détaillées
     */
    public function getUserEvents(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            // Paramètres de pagination et filtres
            $perPage = $request->get('per_page', 10);
            $status = $request->get('status'); // pending, active, cancelled, completed
            $category = $request->get('category');
            $sortBy = $request->get('sort_by', 'created_at'); // created_at, title, event_date, current_attendees
            $sortOrder = $request->get('sort_order', 'desc');

            // Construction de la requête
            $query = Event::where('user_id', $user->id)
                ->with([
                    'payments' => function($query) {
                        $query->where('status', 'completed');
                    }
                ])
                ->withCount([
                    'payments as tickets_sold' => function($query) {
                        $query->where('status', 'completed');
                    }
                ]);

            // Filtres
            if ($status) {
                $query->where('status', $status);
            }

            if ($category) {
                $query->where('category', $category);
            }

            // Tri
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $events = $query->paginate($perPage);

            // Calcul des statistiques globales de l'utilisateur pour les événements
            $totalEvents = Event::where('user_id', $user->id)->count();
            $activeEvents = Event::where('user_id', $user->id)->where('status', 'active')->count();
            $completedEvents = Event::where('user_id', $user->id)->where('status', 'completed')->count();

            // Calcul du revenu total des événements
            $totalRevenue = \DB::table('payments')
                ->join('events', 'payments.event_id', '=', 'events.id')
                ->where('events.user_id', $user->id)
                ->where('payments.status', 'completed')
                ->sum('payments.seller_amount');

            $totalTicketsSold = \DB::table('payments')
                ->join('events', 'payments.event_id', '=', 'events.id')
                ->where('events.user_id', $user->id)
                ->where('payments.status', 'completed')
                ->count();

            // Transformation des données
            $eventsData = $events->getCollection()->map(function ($event) {
                // Calcul du revenu pour cet événement
                $revenue = $event->payments->sum('seller_amount');
                $ticketsSold = $event->tickets_sold;

                // Calcul du taux de remplissage
                $fillRate = $event->max_attendees > 0 ? ($event->current_attendees / $event->max_attendees) * 100 : 0;

                // Statut de performance basé sur les ventes
                $performance = 'faible';
                if ($ticketsSold > 50) {
                    $performance = 'excellente';
                } elseif ($ticketsSold > 20) {
                    $performance = 'bonne';
                } elseif ($ticketsSold > 5) {
                    $performance = 'moyenne';
                }

                // Statut temporel de l'événement
                $eventStatus = 'upcoming';
                if ($event->event_date < now()) {
                    $eventStatus = 'past';
                } elseif ($event->event_date->isToday()) {
                    $eventStatus = 'today';
                }

                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                    'description' => $event->description,
                    'category' => $event->category,
                    'status' => $event->status,
                    'status_label' => $this->getEventStatusLabel($event->status),

                    // Informations de l'événement
                    'venue' => $event->venue,
                    'address' => $event->address,
                    'city' => $event->city,
                    'country' => $event->country ?? 'Cameroun',

                    // Dates et heures
                    'event_date' => $event->event_date,
                    'event_date_formatted' => $event->event_date->format('d/m/Y'),
                    'start_time' => $event->start_time ? $event->start_time->format('H:i') : null,
                    'end_time' => $event->end_time ? $event->end_time->format('H:i') : null,
                    'days_until' => $event->event_date > now() ? now()->diffInDays($event->event_date) : null,
                    'event_status' => $eventStatus,

                    // Images
                    'poster_image_url' => $event->poster_image ? asset('storage/' . $event->poster_image) : null,
                    'gallery_images' => $event->gallery_images ? json_decode($event->gallery_images) : [],

                    // Informations de prix et billets
                    'is_free' => $event->is_free,
                    'ticket_price' => $event->ticket_price ?? $event->price_min ?? 0,
                    'price_range' => $event->price_min && $event->price_max ?
                        number_format($event->price_min, 0, ',', ' ') . ' - ' . number_format($event->price_max, 0, ',', ' ') . ' XAF' :
                        ($event->ticket_price ? number_format($event->ticket_price, 0, ',', ' ') . ' XAF' : 'Gratuit'),

                    // Capacité et assistance
                    'max_attendees' => $event->max_attendees,
                    'current_attendees' => $event->current_attendees ?? 0,
                    'available_spots' => $event->max_attendees ? ($event->max_attendees - ($event->current_attendees ?? 0)) : null,
                    'fill_rate' => round($fillRate, 2),

                    // Statistiques détaillées
                    'stats' => [
                        'tickets_sold' => $ticketsSold,
                        'revenue' => $revenue,
                        'formatted_revenue' => number_format($revenue, 0, ',', ' ') . ' XAF',
                        'performance' => $performance,
                        'fill_rate' => round($fillRate, 2),
                        'likes_count' => $event->likes_count ?? 0
                    ],

                    // Artistes et sponsors
                    'artist' => $event->artist,
                    'artists' => $event->artists ? json_decode($event->artists) : [],
                    'sponsors' => $event->sponsors ? json_decode($event->sponsors) : [],

                    // Contact
                    'contact_email' => $event->contact_email,
                    'contact_phone' => $event->contact_phone,
                    'website_url' => $event->website_url,

                    // Dates
                    'created_at' => $event->created_at,
                    'updated_at' => $event->updated_at,
                    'created_at_human' => $event->created_at->diffForHumans(),

                    // Actions possibles
                    'can_edit' => in_array($event->status, ['pending', 'active']) && $event->event_date > now(),
                    'can_delete' => in_array($event->status, ['pending']) && $event->event_date > now(),
                    'can_cancel' => $event->status === 'active' && $event->event_date > now(),
                    'can_duplicate' => true,
                ];
            });

            // Statistiques par statut
            $statusStats = [
                'pending' => Event::where('user_id', $user->id)->where('status', 'pending')->count(),
                'active' => Event::where('user_id', $user->id)->where('status', 'active')->count(),
                'completed' => Event::where('user_id', $user->id)->where('status', 'completed')->count(),
                'cancelled' => Event::where('user_id', $user->id)->where('status', 'cancelled')->count(),
            ];

            // Top 5 des événements les plus performants
            $topEvents = Event::where('user_id', $user->id)
                ->where('status', 'active')
                ->orderByDesc('current_attendees')
                ->limit(5)
                ->get(['id', 'title', 'current_attendees'])
                ->map(function($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'current_attendees' => $event->current_attendees
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $eventsData,
                'pagination' => [
                    'current_page' => $events->currentPage(),
                    'last_page' => $events->lastPage(),
                    'per_page' => $events->perPage(),
                    'total' => $events->total(),
                    'from' => $events->firstItem(),
                    'to' => $events->lastItem()
                ],
                'global_stats' => [
                    'total_events' => $totalEvents,
                    'active_events' => $activeEvents,
                    'completed_events' => $completedEvents,
                    'total_tickets_sold' => $totalTicketsSold,
                    'total_revenue' => $totalRevenue,
                    'formatted_total_revenue' => number_format($totalRevenue, 0, ',', ' ') . ' XAF',
                    'average_tickets_per_event' => $totalEvents > 0 ? round($totalTicketsSold / $totalEvents, 1) : 0
                ],
                'status_stats' => $statusStats,
                'top_events' => $topEvents,
                'filters' => [
                    'status' => $status,
                    'category' => $category,
                    'sort_by' => $sortBy,
                    'sort_order' => $sortOrder
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getUserEvents: ' . $e->getMessage(), [
                'user_id' => auth('sanctum')->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de vos événements',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur interne s\'est produite'
            ], 500);
        }
    }

    /**
     * Obtenir le libellé du statut d'événement
     */
    private function getEventStatusLabel($status)
    {
        $labels = [
            'pending' => 'En attente de validation',
            'active' => 'Actif',
            'completed' => 'Terminé',
            'cancelled' => 'Annulé'
        ];

        return $labels[$status] ?? $status;
    }

    /**
     * Obtenir les revenus détaillés de l'utilisateur avec historique des gains
     */
    public function getUserEarnings(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            // Paramètres de pagination et filtres
            $perPage = $request->get('per_page', 20);
            $type = $request->get('type'); // sound, event, all
            $period = $request->get('period', '30'); // 7, 30, 90, 365, all
            $status = $request->get('status', 'completed'); // completed, pending, all

            // Construire la requête de base pour les revenus
            $paymentsQuery = Payment::where('seller_id', $user->id);

            // Filtrer par type si spécifié
            if ($type && $type !== 'all') {
                $paymentsQuery->where('type', $type);
            }

            // Filtrer par statut si spécifié
            if ($status && $status !== 'all') {
                $paymentsQuery->where('status', $status);
            }

            // Filtrer par période
            if ($period !== 'all') {
                $paymentsQuery->where('paid_at', '>=', now()->subDays((int)$period));
            }

            // Récupérer les paiements avec pagination
            $payments = $paymentsQuery
                ->with(['sound', 'event', 'user:id,name'])
                ->orderBy('paid_at', 'desc')
                ->paginate($perPage);

            // Calculer les statistiques totales
            $totalEarnings = Payment::where('seller_id', $user->id)
                ->where('status', 'completed')
                ->sum('seller_amount');

            $soundsEarnings = Payment::where('seller_id', $user->id)
                ->where('type', 'sound')
                ->where('status', 'completed')
                ->sum('seller_amount');

            $eventsEarnings = Payment::where('seller_id', $user->id)
                ->where('type', 'event')
                ->where('status', 'completed')
                ->sum('seller_amount');

            $pendingEarnings = Payment::where('seller_id', $user->id)
                ->where('status', 'pending')
                ->sum('seller_amount');

            $totalCommissionPaid = Payment::where('seller_id', $user->id)
                ->where('status', 'completed')
                ->sum('commission_amount');

            // Revenus des 30 derniers jours
            $last30DaysEarnings = Payment::where('seller_id', $user->id)
                ->where('status', 'completed')
                ->where('paid_at', '>=', now()->subDays(30))
                ->sum('seller_amount');

            // Revenus du mois actuel
            $currentMonthEarnings = Payment::where('seller_id', $user->id)
                ->where('status', 'completed')
                ->whereMonth('paid_at', now()->month)
                ->whereYear('paid_at', now()->year)
                ->sum('seller_amount');

            // Revenus du mois précédent
            $lastMonthEarnings = Payment::where('seller_id', $user->id)
                ->where('status', 'completed')
                ->whereMonth('paid_at', now()->subMonth()->month)
                ->whereYear('paid_at', now()->subMonth()->year)
                ->sum('seller_amount');

            // Calcul de la croissance mensuelle
            $monthlyGrowth = $lastMonthEarnings > 0
                ? (($currentMonthEarnings - $lastMonthEarnings) / $lastMonthEarnings) * 100
                : 0;

            // Revenus par mois (12 derniers mois)
            $monthlyEarnings = collect();
            for ($i = 11; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $earnings = Payment::where('seller_id', $user->id)
                    ->where('status', 'completed')
                    ->whereMonth('paid_at', $date->month)
                    ->whereYear('paid_at', $date->year)
                    ->sum('seller_amount');

                $monthlyEarnings->push([
                    'month' => $date->format('M Y'),
                    'month_number' => $date->format('Y-m'),
                    'earnings' => $earnings,
                    'formatted_earnings' => number_format($earnings, 0, ',', ' ') . ' XAF'
                ]);
            }

            // Déterminer la catégorie du vendeur
            $sellerCategory = $this->getSellerCategory($totalEarnings);

            // Formater les données des paiements
            $earningsData = $payments->getCollection()->map(function ($payment) {
                $item = null;
                $itemTitle = 'Article supprimé';
                $itemType = $payment->type;

                if ($payment->sound) {
                    $item = $payment->sound;
                    $itemTitle = $payment->sound->title;
                } elseif ($payment->event) {
                    $item = $payment->event;
                    $itemTitle = $payment->event->title;
                }

                return [
                    'id' => $payment->id,
                    'transaction_id' => $payment->transaction_id,
                    'type' => $payment->type,
                    'type_label' => $payment->type === 'sound' ? 'Son' : 'Événement',
                    'item_id' => $payment->sound_id ?? $payment->event_id,
                    'item_title' => $itemTitle,
                    'buyer_name' => $payment->user->name,
                    'amount' => $payment->amount,
                    'seller_amount' => $payment->seller_amount,
                    'commission_amount' => $payment->commission_amount,
                    'commission_rate' => $payment->commission_rate,
                    'status' => $payment->status,
                    'status_label' => $this->getPaymentStatusLabel($payment->status),
                    'payment_method' => $payment->payment_method,
                    'paid_at' => $payment->paid_at,
                    'paid_at_formatted' => $payment->paid_at ? $payment->paid_at->format('d/m/Y H:i') : null,
                    'paid_at_human' => $payment->paid_at ? $payment->paid_at->diffForHumans() : null,
                    'formatted_amount' => number_format($payment->amount, 0, ',', ' ') . ' XAF',
                    'formatted_seller_amount' => number_format($payment->seller_amount, 0, ',', ' ') . ' XAF',
                    'formatted_commission_amount' => number_format($payment->commission_amount, 0, ',', ' ') . ' XAF',
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $earningsData,
                'pagination' => [
                    'current_page' => $payments->currentPage(),
                    'last_page' => $payments->lastPage(),
                    'per_page' => $payments->perPage(),
                    'total' => $payments->total(),
                    'from' => $payments->firstItem(),
                    'to' => $payments->lastItem()
                ],
                'earnings_summary' => [
                    'total_earnings' => $totalEarnings,
                    'sounds_earnings' => $soundsEarnings,
                    'events_earnings' => $eventsEarnings,
                    'pending_earnings' => $pendingEarnings,
                    'last_30_days_earnings' => $last30DaysEarnings,
                    'current_month_earnings' => $currentMonthEarnings,
                    'last_month_earnings' => $lastMonthEarnings,
                    'monthly_growth' => round($monthlyGrowth, 2),
                    'total_commission_paid' => $totalCommissionPaid,
                    'seller_category' => $sellerCategory,

                    // Versions formatées
                    'formatted_total_earnings' => number_format($totalEarnings, 0, ',', ' ') . ' XAF',
                    'formatted_sounds_earnings' => number_format($soundsEarnings, 0, ',', ' ') . ' XAF',
                    'formatted_events_earnings' => number_format($eventsEarnings, 0, ',', ' ') . ' XAF',
                    'formatted_pending_earnings' => number_format($pendingEarnings, 0, ',', ' ') . ' XAF',
                    'formatted_last_30_days_earnings' => number_format($last30DaysEarnings, 0, ',', ' ') . ' XAF',
                    'formatted_current_month_earnings' => number_format($currentMonthEarnings, 0, ',', ' ') . ' XAF',
                    'formatted_total_commission_paid' => number_format($totalCommissionPaid, 0, ',', ' ') . ' XAF',
                ],
                'monthly_earnings' => $monthlyEarnings,
                'filters' => [
                    'type' => $type,
                    'period' => $period,
                    'status' => $status
                ],
                'withdrawal_info' => [
                    'available_for_withdrawal' => $totalEarnings, // Montant disponible pour retrait
                    'minimum_withdrawal' => 10000, // Minimum 10,000 XAF
                    'withdrawal_fee' => 500, // 500 XAF de frais
                    'can_withdraw' => $totalEarnings >= 10000,
                    'next_payout_date' => now()->addMonth()->startOfMonth()->format('d/m/Y') // Premier du mois prochain
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getUserEarnings: ' . $e->getMessage(), [
                'user_id' => auth('sanctum')->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des revenus',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur interne s\'est produite'
            ], 500);
        }
    }

    /**
     * Obtenir le libellé du statut de paiement
     */
    private function getPaymentStatusLabel($status)
    {
        $labels = [
            'pending' => 'En attente',
            'completed' => 'Complété',
            'failed' => 'Échoué',
            'refunded' => 'Remboursé',
            'cancelled' => 'Annulé'
        ];

        return $labels[$status] ?? $status;
    }

    /**
     * Déterminer la catégorie du vendeur basée sur ses revenus
     */
    private function getSellerCategory(float $earnings): string
    {
        if ($earnings >= 500000) return 'platinum';  // 500k XAF+
        if ($earnings >= 250000) return 'gold';     // 250k XAF+
        if ($earnings >= 100000) return 'silver';   // 100k XAF+
        if ($earnings >= 25000) return 'bronze';    // 25k XAF+
        if ($earnings > 0) return 'rookie';         // Quelques ventes
        return 'new';                               // Nouveau
    }

    /**
     * Obtenir tous les artistes
     */
    public function getArtists(Request $request)
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
                      ->orWhere('city', 'LIKE', "%{$search}%");
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 16);
            $artists = $query->withCount(['sounds', 'followers'])
                            ->with(['sounds' => function($q) {
                                $q->where('status', 'published')
                                  ->orderBy('plays_count', 'desc')
                                  ->limit(3);
                            }])
                            ->orderByDesc('followers_count')
                            ->paginate($perPage);

            // Formatter les données
            $artists->getCollection()->transform(function ($artist) {
                return [
                    'id' => $artist->id,
                    'name' => $artist->name,
                    'email' => $artist->email,
                    'role' => $artist->role,
                    'bio' => $artist->bio,
                    'city' => $artist->city,
                    'profile_photo_url' => $artist->profile_photo_url ?? null,
                    'sounds_count' => $artist->sounds_count ?? 0,
                    'followers_count' => $artist->followers_count ?? 0,
                    'total_plays' => $artist->sounds->sum('plays_count') ?? 0,
                    'latest_sounds' => $artist->sounds->map(function($sound) {
                        return [
                            'id' => $sound->id,
                            'title' => $sound->title,
                            'plays_count' => $sound->plays_count ?? 0
                        ];
                    }),
                    'created_at' => $artist->created_at
                ];
            });

            return response()->json([
                'success' => true,
                'artists' => $artists->items(),
                'pagination' => [
                    'current_page' => $artists->currentPage(),
                    'last_page' => $artists->lastPage(),
                    'per_page' => $artists->perPage(),
                    'total' => $artists->total(),
                    'has_more' => $artists->hasMorePages()
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
     * Obtenir un artiste spécifique
     */
    public function getArtist($id)
    {
        try {
            $artist = User::where('id', $id)
                         ->where(function($q) {
                             $q->where('role', 'artist')->orWhere('role', 'producer');
                         })
                         ->withCount(['sounds', 'followers', 'following'])
                         ->first();

            if (!$artist) {
                return response()->json([
                    'success' => false,
                    'message' => 'Artiste non trouvé'
                ], 404);
            }

            // Vérifier si l'utilisateur connecté suit cet artiste
            $isFollowing = false;
            if (auth('sanctum')->check()) {
                $currentUser = auth('sanctum')->user();
                $isFollowing = $currentUser->following()->where('followed_id', $artist->id)->exists();
            }

            // Statistiques
            $stats = [
                'total_plays' => $artist->sounds()->sum('plays_count') ?? 0,
                'total_downloads' => $artist->sounds()->sum('downloads_count') ?? 0,
                'total_likes' => $artist->sounds()->sum('likes_count') ?? 0,
            ];

            // Sons populaires
            $popularSounds = $artist->sounds()
                                   ->where('status', 'published')
                                   ->orderBy('plays_count', 'desc')
                                   ->limit(5)
                                   ->get();

            // Sons récents
            $recentSounds = $artist->sounds()
                                  ->where('status', 'published')
                                  ->orderBy('created_at', 'desc')
                                  ->limit(5)
                                  ->get();

            return response()->json([
                'success' => true,
                'artist' => [
                    'id' => $artist->id,
                    'name' => $artist->name,
                    'email' => $artist->email,
                    'role' => $artist->role,
                    'bio' => $artist->bio,
                    'city' => $artist->city,
                    'profile_photo_url' => $artist->profile_photo_url,
                    'sounds_count' => $artist->sounds_count,
                    'followers_count' => $artist->followers_count,
                    'following_count' => $artist->following_count,
                    'created_at' => $artist->created_at
                ],
                'is_following' => $isFollowing,
                'stats' => $stats,
                'popular_sounds' => $popularSounds,
                'recent_sounds' => $recentSounds,
                'upcoming_events' => [], // À implémenter si nécessaire
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de l\'artiste',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Suivre/Ne plus suivre un artiste
     */
    public function toggleFollow(Request $request, $id)
    {
        try {
            $user = auth('sanctum')->user();
            $artist = User::find($id);

            if (!$artist) {
                return response()->json([
                    'success' => false,
                    'message' => 'Artiste non trouvé'
                ], 404);
            }

            if ($user->id === $artist->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez pas vous suivre vous-même'
                ], 400);
            }

            $isFollowing = $user->following()->where('followed_id', $artist->id)->exists();

            if ($isFollowing) {
                // Ne plus suivre
                $user->following()->detach($artist->id);
                $message = 'Vous ne suivez plus cet artiste';
                $isFollowing = false;
            } else {
                // Suivre
                $user->following()->attach($artist->id);
                $message = 'Vous suivez maintenant cet artiste';
                $isFollowing = true;
            }

            // Compter les followers
            $followersCount = $artist->followers()->count();

            return response()->json([
                'success' => true,
                'message' => $message,
                'is_following' => $isFollowing,
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
}
