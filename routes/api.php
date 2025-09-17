<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SoundController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\SoundController as ApiSoundController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\ClipController;
use App\Http\Controllers\CompetitionController;
use App\Http\Controllers\CompetitionPaymentController;
use App\Http\Controllers\ClipManagementController;
use App\Http\Controllers\CertificationController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\PaymentManagementController;
use App\Http\Controllers\AudioLiveController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Routes d'authentification publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes publiques pour les catégories
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// Route pour les statistiques générales (accueil)
Route::get('/stats', [ApiSoundController::class, 'getGlobalStats']);

// Routes publiques pour les sons - NOUVELLE API
Route::prefix('sounds')->group(function () {
    Route::get('/', [ApiSoundController::class, 'index'])->name('api.sounds.index');
    Route::get('/featured', [ApiSoundController::class, 'featured'])->name('api.sounds.featured');
    Route::get('/popular', [ApiSoundController::class, 'popular'])->name('api.sounds.popular');
    Route::get('/recent', [ApiSoundController::class, 'recent'])->name('api.sounds.recent');
    Route::get('/recommendations', [ApiSoundController::class, 'recommendations'])->name('api.sounds.recommendations');
    Route::get('/search', [ApiSoundController::class, 'search'])->name('api.sounds.search');
    Route::get('/{id}', [ApiSoundController::class, 'show'])->name('api.sounds.show')->where('id', '[0-9]+');
    Route::get('/{id}/preview', [ApiSoundController::class, 'preview'])->name('api.sounds.preview')->where('id', '[0-9]+');

    // Routes authentifiées pour les likes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/{id}/like', [ApiSoundController::class, 'toggleLike'])->name('api.sounds.like')->where('id', '[0-9]+');
        Route::post('/likes/status', [ApiSoundController::class, 'getLikesStatus'])->name('api.sounds.likes.status');

        // Routes CRUD pour la gestion des sons
        Route::post('/', [ApiSoundController::class, 'store'])->name('api.sounds.store');
        Route::put('/{id}', [ApiSoundController::class, 'update'])->name('api.sounds.update')->where('id', '[0-9]+');
        Route::delete('/{id}', [ApiSoundController::class, 'destroy'])->name('api.sounds.destroy')->where('id', '[0-9]+');
        Route::post('/{id}/download', [ApiSoundController::class, 'download'])->name('api.sounds.download')->where('id', '[0-9]+');

        // Routes d'administration pour les sons (admin uniquement)
        Route::middleware('admin')->group(function () {
            Route::post('/{id}/approve', [ApiSoundController::class, 'approve'])->name('api.sounds.approve')->where('id', '[0-9]+');
            Route::post('/{id}/reject', [ApiSoundController::class, 'reject'])->name('api.sounds.reject')->where('id', '[0-9]+');
        });
    });
});

// Routes publiques pour les sons - ANCIENNE API (maintenue pour compatibilité)
Route::get('/sounds-legacy', [SoundController::class, 'index']);
Route::get('/sounds-legacy/{sound}', [SoundController::class, 'show']);
Route::get('/sounds/categories/list', [SoundController::class, 'getCategories']);

// Routes publiques pour les événements
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/search', [EventController::class, 'search']);
Route::get('/events/{event}', [EventController::class, 'show']);

// Routes publiques pour les clips vidéos
Route::prefix('clips')->group(function () {
    Route::get('/', [ClipController::class, 'index'])->name('api.clips.index');
    Route::get('/search', [ClipController::class, 'search'])->name('api.clips.search');
    Route::get('/categories', [ClipController::class, 'getCategories'])->name('api.clips.categories');
    Route::get('/{id}', [ClipController::class, 'show'])->name('api.clips.show')->where('id', '[0-9]+');
    Route::post('/{id}/share', [ClipController::class, 'share'])->name('api.clips.share')->where('id', '[0-9]+');

    // Routes publiques pour les commentaires
    Route::get('/{id}/comments', [ClipController::class, 'getComments'])->name('api.clips.comments')->where('id', '[0-9]+');

    // Routes authentifiées pour les clips
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [ClipController::class, 'store'])->name('api.clips.store')->middleware('can_upload_clips');
        Route::put('/{id}', [ClipController::class, 'update'])->name('api.clips.update')->where('id', '[0-9]+');
        Route::delete('/{id}', [ClipController::class, 'destroy'])->name('api.clips.destroy')->where('id', '[0-9]+');
        Route::post('/{id}/like', [ClipController::class, 'toggleLike'])->name('api.clips.like')->where('id', '[0-9]+');
        Route::post('/{id}/bookmark', [ClipController::class, 'toggleBookmark'])->name('api.clips.bookmark')->where('id', '[0-9]+');

        // Routes pour les commentaires
        Route::post('/{id}/comments', [ClipController::class, 'addComment'])->name('api.clips.comments.store')->where('id', '[0-9]+');
    });
});

