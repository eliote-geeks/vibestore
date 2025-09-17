<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Sound;
use App\Models\Clip;
use App\Models\User;
use App\Models\Event;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Obtenir les analytics globales
     */
    public function getGlobalAnalytics()
    {
        try {
            // Périodes d'analyse
            $today = Carbon::today();
            $yesterday = Carbon::yesterday();
            $lastWeek = Carbon::now()->subWeek();
            $lastMonth = Carbon::now()->subMonth();
            $lastYear = Carbon::now()->subYear();

            // Métriques globales
            $totalUsers = User::count();
            $totalSounds = Sound::count();
            $totalClips = Clip::count();
            $totalEvents = Event::count();

            // Croissance utilisateurs
            $newUsersToday = User::whereDate('created_at', $today)->count();
            $newUsersYesterday = User::whereDate('created_at', $yesterday)->count();
            $newUsersThisWeek = User::where('created_at', '>=', $lastWeek)->count();
            $newUsersThisMonth = User::where('created_at', '>=', $lastMonth)->count();

            // Activité des contenus
            $soundsThisWeek = Sound::where('created_at', '>=', $lastWeek)->count();
            $clipsThisWeek = Clip::where('created_at', '>=', $lastWeek)->count();
            $eventsThisWeek = Event::where('created_at', '>=', $lastWeek)->count();

            // Engagement
            $totalViews = Sound::sum('plays_count') + Clip::sum('views');
            $totalLikes = Sound::sum('likes_count') + Clip::sum('likes');
            $totalDownloads = Sound::sum('downloads_count');

            // Top performers cette semaine
            $topSoundsThisWeek = Sound::with('user:id,name')
                ->where('created_at', '>=', $lastWeek)
                ->orderBy('plays_count', 'desc')
                ->limit(5)
                ->get()
                ->map(function($sound) {
                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'artist' => $sound->user->name ?? 'Artiste inconnu',
                        'plays' => $sound->plays_count ?? 0,
                        'likes' => $sound->likes_count ?? 0,
                        'created_at' => $sound->created_at,
                    ];
                });

            $topClipsThisWeek = Clip::with('user:id,name')
                ->where('created_at', '>=', $lastWeek)
                ->orderBy('views', 'desc')
                ->limit(5)
                ->get()
                ->map(function($clip) {
                    return [
                        'id' => $clip->id,
                        'title' => $clip->title,
                        'artist' => $clip->user->name ?? 'Artiste inconnu',
                        'views' => $clip->views ?? 0,
                        'likes' => $clip->likes ?? 0,
                        'created_at' => $clip->created_at,
                    ];
                });

            // Données pour graphiques (7 derniers jours)
            $dailyStats = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $dailyStats[] = [
                    'date' => $date->format('Y-m-d'),
                    'label' => $date->format('d/m'),
                    'new_users' => User::whereDate('created_at', $date)->count(),
                    'new_sounds' => Sound::whereDate('created_at', $date)->count(),
                    'new_clips' => Clip::whereDate('created_at', $date)->count(),
                    'new_events' => Event::whereDate('created_at', $date)->count(),
                ];
            }

            // Répartition par types d'utilisateurs
            $userTypes = [
                'admin' => User::where('role', 'admin')->count(),
                'artist' => User::where('role', 'artist')->count(),
                'user' => User::where('role', 'user')->count(),
                'premium' => User::where('is_premium', true)->count(),
            ];

            return response()->json([
                'success' => true,
                'global_metrics' => [
                    'total_users' => $totalUsers,
                    'total_sounds' => $totalSounds,
                    'total_clips' => $totalClips,
                    'total_events' => $totalEvents,
                    'total_views' => $totalViews,
                    'total_likes' => $totalLikes,
                    'total_downloads' => $totalDownloads,
                ],
                'growth_metrics' => [
                    'new_users_today' => $newUsersToday,
                    'new_users_yesterday' => $newUsersYesterday,
                    'new_users_this_week' => $newUsersThisWeek,
                    'new_users_this_month' => $newUsersThisMonth,
                    'content_this_week' => [
                        'sounds' => $soundsThisWeek,
                        'clips' => $clipsThisWeek,
                        'events' => $eventsThisWeek,
                    ],
                ],
                'top_performers' => [
                    'sounds' => $topSoundsThisWeek,
                    'clips' => $topClipsThisWeek,
                ],
                'daily_stats' => $dailyStats,
                'user_distribution' => $userTypes,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getGlobalAnalytics: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur chargement analytics'], 500);
        }
    }

    /**
     * Analytics des utilisateurs
     */
    public function getUserAnalytics()
    {
        try {
            $lastMonth = Carbon::now()->subMonth();

            // Top artistes par activité
            $topArtists = User::where('role', 'artist')
                ->withCount(['sounds', 'clips'])
                ->having('sounds_count', '>', 0)
                ->orderBy('sounds_count', 'desc')
                ->limit(10)
                ->get()
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'sounds_count' => $user->sounds_count,
                        'clips_count' => $user->clips_count,
                        'created_at' => $user->created_at,
                        'total_content' => $user->sounds_count + $user->clips_count,
                    ];
                });

            // Utilisateurs les plus actifs (dernières connexions)
            $activeUsers = User::where('last_login_at', '>=', $lastMonth)
                ->orderBy('last_login_at', 'desc')
                ->limit(20)
                ->get(['id', 'name', 'email', 'role', 'last_login_at', 'created_at'])
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'last_login' => $user->last_login_at ? $user->last_login_at->format('d/m/Y H:i') : 'Jamais',
                        'member_since' => $user->created_at->format('d/m/Y'),
                    ];
                });

            // Nouveaux utilisateurs cette semaine
            $newUsers = User::where('created_at', '>=', Carbon::now()->subWeek())
                ->orderBy('created_at', 'desc')
                ->get(['id', 'name', 'email', 'role', 'created_at'])
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'created_at' => $user->created_at->format('d/m/Y H:i'),
                        'days_ago' => $user->created_at->diffInDays(now()),
                    ];
                });

            return response()->json([
                'success' => true,
                'top_artists' => $topArtists,
                'active_users' => $activeUsers,
                'new_users' => $newUsers,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getUserAnalytics: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur analytics utilisateurs'], 500);
        }
    }

    /**
     * Analytics des contenus
     */
    public function getContentAnalytics()
    {
        try {
            $lastWeek = Carbon::now()->subWeek();
            $lastMonth = Carbon::now()->subMonth();

            // Sons les plus performants
            $topSounds = Sound::with('user:id,name')
                ->orderBy('plays_count', 'desc')
                ->limit(10)
                ->get()
                ->map(function($sound) {
                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'artist' => $sound->user->name ?? 'Artiste inconnu',
                        'plays_count' => $sound->plays_count ?? 0,
                        'likes_count' => $sound->likes_count ?? 0,
                        'downloads_count' => $sound->downloads_count ?? 0,
                        'price' => $sound->price,
                        'is_free' => $sound->is_free,
                        'engagement_rate' => $sound->plays_count > 0 ?
                            round(($sound->likes_count / $sound->plays_count) * 100, 2) : 0,
                    ];
                });

            // Clips les plus vus
            $topClips = Clip::with('user:id,name')
                ->orderBy('views', 'desc')
                ->limit(10)
                ->get()
                ->map(function($clip) {
                    return [
                        'id' => $clip->id,
                        'title' => $clip->title,
                        'artist' => $clip->user->name ?? 'Artiste inconnu',
                        'views' => $clip->views ?? 0,
                        'likes' => $clip->likes ?? 0,
                        'comments_count' => $clip->comments_count ?? 0,
                        'shares' => $clip->shares ?? 0,
                        'engagement_rate' => $clip->views > 0 ?
                            round(($clip->likes / $clip->views) * 100, 2) : 0,
                    ];
                });

            // Contenus récents avec performance
            $recentSounds = Sound::with('user:id,name')
                ->where('created_at', '>=', $lastWeek)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($sound) {
                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'artist' => $sound->user->name ?? 'Artiste inconnu',
                        'plays_count' => $sound->plays_count ?? 0,
                        'likes_count' => $sound->likes_count ?? 0,
                        'created_at' => $sound->created_at->format('d/m/Y H:i'),
                        'type' => 'sound'
                    ];
                });

            $recentClips = Clip::with('user:id,name')
                ->where('created_at', '>=', $lastWeek)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($clip) {
                    return [
                        'id' => $clip->id,
                        'title' => $clip->title,
                        'artist' => $clip->user->name ?? 'Artiste inconnu',
                        'views' => $clip->views ?? 0,
                        'likes' => $clip->likes ?? 0,
                        'created_at' => $clip->created_at->format('d/m/Y H:i'),
                        'type' => 'clip'
                    ];
                });

            return response()->json([
                'success' => true,
                'top_sounds' => $topSounds,
                'top_clips' => $topClips,
                'recent_content' => [
                    'sounds' => $recentSounds,
                    'clips' => $recentClips,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getContentAnalytics: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur analytics contenus'], 500);
        }
    }

    /**
     * Données pour les graphiques de tendances
     */
    public function getTrends(Request $request)
    {
        try {
            $period = $request->get('period', 30); // Défaut 30 jours
            $type = $request->get('type', 'users'); // users, sounds, clips, events

            $trends = [];

            for ($i = $period - 1; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $count = 0;

                switch ($type) {
                    case 'users':
                        $count = User::whereDate('created_at', $date)->count();
                        break;
                    case 'sounds':
                        $count = Sound::whereDate('created_at', $date)->count();
                        break;
                    case 'clips':
                        $count = Clip::whereDate('created_at', $date)->count();
                        break;
                    case 'events':
                        $count = Event::whereDate('created_at', $date)->count();
                        break;
                }

                $trends[] = [
                    'date' => $date->format('Y-m-d'),
                    'label' => $date->format('d/m'),
                    'count' => $count,
                ];
            }

            return response()->json([
                'success' => true,
                'trends' => $trends,
                'period' => $period,
                'type' => $type,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getTrends: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur chargement tendances'], 500);
        }
    }
}
