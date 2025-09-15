<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Sound;
use App\Models\Event;
use Carbon\Carbon;

class PaymentManagementController extends Controller
{
    /**
     * Obtenir les statistiques des paiements
     */
    public function getPaymentStats()
    {
        try {
            // Pour simplifier, on va utiliser des métriques simulées basées sur les données existantes
            $totalUsers = User::count();
            $totalSounds = Sound::count();
            $totalEvents = Event::count();

            // Simulation des revenus basée sur les prix des sons
            $freeSounds = Sound::where('is_free', true)->count();
            $paidSounds = Sound::where('is_free', false)->count();
            $avgPrice = Sound::where('is_free', false)->avg('price') ?? 0;

            // Calculs simulés
            $estimatedRevenue = $paidSounds * $avgPrice * 0.3; // 30% de taux de conversion simulé
            $totalTransactions = $paidSounds * 5; // Simulation
            $pendingPayments = (int)($totalTransactions * 0.05); // 5% en attente
            $completedPayments = $totalTransactions - $pendingPayments;

            // Données pour graphiques (7 derniers jours)
            $dailyRevenue = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $dailyRevenue[] = [
                    'date' => $date->format('Y-m-d'),
                    'label' => $date->format('d/m'),
                    'revenue' => rand(50, 300), // Simulation
                    'transactions' => rand(5, 25), // Simulation
                ];
            }

            // Top sons générateurs de revenus (simulation)
            $topRevenueSounds = Sound::where('is_free', false)
                ->with('user:id,name')
                ->orderBy('plays_count', 'desc')
                ->limit(10)
                ->get()
                ->map(function($sound, $index) {
                    $estimatedSales = max(1, (int)($sound->plays_count * 0.1)); // 10% conversion
                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'artist' => $sound->user->name ?? 'Artiste inconnu',
                        'price' => $sound->price,
                        'estimated_sales' => $estimatedSales,
                        'estimated_revenue' => $estimatedSales * $sound->price,
                        'plays_count' => $sound->plays_count ?? 0,
                        'conversion_rate' => $sound->plays_count > 0 ?
                            round(($estimatedSales / $sound->plays_count) * 100, 2) : 0,
                    ];
                });

