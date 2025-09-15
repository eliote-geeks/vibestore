<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\ClipLike;
use App\Models\ClipBookmark;
use App\Models\ClipComment;
use App\Models\ClipCommentLike;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use FFMpeg\FFMpeg;
use FFMpeg\Coordinate\TimeCode;

class ClipController extends Controller
{
    /**
     * Afficher la liste des clips
     */
    public function index(Request $request)
    {
        $query = Clip::with('user')->active();

        // Filtrage par onglet
        switch ($request->get('tab')) {
            case 'featured':
                $query->featured();
                break;
            case 'trending':
                $query->trending();
                break;
            case 'recent':
                $query->recent();
                break;
            default:
                $query->recent();
                break;
        }

        // Recherche
        if ($request->filled('search')) {
            $query->search($request->get('search'));
        }

        // Filtrage par catégorie
        if ($request->filled('category') && $request->get('category') !== 'all') {
            $query->byCategory($request->get('category'));
        }

        // Tri
        switch ($request->get('sort_by')) {
            case 'views':
                $query->popular();
                break;
            case 'likes':
                $query->orderByDesc('likes');
                break;
            case 'title':
                $query->orderBy('title');
                break;
            default:
                $query->recent();
                break;
        }

        $clips = $query->paginate(12);

        // Ajouter les informations de récompense et like status
        $clips->getCollection()->transform(function ($clip) {
            $clip->reward_type = $clip->reward_type;
            $clip->formatted_views = $clip->formatted_views;

            // Vérifier si l'utilisateur connecté a liké ce clip
            if (Auth::check()) {
                $clip->is_liked = $clip->isLikedBy(Auth::id());
            } else {
                $clip->is_liked = false;
            }

            return $clip;
        });

        return response()->json([
            'clips' => $clips,
            'message' => 'Clips récupérés avec succès'
        ]);
    }

    /**
     * Afficher un clip spécifique
     */
    public function show($id)
    {
        $clip = Clip::with(['user'])->findOrFail($id);

        // Incrémenter les vues
        $clip->incrementViews();

        // Obtenir les clips similaires
        $similarClips = $clip->getSimilarClips();

        // Vérifier les statuts pour l'utilisateur connecté
        $isLiked = false;
        $isBookmarked = false;
        $isFollowing = false;

        if (Auth::check()) {
            $isLiked = $clip->isLikedBy(Auth::id());
            $isBookmarked = $clip->isBookmarkedBy(Auth::id());
            $isFollowing = Auth::user()->isFollowing($clip->user_id);
        }

        return response()->json([
            'clip' => $clip,
            'similar_clips' => $similarClips,
            'is_liked' => $isLiked,
            'is_bookmarked' => $isBookmarked,
            'is_following' => $isFollowing,
            'comments_count' => $clip->comments()->where('is_active', true)->count(),
            'message' => 'Clip récupéré avec succès'
        ]);
    }

