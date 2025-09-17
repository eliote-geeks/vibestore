<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\Clip;
use App\Models\User;
use App\Models\ClipLike;
use App\Models\ClipComment;
use App\Models\ClipBookmark;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ClipManagementController extends Controller
{
    /**
     * Obtenir les statistiques des clips
     */
    public function getClipStats()
    {
        try {
            $totalClips = Clip::count();
            $activeClips = Clip::where('is_active', true)->count();
            $inactiveClips = Clip::where('is_active', false)->count();
            $featuredClips = Clip::where('featured', true)->count();

            // Statistiques d'engagement
            $totalViews = Clip::sum('views') ?? 0;
            $totalLikes = Clip::sum('likes') ?? 0;
            $totalComments = Clip::sum('comments_count') ?? 0;
            $totalShares = Clip::sum('shares') ?? 0;

            // Clips les plus performants
            $topClipsByViews = Clip::with('user')
                ->orderBy('views', 'desc')
                ->limit(5)
                ->get();

            $topClipsByLikes = Clip::with('user')
                ->orderBy('likes', 'desc')
                ->limit(5)
                ->get();

            // Activité récente (derniers 7 jours)
            $recentActivity = [
                'new_clips' => Clip::where('created_at', '>=', now()->subDays(7))->count(),
                'new_likes' => ClipLike::where('created_at', '>=', now()->subDays(7))->count(),
                'new_comments' => ClipComment::where('created_at', '>=', now()->subDays(7))->count(),
                'views_this_week' => Clip::where('updated_at', '>=', now()->subDays(7))->sum('views') ?? 0,
            ];

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_clips' => $totalClips,
                    'active_clips' => $activeClips,
                    'inactive_clips' => $inactiveClips,
                    'pending_clips' => 0, // Pas de statut pending dans ce modèle
                    'featured_clips' => $featuredClips,
                    'total_views' => $totalViews,
                    'total_likes' => $totalLikes,
                    'total_comments' => $totalComments,
                    'total_shares' => $totalShares,
                    'average_views_per_clip' => $totalClips > 0 ? round($totalViews / $totalClips, 2) : 0,
                    'average_likes_per_clip' => $totalClips > 0 ? round($totalLikes / $totalClips, 2) : 0,
                ],
                'top_clips_by_views' => $topClipsByViews,
                'top_clips_by_likes' => $topClipsByLikes,
                'recent_activity' => $recentActivity
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getClipStats: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur chargement statistiques clips'], 500);
        }
    }

    /**
     * Obtenir tous les clips avec pagination et filtres
     */
    public function getClips(Request $request)
    {
        try {
            Log::info('getClips called with params: ' . json_encode($request->all()));

            $query = Clip::with(['user:id,name,email,profile_photo_path']);

            // Appliquer les filtres seulement s'ils sont présents et valides
            if ($request->filled('status') && $request->status !== 'all') {
                if ($request->status === 'published') {
                    $query->where('is_active', true);
                } elseif ($request->status === 'inactive') {
                    $query->where('is_active', false);
                }
                Log::info('Filter applied - status: ' . $request->status);
            }

            if ($request->filled('search')) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('title', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhereHas('user', function($userQuery) use ($searchTerm) {
                          $userQuery->where('name', 'like', "%{$searchTerm}%");
                      });
                });
                Log::info('Filter applied - search: ' . $searchTerm);
            }

            if ($request->filled('is_featured') && $request->is_featured !== 'all') {
                $isFeatured = $request->boolean('is_featured');
                $query->where('featured', $isFeatured);
                Log::info('Filter applied - is_featured: ' . $isFeatured);
            }

            if ($request->filled('date_from')) {
                $query->where('created_at', '>=', $request->date_from);
                Log::info('Filter applied - date_from: ' . $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->where('created_at', '<=', $request->date_to);
                Log::info('Filter applied - date_to: ' . $request->date_to);
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Compter le total avant pagination
            $totalCount = $query->count();
            Log::info('Total clips found (before pagination): ' . $totalCount);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $clips = $query->paginate($perPage);

            Log::info('Clips retrieved after pagination: ' . $clips->count());

            // Transformer les données
            $clips->getCollection()->transform(function ($clip) {
                return [
                    'id' => $clip->id,
                    'title' => $clip->title,
                    'description' => $clip->description,
                    'video_path' => $clip->video_path,
                    'video_url' => $clip->video_url,
                    'thumbnail_path' => $clip->thumbnail_path,
                    'thumbnail_url' => $clip->thumbnail_url,
                    'duration' => $clip->duration,
                    'formatted_duration' => $clip->formatted_duration ?? (
                        $clip->duration && is_numeric($clip->duration) ?
                        gmdate("H:i:s", (int)$clip->duration) :
                        '0:00'
                    ),
                    'status' => $clip->is_active ? 'published' : 'inactive',
                    'is_featured' => $clip->featured,
                    'views_count' => $clip->views ?? 0,
                    'likes_count' => $clip->likes ?? 0,
                    'comments_count' => $clip->comments_count ?? 0,
                    'shares_count' => $clip->shares ?? 0,
                    'tags' => $clip->tags,
                    'created_at' => $clip->created_at,
                    'updated_at' => $clip->updated_at,
                    'formatted_created_at' => $clip->created_at->format('d/m/Y H:i'),
                    'user' => $clip->user ? [
                        'id' => $clip->user->id,
                        'name' => $clip->user->name,
                        'email' => $clip->user->email,
                        'avatar' => $clip->user->profile_photo_path,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'clips' => $clips,
                'total_count' => $totalCount
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getClips: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['success' => false, 'error' => 'Erreur chargement clips: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Approuver un clip (l'activer)
     */
    public function approveClip(Request $request, $clipId)
    {
        try {
            $clip = Clip::findOrFail($clipId);

            $clip->update([
                'is_active' => true
            ]);

            Log::info("Clip activé: {$clip->title} par l'admin " . Auth::user()->name);

            return response()->json([
                'success' => true,
                'message' => 'Clip activé avec succès',
                'clip' => $clip
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur approveClip: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur lors de l\'activation'], 500);
        }
    }

    /**
     * Rejeter un clip (le désactiver)
     */
    public function rejectClip(Request $request, $clipId)
    {
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        try {
            $clip = Clip::findOrFail($clipId);

            $clip->update([
                'is_active' => false
                // Note: pas de champ rejection_reason dans ce modèle
            ]);

            Log::info("Clip désactivé: {$clip->title} par l'admin " . Auth::user()->name . " - Raison: " . $request->reason);

            return response()->json([
                'success' => true,
                'message' => 'Clip désactivé avec succès',
                'clip' => $clip
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur rejectClip: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur lors de la désactivation'], 500);
        }
    }

    /**
     * Basculer le statut featured d'un clip
     */
    public function toggleFeaturedClip(Request $request, $clipId)
    {
        try {
            $clip = Clip::findOrFail($clipId);

            $clip->update([
                'featured' => !$clip->featured
            ]);

            $action = $clip->featured ? 'mis en vedette' : 'retiré de la vedette';
            Log::info("Clip {$action}: {$clip->title} par l'admin " . Auth::user()->name);

            return response()->json([
                'success' => true,
                'message' => "Clip {$action} avec succès",
                'clip' => $clip
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur toggleFeaturedClip: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur lors de la modification'], 500);
        }
    }

    /**
     * Supprimer un clip
     */
    public function deleteClip(Request $request, $clipId)
    {
        try {
            $clip = Clip::findOrFail($clipId);

            // Supprimer les fichiers associés
            if ($clip->video_path && Storage::exists($clip->video_path)) {
                Storage::delete($clip->video_path);
            }

            if ($clip->thumbnail_path && Storage::exists($clip->thumbnail_path)) {
                Storage::delete($clip->thumbnail_path);
            }

            $clipTitle = $clip->title;
            $clip->delete();

            Log::info("Clip supprimé: {$clipTitle} par l'admin " . Auth::user()->name);

            return response()->json([
                'success' => true,
                'message' => 'Clip supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur deleteClip: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur lors de la suppression'], 500);
        }
    }

    /**
     * Action en lot sur les clips
     */
    public function batchAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:approve,reject,delete,toggle_featured',
            'clip_ids' => 'required|array|min:1',
            'clip_ids.*' => 'exists:clips,id',
            'reason' => 'required_if:action,reject|string|max:500'
        ]);

        try {
            $clipIds = $request->clip_ids;
            $action = $request->action;
            $successCount = 0;

            foreach ($clipIds as $clipId) {
                try {
                    $clip = Clip::find($clipId);
                    if (!$clip) continue;

                    switch ($action) {
                        case 'approve':
                            $clip->update(['is_active' => true]);
                            break;

                        case 'reject':
                            $clip->update(['is_active' => false]);
                            break;

                        case 'delete':
                            if ($clip->video_path && Storage::exists($clip->video_path)) {
                                Storage::delete($clip->video_path);
                            }
                            if ($clip->thumbnail_path && Storage::exists($clip->thumbnail_path)) {
                                Storage::delete($clip->thumbnail_path);
                            }
                            $clip->delete();
                            break;

                        case 'toggle_featured':
                            $clip->update(['featured' => !$clip->featured]);
                            break;
                    }

                    $successCount++;
                } catch (\Exception $e) {
                    Log::error("Erreur action en lot sur clip {$clipId}: " . $e->getMessage());
                    continue;
                }
            }

            Log::info("Action en lot '{$action}' effectuée sur {$successCount} clips par l'admin " . Auth::user()->name);

            return response()->json([
                'success' => true,
                'message' => "Action effectuée sur {$successCount} clip(s)",
                'processed_count' => $successCount
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur batchAction clips: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur lors de l\'action en lot'], 500);
        }
    }

    /**
     * Obtenir les clips en attente de modération (clips inactifs récents)
     */
    public function getPendingClips()
    {
        try {
            $pendingClips = Clip::with(['user:id,name,email'])
                ->where('is_active', false) // Clips inactifs comme "en attente"
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($clip) {
                    return [
                        'id' => $clip->id,
                        'title' => $clip->title,
                        'description' => $clip->description,
                        'video_url' => $clip->video_url,
                        'thumbnail_url' => $clip->thumbnail_url,
                        'duration' => $clip->duration,
                        'formatted_duration' => $clip->formatted_duration ?? (
                            $clip->duration && is_numeric($clip->duration) ?
                            gmdate("H:i:s", (int)$clip->duration) :
                            '0:00'
                        ),
                        'created_at' => $clip->created_at,
                        'formatted_created_at' => $clip->created_at->format('d/m/Y H:i'),
                        'days_pending' => $clip->created_at->diffInDays(now()),
                        'user' => $clip->user ? [
                            'id' => $clip->user->id,
                            'name' => $clip->user->name,
                            'email' => $clip->user->email,
                        ] : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'pending_clips' => $pendingClips
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getPendingClips: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur chargement clips en attente'], 500);
        }
    }
}