// Routes pour les commentaires (likes)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/comments/{id}/like', [ClipController::class, 'toggleCommentLike'])->name('api.comments.like')->where('id', '[0-9]+');
});

// Routes publiques pour les compétitions
Route::prefix('competitions')->group(function () {
    Route::get('/', [CompetitionController::class, 'index'])->name('api.competitions.index');
    Route::get('/search', [CompetitionController::class, 'search'])->name('api.competitions.search');
    Route::get('/categories', [CompetitionController::class, 'getCategories'])->name('api.competitions.categories');
    Route::get('/upcoming', [CompetitionController::class, 'upcoming'])->name('api.competitions.upcoming');
    Route::get('/popular', [CompetitionController::class, 'popular'])->name('api.competitions.popular');
    Route::get('/{id}', [CompetitionController::class, 'show'])->name('api.competitions.show')->where('id', '[0-9]+');
    
    // Routes publiques pour les fonctionnalités live
    Route::get('/{id}/participants', [CompetitionController::class, 'getParticipants'])->name('api.competitions.participants')->where('id', '[0-9]+');
    Route::get('/{id}/chat', [CompetitionController::class, 'getChatMessages'])->name('api.competitions.chat')->where('id', '[0-9]+');

    // Routes authentifiées pour les compétitions
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [CompetitionController::class, 'store'])->name('api.competitions.store')->middleware('can_upload_clips');
        Route::put('/{id}', [CompetitionController::class, 'update'])->name('api.competitions.update')->where('id', '[0-9]+');
        Route::delete('/{id}', [CompetitionController::class, 'destroy'])->name('api.competitions.destroy')->where('id', '[0-9]+');
        Route::post('/{id}/register', [CompetitionController::class, 'register'])->name('api.competitions.register')->where('id', '[0-9]+');
        Route::delete('/{id}/unregister', [CompetitionController::class, 'unregister'])->name('api.competitions.unregister')->where('id', '[0-9]+');
        
        // Routes pour les fonctionnalités live
        Route::post('/chat', [CompetitionController::class, 'sendChatMessage'])->name('api.competitions.chat.send');
        Route::post('/react', [CompetitionController::class, 'addReaction'])->name('api.competitions.react');
        Route::post('/vote', [CompetitionController::class, 'addVote'])->name('api.competitions.vote');
        Route::post('/submit-performance', [CompetitionController::class, 'submitPerformance'])->name('api.competitions.submit-performance');
    });
});

// Routes publiques pour les artistes
Route::prefix('artists')->group(function () {
    Route::get('/', [UserController::class, 'getArtists'])->name('api.artists.index');
    Route::get('/search', [UserController::class, 'searchArtists'])->name('api.artists.search');
    Route::get('/{id}', [UserController::class, 'getArtist'])->name('api.artists.show')->where('id', '[0-9]+');
    Route::get('/{id}/clips', [ClipController::class, 'getArtistClips'])->name('api.artists.clips')->where('id', '[0-9]+');
    Route::get('/{id}/competitions', [CompetitionController::class, 'getArtistCompetitions'])->name('api.artists.competitions')->where('id', '[0-9]+');

    // Routes authentifiées pour les artistes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/{id}/follow', [UserController::class, 'toggleFollow'])->name('api.artists.follow')->where('id', '[0-9]+');
    });
});