    /**
     * Créer un nouveau clip
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string|max:100',
            'tags' => 'nullable|string',
            'video_file' => 'required|file|mimes:mp4,avi,mov,wmv|max:512000', // 500MB max
            'thumbnail_file' => 'required|file|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            'credits' => 'nullable|array',
            'credits.director' => 'nullable|string|max:255',
            'credits.producer' => 'nullable|string|max:255',
            'credits.cinematographer' => 'nullable|string|max:255',
            'credits.editor' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Upload de la vidéo
            $videoFile = $request->file('video_file');
            $videoPath = $videoFile->store('clips/videos', 'public');

            // Upload de la miniature
            $thumbnailFile = $request->file('thumbnail_file');
            $thumbnailPath = $thumbnailFile->store('clips/thumbnails', 'public');

            // Obtenir la durée de la vidéo (nécessite FFMpeg)
            $duration = $this->getVideoDuration(storage_path('app/public/' . $videoPath));

            // Préparer les tags
            $tags = $request->filled('tags')
                ? array_map('trim', explode(',', $request->get('tags')))
                : [];

            // Préparer les crédits
            $credits = $request->get('credits', []);
            $credits = array_filter($credits, function($value) {
                return !empty($value);
            });

            // Créer le clip
            $clip = Clip::create([
                'title' => $request->get('title'),
                'description' => $request->get('description'),
                'category' => $request->get('category'),
                'tags' => $tags,
                'video_path' => $videoPath,
                'thumbnail_path' => $thumbnailPath,
                'duration' => $duration,
                'credits' => $credits,
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'clip' => $clip->load('user'),
                'message' => 'Clip créé avec succès !'
            ], 201);

        } catch (\Exception $e) {
            // Nettoyer les fichiers uploadés en cas d'erreur
            if (isset($videoPath)) {
                Storage::disk('public')->delete($videoPath);
            }
            if (isset($thumbnailPath)) {
                Storage::disk('public')->delete($thumbnailPath);
            }

            return response()->json([
                'message' => 'Erreur lors de la création du clip',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour un clip
     */
    public function update(Request $request, $id)
    {
        $clip = Clip::findOrFail($id);

        // Vérifier que l'utilisateur est propriétaire du clip ou admin
        if ($clip->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'category' => 'sometimes|required|string|max:100',
            'tags' => 'nullable|string',
            'video_file' => 'sometimes|file|mimes:mp4,avi,mov,wmv|max:512000',
            'thumbnail_file' => 'sometimes|file|mimes:jpeg,png,jpg,gif|max:5120',
            'credits' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = [];

            // Mise à jour des champs texte
            if ($request->filled('title')) {
                $updateData['title'] = $request->get('title');
            }
            if ($request->filled('description')) {
                $updateData['description'] = $request->get('description');
            }
            if ($request->filled('category')) {
                $updateData['category'] = $request->get('category');
            }
            if ($request->filled('tags')) {
                $updateData['tags'] = array_map('trim', explode(',', $request->get('tags')));
            }
            if ($request->filled('credits')) {
                $updateData['credits'] = array_filter($request->get('credits'));
            }

            // Upload nouvelle vidéo si fournie
            if ($request->hasFile('video_file')) {
                // Supprimer l'ancienne vidéo
                if ($clip->video_path) {
                    Storage::disk('public')->delete($clip->video_path);
                }

                $videoFile = $request->file('video_file');
                $updateData['video_path'] = $videoFile->store('clips/videos', 'public');
                $updateData['duration'] = $this->getVideoDuration(storage_path('app/public/' . $updateData['video_path']));
            }

            // Upload nouvelle miniature si fournie
            if ($request->hasFile('thumbnail_file')) {
                // Supprimer l'ancienne miniature
                if ($clip->thumbnail_path) {
                    Storage::disk('public')->delete($clip->thumbnail_path);
                }

                $thumbnailFile = $request->file('thumbnail_file');
                $updateData['thumbnail_path'] = $thumbnailFile->store('clips/thumbnails', 'public');
            }

            $clip->update($updateData);

            return response()->json([
                'clip' => $clip->fresh()->load('user'),
                'message' => 'Clip mis à jour avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un clip
     */
    public function destroy($id)
    {
        $clip = Clip::findOrFail($id);

        // Vérifier que l'utilisateur est propriétaire du clip ou admin
        if ($clip->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        try {
            // Supprimer les fichiers
            if ($clip->video_path) {
                Storage::disk('public')->delete($clip->video_path);
            }
            if ($clip->thumbnail_path) {
                Storage::disk('public')->delete($clip->thumbnail_path);
            }

            $clip->delete();

            return response()->json([
                'message' => 'Clip supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liker/Unliker un clip
     */
    public function toggleLike($id)
    {
        $clip = Clip::findOrFail($id);
        $userId = Auth::id();

        $existingLike = ClipLike::where('clip_id', $id)
                                ->where('user_id', $userId)
                                ->first();

        if ($existingLike) {
            // Supprimer le like
            $existingLike->delete();
            $clip->decrementLikes();
            $isLiked = false;
            $message = 'Like retiré';
        } else {
            // Ajouter le like
            ClipLike::create([
                'clip_id' => $id,
                'user_id' => $userId,
            ]);
            $clip->incrementLikes();
            $isLiked = true;
            $message = 'Clip liké !';
        }

        return response()->json([
            'is_liked' => $isLiked,
            'likes_count' => $clip->fresh()->likes,
            'message' => $message
        ]);
    }

    /**
     * Bookmark/Unbookmark un clip
     */
    public function toggleBookmark($id)
    {
        $clip = Clip::findOrFail($id);
        $userId = Auth::id();

        $existingBookmark = ClipBookmark::where('clip_id', $id)
                                       ->where('user_id', $userId)
                                       ->first();

        if ($existingBookmark) {
            // Supprimer le bookmark
            $existingBookmark->delete();
            $isBookmarked = false;
            $message = 'Clip retiré des favoris';
        } else {
            // Ajouter le bookmark
            ClipBookmark::create([
                'clip_id' => $id,
                'user_id' => $userId,
            ]);
            $isBookmarked = true;
            $message = 'Clip ajouté aux favoris';
        }

        return response()->json([
            'is_bookmarked' => $isBookmarked,
            'message' => $message
        ]);
    }

    /**
     * Partager un clip
     */
    public function share($id)
    {
        $clip = Clip::findOrFail($id);
        $clip->incrementShares();

        return response()->json([
            'shares_count' => $clip->fresh()->shares,
            'message' => 'Clip partagé !'
        ]);
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
                ['id' => null, 'name' => 'Afrobeat', 'color' => '#FF6B35', 'icon' => 'faHeart'],
                ['id' => null, 'name' => 'Rap', 'color' => '#4ECDC4', 'icon' => 'faMicrophone'],
                ['id' => null, 'name' => 'Makossa', 'color' => '#45B7D1', 'icon' => 'faMusic'],
                ['id' => null, 'name' => 'Gospel', 'color' => '#DDA0DD', 'icon' => 'faHandsPraying'],
                ['id' => null, 'name' => 'Zouk', 'color' => '#FDCB6E', 'icon' => 'faSmile'],
                ['id' => null, 'name' => 'Jazz', 'color' => '#A29BFE', 'icon' => 'faMusic'],
                ['id' => null, 'name' => 'Pop', 'color' => '#74B9FF', 'icon' => 'faStar'],
                ['id' => null, 'name' => 'R&B', 'color' => '#FFEAA7', 'icon' => 'faHeartbeat'],
                ['id' => null, 'name' => 'Reggae', 'color' => '#00B894', 'icon' => 'faLeaf'],
                ['id' => null, 'name' => 'Hip-Hop', 'color' => '#636E72', 'icon' => 'faMicrophone']
            ];

            return response()->json([
                'categories' => $fallbackCategories,
                'message' => 'Catégories de fallback utilisées'
            ]);
        }
    }

    /**
     * Obtenir la durée d'une vidéo
     */
    private function getVideoDuration($videoPath)
    {
        try {
            // Méthode simple avec getID3 si disponible
            if (extension_loaded('getid3')) {
                $getID3 = new \getID3;
                $file = $getID3->analyze($videoPath);
                if (isset($file['playtime_seconds'])) {
                    $seconds = (int) $file['playtime_seconds'];
                    return sprintf('%d:%02d', $seconds / 60, $seconds % 60);
                }
            }

            // Fallback: utiliser FFMpeg si disponible
            if (class_exists('FFMpeg\FFMpeg')) {
                $ffmpeg = FFMpeg::create();
                $video = $ffmpeg->open($videoPath);
                $duration = $video->getFFProbe()->format($videoPath)->get('duration');
                $seconds = (int) $duration;
                return sprintf('%d:%02d', $seconds / 60, $seconds % 60);
            }

            // Dernier recours: estimation basée sur la taille du fichier
            return '0:00';

        } catch (\Exception $e) {
            return '0:00';
        }
    }

    /**
     * Obtenir les commentaires d'un clip
     */
    public function getComments($id)
    {
        try {
            $clip = Clip::findOrFail($id);

            $comments = ClipComment::with(['user', 'replies.user', 'likes'])
                ->where('clip_id', $id)
                ->where('is_active', true)
                ->whereNull('parent_id') // Seulement les commentaires principaux
                ->orderByDesc('created_at')
                ->get();

            // Transformer les commentaires pour ajouter les informations nécessaires
            $commentsData = $comments->map(function ($comment) {
                $userId = Auth::id();
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'likes' => $comment->likes()->count(),
                    'is_liked' => $userId ? $comment->isLikedBy($userId) : false,
                    'replies_count' => $comment->replies->count(),
                    'replies' => $comment->replies->map(function ($reply) use ($userId) {
                        return [
                            'id' => $reply->id,
                            'content' => $reply->content,
                            'likes' => $reply->likes()->count(),
                            'is_liked' => $userId ? $reply->isLikedBy($userId) : false,
                            'user' => [
                                'id' => $reply->user->id,
                                'name' => $reply->user->name,
                                'avatar_url' => $reply->user->avatar_url ?: null
                            ],
                            'created_at' => $reply->created_at,
                        ];
                    }),
                    'user' => [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                        'avatar_url' => $comment->user->avatar_url ?: null
                    ],
                    'created_at' => $comment->created_at,
                ];
            });

            return response()->json([
                'comments' => $commentsData,
                'message' => 'Commentaires récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du chargement des commentaires',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajouter un commentaire à un clip
     */
    public function addComment(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:clip_comments,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $clip = Clip::findOrFail($id);

            $comment = ClipComment::create([
                'clip_id' => $id,
                'user_id' => Auth::id(),
                'content' => $request->get('content'),
                'parent_id' => $request->get('parent_id'),
            ]);

            // Incrémenter le compteur de commentaires du clip si c'est un commentaire principal
            if (!$request->get('parent_id')) {
                $clip->increment('comments_count');
            }

            // Charger les relations pour la réponse
            $comment->load('user');

            return response()->json([
                'comment' => [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'likes' => 0,
                    'is_liked' => false,
                    'user' => [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                        'avatar_url' => $comment->user->avatar_url ?: null
                    ],
                    'created_at' => $comment->created_at,
                ],
                'message' => 'Commentaire ajouté avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'ajout du commentaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liker/Unliker un commentaire
     */
    public function toggleCommentLike($commentId)
    {
        try {
            $comment = ClipComment::findOrFail($commentId);
            $userId = Auth::id();

            $existingLike = ClipCommentLike::where('clip_comment_id', $commentId)
                                          ->where('user_id', $userId)
                                          ->first();

            if ($existingLike) {
                // Supprimer le like
                $existingLike->delete();
                $isLiked = false;
                $message = 'Like retiré';
            } else {
                // Ajouter le like
                ClipCommentLike::create([
                    'clip_comment_id' => $commentId,
                    'user_id' => $userId,
                ]);
                $isLiked = true;
                $message = 'Commentaire liké';
            }

            $likesCount = $comment->likes()->count();

            return response()->json([
                'is_liked' => $isLiked,
                'likes_count' => $likesCount,
                'message' => $message
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du like du commentaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les clips de l'utilisateur connecté
     */
    public function getUserClips(Request $request)
    {
        try {
            $user = Auth::user();

            $query = Clip::where('user_id', $user->id)->with('user');

            // Filtrage par statut
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $clips = $query->paginate($request->get('per_page', 12));

            // Ajouter les informations supplémentaires
            $clips->getCollection()->transform(function ($clip) {
                $clip->is_liked = false; // L'utilisateur ne peut pas liker ses propres clips
                $clip->formatted_views = $clip->formatted_views;
                return $clip;
            });

            return response()->json([
                'success' => true,
                'clips' => $clips->items(),
                'pagination' => [
                    'current_page' => $clips->currentPage(),
                    'last_page' => $clips->lastPage(),
                    'per_page' => $clips->perPage(),
                    'total' => $clips->total(),
                    'has_more' => $clips->hasMorePages()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des clips',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les clips d'un artiste spécifique
     */
    public function getArtistClips(Request $request, $id)
    {
        try {
            $query = Clip::where('user_id', $id)
                         ->where('status', 'published')
                         ->with('user');

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $clips = $query->paginate($request->get('per_page', 12));

            // Ajouter les informations supplémentaires
            $clips->getCollection()->transform(function ($clip) {
                $isLiked = false;
                if (Auth::check()) {
                    $isLiked = $clip->isLikedBy(Auth::id());
                }

                $clip->is_liked = $isLiked;
                $clip->formatted_views = $clip->formatted_views;
                return $clip;
            });

            return response()->json([
                'success' => true,
                'clips' => $clips->items(),
                'pagination' => [
                    'current_page' => $clips->currentPage(),
                    'last_page' => $clips->lastPage(),
                    'per_page' => $clips->perPage(),
                    'total' => $clips->total(),
                    'has_more' => $clips->hasMorePages()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des clips de l\'artiste',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Méthodes pour la gestion admin des clips
     */

    /**
     * Obtenir tous les clips pour l'administration
     */
    public function getAllForAdmin(Request $request)
    {
        $query = Clip::with(['user', 'comments' => function($q) {
            $q->where('is_active', true);
        }]);

        // Filtres
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($request->filled('featured')) {
            $query->where('featured', $request->featured === 'true');
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Tri
        switch ($request->get('sort_by', 'created_at')) {
            case 'views':
                $query->orderBy('views', 'desc');
                break;
            case 'likes':
                $query->orderBy('likes', 'desc');
                break;
            case 'comments':
                $query->orderBy('comments_count', 'desc');
                break;
            case 'title':
                $query->orderBy('title', 'asc');
                break;
            default:
                $query->orderBy('created_at', 'desc');
        }

        $clips = $query->paginate($request->get('per_page', 20));

        // Ajouter des informations additionnelles
        $clips->getCollection()->transform(function ($clip) {
            $clip->formatted_views = number_format($clip->views);
            $clip->formatted_likes = number_format($clip->likes);
            $clip->formatted_comments = number_format($clip->comments_count);
            $clip->has_potential_issues = $this->checkPotentialIssues($clip);
            $clip->issue_flags = $this->getIssueFlags($clip);
            $clip->engagement_rate = $clip->views > 0 ? round(($clip->likes / $clip->views) * 100, 2) : 0;

            return $clip;
        });

        return response()->json([
            'success' => true,
            'clips' => $clips,
            'message' => 'Clips admin récupérés avec succès'
        ]);
    }

    /**
     * Obtenir les clips les plus populaires
     */
    public function getMostPopular(Request $request)
    {
        $limit = $request->get('limit', 10);

        $clips = Clip::with('user')
            ->where('is_active', true)
            ->orderBy('views', 'desc')
            ->orderBy('likes', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'clips' => $clips,
            'message' => 'Clips populaires récupérés'
        ]);
    }

    /**
     * Obtenir les clips les moins populaires
     */
    public function getLeastPopular(Request $request)
    {
        $limit = $request->get('limit', 10);

        $clips = Clip::with('user')
            ->where('is_active', true)
            ->orderBy('views', 'asc')
            ->orderBy('likes', 'asc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'clips' => $clips,
            'message' => 'Clips moins populaires récupérés'
        ]);
    }

    /**
     * Obtenir les clips avec problèmes potentiels
     */
    public function getProblematicClips(Request $request)
    {
        $clips = Clip::with('user')
            ->where('is_active', true)
            ->get()
            ->filter(function ($clip) {
                return $this->checkPotentialIssues($clip);
            })
            ->take($request->get('limit', 20));

        return response()->json([
            'success' => true,
            'clips' => $clips->values(),
            'message' => 'Clips problématiques récupérés'
        ]);
    }

    /**
     * Vérifier les problèmes potentiels d'un clip
     */
    private function checkPotentialIssues($clip)
    {
        $issues = [];
        $description = strtolower($clip->description);
        $title = strtolower($clip->title);

        // Mots-clés problématiques
        $problematicKeywords = [
            'violence', 'violent', 'bagarre', 'guerre', 'combat',
            'sexe', 'sexuel', 'nudité', 'adult', 'xxx',
            'drogue', 'alcool', 'stupéfiant', 'cannabis', 'cocaine',
            'haine', 'racisme', 'discrimination', 'nazi', 'terrorisme',
            'suicide', 'mort', 'tuer', 'assassin', 'meurtre',
            'arnaque', 'scam', 'fake', 'faux', 'contrefaçon'
        ];

        foreach ($problematicKeywords as $keyword) {
            if (strpos($description, $keyword) !== false || strpos($title, $keyword) !== false) {
                $issues[] = 'Contenu potentiellement inapproprié';
                break;
            }
        }

        // Ratio faible engagement
        if ($clip->views > 100 && $clip->likes < ($clip->views * 0.01)) {
            $issues[] = 'Faible engagement';
        }

        // Beaucoup de vues mais peu de likes
        if ($clip->views > 1000 && $clip->likes < 10) {
            $issues[] = 'Ratio vues/likes suspect';
        }

        // Description trop courte
        if (strlen($clip->description) < 20) {
            $issues[] = 'Description trop courte';
        }

        // Tags manquants
        if (empty($clip->tags)) {
            $issues[] = 'Tags manquants';
        }

        return count($issues) > 0;
    }

    /**
     * Obtenir les drapeaux d'alerte d'un clip
     */
    private function getIssueFlags($clip)
    {
        $flags = [];
        $description = strtolower($clip->description);
        $title = strtolower($clip->title);

        // Vérifications similaires à checkPotentialIssues mais retourne les détails
        $problematicKeywords = [
            'violence' => 'Contenu violent',
            'sexe' => 'Contenu sexuel',
            'drogue' => 'Référence aux drogues',
            'haine' => 'Discours de haine',
            'suicide' => 'Contenu suicidaire',
            'arnaque' => 'Contenu frauduleux'
        ];

        foreach ($problematicKeywords as $keyword => $flag) {
            if (strpos($description, $keyword) !== false || strpos($title, $keyword) !== false) {
                $flags[] = $flag;
            }
        }

        if ($clip->views > 100 && $clip->likes < ($clip->views * 0.01)) {
            $flags[] = 'Faible engagement';
        }

        if (strlen($clip->description) < 20) {
            $flags[] = 'Description incomplète';
        }

        if (empty($clip->tags)) {
            $flags[] = 'Tags manquants';
        }

        return $flags;
    }

    /**
     * Activer/Désactiver un clip
     */
    public function toggleStatus($id)
    {
        $clip = Clip::findOrFail($id);
        $clip->is_active = !$clip->is_active;
        $clip->save();

        return response()->json([
            'success' => true,
            'clip' => $clip,
            'message' => $clip->is_active ? 'Clip activé' : 'Clip désactivé'
        ]);
    }

    /**
     * Marquer/Démarquer comme featured
     */
    public function toggleFeatured($id)
    {
        $clip = Clip::findOrFail($id);
        $clip->featured = !$clip->featured;
        $clip->save();

        return response()->json([
            'success' => true,
            'clip' => $clip,
            'message' => $clip->featured ? 'Clip mis en avant' : 'Clip retiré de la mise en avant'
        ]);
    }

    /**
     * Obtenir les statistiques des clips
     */
    public function getStats()
    {
        $stats = [
            'total_clips' => Clip::count(),
            'active_clips' => Clip::where('is_active', true)->count(),
            'featured_clips' => Clip::where('featured', true)->count(),
            'total_views' => Clip::sum('views'),
            'total_likes' => Clip::sum('likes'),
            'total_comments' => Clip::sum('comments_count'),
            'avg_engagement_rate' => Clip::where('views', '>', 0)
                ->selectRaw('AVG(likes / views * 100) as avg_engagement')
                ->value('avg_engagement'),
            'clips_by_category' => Clip::selectRaw('category, COUNT(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category'),
            'top_creators' => Clip::selectRaw('user_id, COUNT(*) as clips_count, SUM(views) as total_views')
                ->with('user:id,name')
                ->groupBy('user_id')
                ->orderByDesc('total_views')
                ->limit(10)
                ->get()
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'message' => 'Statistiques récupérées'
        ]);
    }

    /**
     * Recherche avancée de clips
     */
    public function search(Request $request)
    {
        $query = Clip::with('user')->where('is_active', true);

        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhereJsonContains('tags', $search)
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $clips = $query->orderBy('views', 'desc')
                      ->limit($request->get('limit', 20))
                      ->get();

        return response()->json([
            'success' => true,
            'clips' => $clips,
            'message' => 'Résultats de recherche'
        ]);
    }
}
