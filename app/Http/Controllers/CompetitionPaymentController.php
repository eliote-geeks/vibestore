<?php

namespace App\Http\Controllers;

use App\Models\CompetitionPayment;
use App\Models\Competition;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CompetitionPaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CompetitionPayment::with(['user', 'competition', 'organizer']);

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('competition_id')) {
            $query->where('competition_id', $request->competition_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('organizer_id')) {
            $query->where('organizer_id', $request->organizer_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('competition', function ($competitionQuery) use ($search) {
                      $competitionQuery->where('title', 'like', "%{$search}%");
                  });
            });
        }

        $payments = $query->orderBy('created_at', 'desc')
                         ->paginate($request->get('per_page', 15));

        return response()->json($payments);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'competition_id' => 'required|exists:competitions,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:card,mobile_money,bank_transfer',
            'payment_provider' => 'nullable|string',
            'external_payment_id' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        try {
            // Vérifier que l'utilisateur n'a pas déjà payé pour cette compétition
            $existingPayment = CompetitionPayment::where('user_id', $validated['user_id'])
                                                 ->where('competition_id', $validated['competition_id'])
                                                 ->whereIn('status', ['pending', 'completed'])
                                                 ->first();

            if ($existingPayment) {
                return response()->json([
                    'message' => 'Vous avez déjà un paiement en cours ou complété pour cette compétition',
                    'existing_payment' => $existingPayment
                ], 409);
            }

            // Récupérer la compétition pour obtenir l'organisateur
            $competition = Competition::findOrFail($validated['competition_id']);

            // Vérifier que la compétition accepte encore des inscriptions
            if ($competition->current_participants >= $competition->max_participants) {
                return response()->json([
                    'message' => 'Cette compétition est complète',
                ], 400);
            }

            // Vérifier que le montant correspond aux frais d'inscription
            if ($validated['amount'] != $competition->entry_fee) {
                return response()->json([
                    'message' => 'Le montant ne correspond pas aux frais d\'inscription de la compétition',
                    'expected_amount' => $competition->entry_fee,
                    'provided_amount' => $validated['amount']
                ], 400);
            }

            // Créer le paiement
            $paymentData = array_merge($validated, [
                'organizer_id' => $competition->user_id,
                'metadata' => [
                    'competition_title' => $competition->title,
                    'description' => $validated['description'] ?? "Inscription à la compétition: {$competition->title}",
                    'registration_date' => now()->toISOString(),
                ]
            ]);

            $payment = CompetitionPayment::createPayment($paymentData);

            // Marquer automatiquement comme réussi pour les tests
            $payment->markAsCompleted();

            return response()->json([
                'message' => 'Paiement créé avec succès',
                'payment' => $payment->load(['user', 'competition', 'organizer'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(CompetitionPayment $competitionPayment): JsonResponse
    {
        return response()->json(
            $competitionPayment->load(['user', 'competition', 'organizer'])
        );
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, CompetitionPayment $competitionPayment): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'completed', 'failed', 'refunded', 'cancelled'])],
            'external_payment_id' => 'nullable|string',
            'metadata' => 'nullable|array',
            'failure_reason' => 'nullable|string',
        ]);

        try {
            $competitionPayment->update($validated);

            // Mettre à jour les timestamps selon le statut
            if (isset($validated['status'])) {
                switch ($validated['status']) {
                    case 'completed':
                        $competitionPayment->markAsCompleted();
                        break;
                    case 'failed':
                        $competitionPayment->markAsFailed($validated['failure_reason'] ?? 'Raison non spécifiée');
                        break;
                    case 'refunded':
                        $competitionPayment->refund();
                        break;
                }
            }

            return response()->json([
                'message' => 'Paiement mis à jour avec succès',
                'payment' => $competitionPayment->fresh()->load(['user', 'competition', 'organizer'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CompetitionPayment $competitionPayment): JsonResponse
    {
        try {
            // Seuls les paiements en attente ou échoués peuvent être supprimés
            if (!in_array($competitionPayment->status, ['pending', 'failed', 'cancelled'])) {
                return response()->json([
                    'message' => 'Seuls les paiements en attente, échoués ou annulés peuvent être supprimés'
                ], 400);
            }

            $competitionPayment->delete();

            return response()->json([
                'message' => 'Paiement supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les paiements d'une compétition spécifique
     */
    public function getCompetitionPayments($competitionId): JsonResponse
    {
        $competition = Competition::findOrFail($competitionId);

        $payments = CompetitionPayment::with(['user', 'organizer'])
                                     ->byCompetition($competitionId)
                                     ->completed()
                                     ->orderBy('paid_at', 'asc')
                                     ->get();

        $stats = [
            'total_payments' => $payments->count(),
            'total_amount' => $payments->sum('amount'),
            'commission_total' => $payments->sum('commission_amount'),
            'organizer_total' => $payments->sum('organizer_amount'),
            'average_amount' => $payments->avg('amount'),
        ];

        return response()->json([
            'competition' => $competition,
            'payments' => $payments,
            'statistics' => $stats
        ]);
    }

    /**
     * Obtenir les paiements d'un utilisateur
     */
    public function getUserPayments($userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        $payments = CompetitionPayment::with(['competition', 'organizer'])
                                     ->byUser($userId)
                                     ->orderBy('created_at', 'desc')
                                     ->get();

        return response()->json([
            'user' => $user,
            'payments' => $payments,
            'total_spent' => $payments->where('status', 'completed')->sum('amount'),
            'competitions_count' => $payments->where('status', 'completed')->count()
        ]);
    }

    /**
     * Rembourser un paiement
     */
    public function refund(CompetitionPayment $competitionPayment): JsonResponse
    {
        if (!$competitionPayment->canBeRefunded()) {
            return response()->json([
                'message' => 'Ce paiement ne peut pas être remboursé',
                'reason' => $competitionPayment->status !== 'completed'
                           ? 'Le paiement n\'est pas complété'
                           : 'La période de remboursement est expirée (30 jours)'
            ], 400);
        }

        try {
            $competitionPayment->refund();

            return response()->json([
                'message' => 'Paiement remboursé avec succès',
                'payment' => $competitionPayment->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du remboursement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques des paiements de compétitions
     */
    public function statistics(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $stats = CompetitionPayment::selectRaw('
                COUNT(*) as total_payments,
                SUM(amount) as total_amount,
                SUM(commission_amount) as total_commission,
                SUM(organizer_amount) as total_organizer_amount,
                AVG(amount) as average_amount,
                COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_payments,
                COUNT(CASE WHEN status = "pending" THEN 1 END) as pending_payments,
                COUNT(CASE WHEN status = "failed" THEN 1 END) as failed_payments,
                COUNT(CASE WHEN status = "refunded" THEN 1 END) as refunded_payments
            ')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->first();

        // Statistiques par jour
        $dailyStats = CompetitionPayment::selectRaw('
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(amount) as amount,
                SUM(commission_amount) as commission
            ')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top organisateurs
        $topOrganizers = CompetitionPayment::selectRaw('
                organizer_id,
                users.name as organizer_name,
                COUNT(*) as payments_count,
                SUM(organizer_amount) as total_earnings
            ')
            ->join('users', 'competition_payments.organizer_id', '=', 'users.id')
            ->where('status', 'completed')
            ->whereBetween('competition_payments.created_at', [$startDate, $endDate])
            ->groupBy('organizer_id', 'users.name')
            ->orderBy('total_earnings', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'overview' => $stats,
            'daily_stats' => $dailyStats,
            'top_organizers' => $topOrganizers,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ]);
    }

    /**
     * Vérifier le statut d'un paiement par transaction ID
     */
    public function checkPaymentStatus($transactionId): JsonResponse
    {
        $payment = CompetitionPayment::where('transaction_id', $transactionId)
                                    ->with(['user', 'competition', 'organizer'])
                                    ->first();

        if (!$payment) {
            return response()->json([
                'message' => 'Paiement non trouvé'
            ], 404);
        }

        return response()->json([
            'payment' => $payment,
            'can_be_refunded' => $payment->canBeRefunded()
        ]);
    }
}