// Routes protégées par l'authentification
Route::middleware('auth:sanctum')->group(function () {
    // Informations utilisateur
    Route::get('/user', [AuthController::class, 'user']);

    // Déconnexion
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);

    // Gestion du profil
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/photo', [AuthController::class, 'updateProfilePhoto']);
    Route::put('/change-password', [AuthController::class, 'changePassword']);

    // Routes pour les paiements de compétitions
    Route::prefix('competition-payments')->group(function () {
        Route::get('/', [CompetitionPaymentController::class, 'index'])->name('api.competition-payments.index');
        Route::post('/', [CompetitionPaymentController::class, 'store'])->name('api.competition-payments.store');
        Route::get('/{competitionPayment}', [CompetitionPaymentController::class, 'show'])->name('api.competition-payments.show');
        Route::put('/{competitionPayment}', [CompetitionPaymentController::class, 'update'])->name('api.competition-payments.update');
        Route::delete('/{competitionPayment}', [CompetitionPaymentController::class, 'destroy'])->name('api.competition-payments.destroy');
        Route::post('/{competitionPayment}/refund', [CompetitionPaymentController::class, 'refund'])->name('api.competition-payments.refund');
        Route::get('/competition/{competitionId}', [CompetitionPaymentController::class, 'getCompetitionPayments'])->name('api.competition-payments.by-competition');
        Route::get('/user/{userId}', [CompetitionPaymentController::class, 'getUserPayments'])->name('api.competition-payments.by-user');
        Route::get('/status/{transactionId}', [CompetitionPaymentController::class, 'checkPaymentStatus'])->name('api.competition-payments.status');
        Route::get('/statistics', [CompetitionPaymentController::class, 'statistics'])->name('api.competition-payments.statistics');
    });

    // Routes pour l'utilisateur connecté
    Route::prefix('user')->group(function () {
        Route::get('/clips', [ClipController::class, 'getUserClips'])->name('api.user.clips');
        Route::get('/competitions', [CompetitionController::class, 'getUserCompetitions'])->name('api.user.competitions');
        Route::get('/sounds', [ApiSoundController::class, 'getUserSounds'])->name('api.user.sounds');
        Route::get('/purchases', [ApiSoundController::class, 'getUserPurchases'])->name('api.user.purchases');
        Route::get('/favorites', [ApiSoundController::class, 'getUserFavorites'])->name('api.user.favorites');
        Route::get('/stats', [UserController::class, 'getUserStats'])->name('api.user.stats');

        // Ajouter les routes manquantes pour le Profile
        Route::get('/purchased-sounds', [UserController::class, 'getPurchasedSounds'])->name('api.user.purchased-sounds');
        Route::get('/favorite-sounds', [UserController::class, 'getFavoriteSounds'])->name('api.user.favorite-sounds');
        Route::get('/followed-artists', [UserController::class, 'getFollowedArtists'])->name('api.user.followed-artists');
        Route::get('/purchased-events', [UserController::class, 'getPurchasedEvents'])->name('api.user.purchased-events');
    });

    // Routes d'administration (admin uniquement)
    Route::middleware(['admin'])->prefix('admin')->group(function () {
        // Gestion des sons
        Route::post('/sounds/{id}/approve', [AdminController::class, 'approveSound']);
        Route::post('/sounds/{id}/reject', [AdminController::class, 'rejectSound']);

        // Gestion des clips
        Route::prefix('clips')->group(function () {
            Route::get('/stats', [ClipManagementController::class, 'getClipStats'])->name('api.admin.clips.stats');
            Route::get('/', [ClipManagementController::class, 'getClips'])->name('api.admin.clips.index');
            Route::get('/pending', [ClipManagementController::class, 'getPendingClips'])->name('api.admin.clips.pending');
            Route::post('/{clipId}/approve', [ClipManagementController::class, 'approveClip'])->name('api.admin.clips.approve');
            Route::post('/{clipId}/reject', [ClipManagementController::class, 'rejectClip'])->name('api.admin.clips.reject');
            Route::post('/{clipId}/toggle-featured', [ClipManagementController::class, 'toggleFeaturedClip'])->name('api.admin.clips.toggle-featured');
            Route::delete('/{clipId}', [ClipManagementController::class, 'deleteClip'])->name('api.admin.clips.delete');
            Route::post('/batch-action', [ClipManagementController::class, 'batchAction'])->name('api.admin.clips.batch-action');
        });

        // Gestion des certifications
        Route::prefix('certifications')->group(function () {
            Route::get('/stats', [CertificationController::class, 'getCertificationStats'])->name('api.admin.certifications.stats');
            Route::get('/{soundId}/certificate', [CertificationController::class, 'generateCertificate'])->name('api.admin.certifications.certificate');
            Route::get('/artist/{userId}', [CertificationController::class, 'getArtistCertifications'])->name('api.admin.certifications.artist');
        });

        // Analytics
        Route::prefix('analytics')->group(function () {
            Route::get('/global', [AnalyticsController::class, 'getGlobalAnalytics'])->name('api.admin.analytics.global');
            Route::get('/users', [AnalyticsController::class, 'getUserAnalytics'])->name('api.admin.analytics.users');
            Route::get('/content', [AnalyticsController::class, 'getContentAnalytics'])->name('api.admin.analytics.content');
            Route::get('/trends', [AnalyticsController::class, 'getTrends'])->name('api.admin.analytics.trends');
        });

        // Gestion des paiements
        Route::prefix('payments')->group(function () {
            Route::get('/stats', [PaymentManagementController::class, 'getPaymentStats'])->name('api.admin.payments.stats');
            Route::get('/transactions', [PaymentManagementController::class, 'getTransactions'])->name('api.admin.payments.transactions');
            Route::get('/artist-revenues', [PaymentManagementController::class, 'getArtistRevenues'])->name('api.admin.payments.artist-revenues');
            Route::post('/transactions/{transactionId}/approve', [PaymentManagementController::class, 'approvePayment'])->name('api.admin.payments.approve');
            Route::post('/transactions/{transactionId}/reject', [PaymentManagementController::class, 'rejectPayment'])->name('api.admin.payments.reject');
            Route::post('/transactions/{transactionId}/refund', [PaymentManagementController::class, 'refundPayment'])->name('api.admin.payments.refund');
            Route::post('/batch-action', [PaymentManagementController::class, 'batchAction'])->name('api.admin.payments.batch-action');
        });

        // Gestion des utilisateurs
        Route::get('/users', [UserController::class, 'index'])->name('api.admin.users.index');
        Route::get('/users/{id}', [UserController::class, 'show'])->name('api.admin.users.show');
        Route::put('/users/{id}', [UserController::class, 'update'])->name('api.admin.users.update');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('api.admin.users.destroy');
    });

    // Routes Dashboard (admin uniquement)
    Route::middleware(['admin'])->prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'getStats'])->name('api.dashboard.stats');
        Route::get('/sounds', [DashboardController::class, 'getSounds'])->name('api.dashboard.sounds');
        Route::get('/events', [DashboardController::class, 'getEvents'])->name('api.dashboard.events');
        Route::get('/users', [DashboardController::class, 'getUsers'])->name('api.dashboard.users');
        Route::get('/commission', [DashboardController::class, 'getCommission'])->name('api.dashboard.commission');
        Route::put('/commission', [DashboardController::class, 'updateCommission'])->name('api.dashboard.commission.update');
        Route::get('/users-revenue', [DashboardController::class, 'getUsersRevenue'])->name('api.dashboard.users-revenue');
        Route::get('/users-purchases', [DashboardController::class, 'getUsersPurchases'])->name('api.dashboard.users-purchases');
        Route::get('/user-payments/{userId}', [DashboardController::class, 'getUserPayments'])->name('api.dashboard.user-payments');
        Route::get('/payments/search', [DashboardController::class, 'searchPayments'])->name('api.dashboard.payments.search');
        Route::get('/payments/{type}/{productId}', [DashboardController::class, 'getProductPayments'])->name('api.dashboard.product-payments');
        Route::get('/receipt/{paymentId}', [DashboardController::class, 'generateReceipt'])->name('api.dashboard.receipt');
        Route::post('/payments/{paymentId}/approve', [DashboardController::class, 'approvePayment'])->name('api.dashboard.payments.approve');
        Route::post('/payments/{paymentId}/cancel', [DashboardController::class, 'cancelPayment'])->name('api.dashboard.payments.cancel');
        Route::post('/payments/{paymentId}/refund', [DashboardController::class, 'refundPayment'])->name('api.dashboard.payments.refund');
        Route::post('/payments/batch-action', [DashboardController::class, 'batchPaymentAction'])->name('api.dashboard.payments.batch');
    });

    // Gestion des sons (utilisateurs authentifiés) - ANCIENNE API
    Route::post('/sounds-legacy', [SoundController::class, 'store']);
    Route::put('/sounds-legacy/{sound}', [SoundController::class, 'update']);
    Route::delete('/sounds-legacy/{sound}', [SoundController::class, 'destroy']);
    Route::get('/sounds-legacy/{sound}/download', [SoundController::class, 'download']);
});

// Routes de test pour développement uniquement
if (config('app.debug')) {
    Route::get('/test-auth', function (Request $request) {
        try {
            $user = $request->user();
            return response()->json([
                'success' => true,
                'message' => 'Test d\'authentification réussi',
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role
                ] : null,
                'authenticated' => !!$user,
                'token_present' => $request->bearerToken() ? 'YES' : 'NO'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur test auth',
                'error' => $e->getMessage()
            ], 500);
        }
    })->middleware('auth:sanctum');
}

// Route pour vérifier le statut de l'API
Route::get('/status', function () {
    return response()->json([
        'status' => 'active',
        'message' => 'API Reveil4artist fonctionnelle',
        'version' => '1.0.0',
        'timestamp' => now()
    ]);
});

// Route pour les statistiques audio live
Route::get('/competitions/{competition}/audio-stats', [AudioLiveController::class, 'getAudioStats']);