            // Méthodes de paiement simulées
            $paymentMethods = [
                'card' => ['label' => 'Carte bancaire', 'count' => (int)($totalTransactions * 0.6)],
                'paypal' => ['label' => 'PayPal', 'count' => (int)($totalTransactions * 0.25)],
                'stripe' => ['label' => 'Stripe', 'count' => (int)($totalTransactions * 0.15)],
            ];

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_revenue' => round($estimatedRevenue, 2),
                    'total_transactions' => $totalTransactions,
                    'completed_payments' => $completedPayments,
                    'pending_payments' => $pendingPayments,
                    'failed_payments' => (int)($totalTransactions * 0.02), // 2% échecs
                    'avg_transaction_value' => $totalTransactions > 0 ? round($estimatedRevenue / $totalTransactions, 2) : 0,
                    'conversion_rate' => $totalSounds > 0 ? round(($paidSounds / $totalSounds) * 100, 2) : 0,
                ],
                'daily_revenue' => $dailyRevenue,
                'top_revenue_sounds' => $topRevenueSounds,
                'payment_methods' => $paymentMethods,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getPaymentStats: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur chargement statistiques paiements'], 500);
        }
    }

    /**
     * Obtenir la liste des transactions avec filtres
     */
    public function getTransactions(Request $request)
    {
        try {
            // Filtres de base
            $query = Sound::with('user:id,name,email')
                ->where('status', 'published');

            // Filtres par statut simulé
            if ($request->has('status') && $request->status !== 'all') {
                // Pour la simulation, on va juste filtrer aléatoirement
            }

            // Recherche
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'LIKE', "%{$search}%")
                      ->orWhereHas('user', function($userQuery) use ($search) {
                          $userQuery->where('name', 'LIKE', "%{$search}%")
                                   ->orWhere('email', 'LIKE', "%{$search}%");
                      });
                });
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $sounds = $query->paginate($perPage);

            // Transformer en transactions simulées
            $sounds->getCollection()->transform(function ($sound) {
                $estimatedSales = max(1, (int)($sound->plays_count * 0.1));
                $statuses = ['completed', 'pending', 'failed'];
                $status = $statuses[array_rand($statuses)];

                // Assurer un prix minimum pour la simulation
                $price = $sound->price ?? rand(1000, 5000);

                return [
                    'id' => 'TXN-' . $sound->id . '-' . rand(1000, 9999),
                    'sound_id' => $sound->id,
                    'sound_title' => $sound->title,
                    'artist' => $sound->user->name ?? 'Artiste inconnu',
                    'user_email' => $sound->user->email ?? 'email@example.com',
                    'amount' => $price,
                    'currency' => 'FCFA',
                    'status' => $status,
                    'payment_method' => ['card', 'paypal', 'mobile_money'][array_rand(['card', 'paypal', 'mobile_money'])],
                    'transaction_date' => $sound->created_at,
                    'formatted_date' => $sound->created_at->format('d/m/Y H:i'),
                    'formatted_amount' => number_format($price, 0, ',', ' ') . ' FCFA',
                    'commission' => round($price * 0.1, 2), // 10% commission
                    'artist_revenue' => round($price * 0.9, 2), // 90% pour l'artiste
                ];
            });

            return response()->json([
                'success' => true,
                'transactions' => $sounds
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getTransactions: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur chargement transactions'], 500);
        }
    }

    /**
     * Obtenir les revenus par artiste
     */
    public function getArtistRevenues()
    {
        try {
            $artistRevenues = User::whereIn('role', ['artist', 'producer'])
                ->withCount('sounds')
                ->with('sounds')
                ->get()
                ->map(function($user) {
                    $totalRevenue = 0;
                    $totalSales = 0;
                    $paidSounds = 0;

                    foreach ($user->sounds as $sound) {
                        if (!$sound->is_free && $sound->price > 0) {
                            $paidSounds++;
                            $estimatedSales = max(1, (int)($sound->plays_count * 0.1));
                            $revenue = $estimatedSales * $sound->price * 0.9; // 90% pour l'artiste
                            $totalRevenue += $revenue;
                            $totalSales += $estimatedSales;
                        }
                    }

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'total_sounds' => $user->sounds_count,
                        'paid_sounds' => $paidSounds,
                        'total_sales' => $totalSales,
                        'total_revenue' => round($totalRevenue, 2),
                        'avg_revenue_per_sound' => $paidSounds > 0 ? round($totalRevenue / $paidSounds, 2) : 0,
                        'member_since' => $user->created_at->format('d/m/Y'),
                        'last_upload' => $user->sounds->max('created_at'),
                        'formatted_total_revenue' => number_format($totalRevenue, 0, ',', ' ') . ' FCFA',
                        'formatted_avg_revenue' => number_format($paidSounds > 0 ? $totalRevenue / $paidSounds : 0, 0, ',', ' ') . ' FCFA',
                    ];
                })
                ->filter(function($artist) {
                    return $artist['paid_sounds'] > 0; // Inclure ceux qui ont au moins un son payant
                })
                ->sortByDesc('total_revenue')
                ->values();

            return response()->json([
                'success' => true,
                'artist_revenues' => $artistRevenues
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getArtistRevenues: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur revenus artistes'], 500);
        }
    }

    /**
     * Approuver un paiement
     */
    public function approvePayment(Request $request, $transactionId)
    {
        try {
            // Simulation de l'approbation
            Log::info("Paiement approuvé: {$transactionId} par l'admin " . Auth::user()->name);

            return response()->json([
                'success' => true,
                'message' => 'Paiement approuvé avec succès',
                'transaction_id' => $transactionId
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur approvePayment: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur approbation paiement'], 500);
        }
    }

    /**
     * Rejeter un paiement
     */
    public function rejectPayment(Request $request, $transactionId)
    {
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        try {
            Log::info("Paiement rejeté: {$transactionId} par l'admin " . Auth::user()->name . " - Raison: " . $request->reason);

            return response()->json([
                'success' => true,
                'message' => 'Paiement rejeté avec succès',
                'transaction_id' => $transactionId
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur rejectPayment: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur rejet paiement'], 500);
        }
    }

    /**
     * Rembourser un paiement
     */
    public function refundPayment(Request $request, $transactionId)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:500'
        ]);

        try {
            Log::info("Remboursement effectué: {$transactionId} - Montant: {$request->amount} FCFA par l'admin " . Auth::user()->name);

            return response()->json([
                'success' => true,
                'message' => 'Remboursement effectué avec succès',
                'transaction_id' => $transactionId,
                'refund_amount' => $request->amount
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur refundPayment: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur remboursement'], 500);
        }
    }

    /**
     * Actions en lot sur les paiements
     */
    public function batchAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:approve,reject,refund',
            'transaction_ids' => 'required|array|min:1',
            'reason' => 'required_if:action,reject|string|max:500'
        ]);

        try {
            $transactionIds = $request->transaction_ids;
            $action = $request->action;
            $successCount = count($transactionIds); // Simulation

            Log::info("Action en lot '{$action}' effectuée sur {$successCount} paiements par l'admin " . Auth::user()->name);

            return response()->json([
                'success' => true,
                'message' => "Action effectuée sur {$successCount} paiement(s)",
                'processed_count' => $successCount
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur batchAction payments: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur action en lot'], 500);
        }
    }
}
