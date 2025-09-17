<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Sound;
use App\Models\Event;
use App\Models\Competition;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['user', 'seller', 'sound', 'event', 'competition']);

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('seller_id')) {
            $query->where('seller_id', $request->seller_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('sound', function ($soundQuery) use ($search) {
                      $soundQuery->where('title', 'like', "%{$search}%");
                  })
                  ->orWhereHas('event', function ($eventQuery) use ($search) {
                      $eventQuery->where('title', 'like', "%{$search}%");
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
            'type' => 'required|in:sound,event,competition_entry',
            'sound_id' => 'nullable|exists:sounds,id|required_if:type,sound',
            'event_id' => 'nullable|exists:events,id|required_if:type,event',
            'competition_id' => 'nullable|exists:competitions,id|required_if:type,competition_entry',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'payment_provider' => 'nullable|string',
            'external_payment_id' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        // Obtenir le vendeur selon le type
        if ($validated['type'] === 'sound') {
            $sound = Sound::findOrFail($validated['sound_id']);
            $validated['seller_id'] = $sound->user_id;
        } elseif ($validated['type'] === 'event') {
            $event = Event::findOrFail($validated['event_id']);
            $validated['seller_id'] = $event->user_id;
        } elseif ($validated['type'] === 'competition_entry') {
            $competition = Competition::findOrFail($validated['competition_id']);
            $validated['seller_id'] = $competition->user_id;
        }

        try {
            $payment = Payment::createPayment($validated);

            return response()->json([
                'message' => 'Paiement créé avec succès',
                'payment' => $payment->load(['user', 'seller', 'sound', 'event', 'competition'])
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
    public function show(Payment $payment): JsonResponse
    {
        return response()->json(
            $payment->load(['user', 'seller', 'sound', 'event', 'competition'])
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
    public function update(Request $request, Payment $payment): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'completed', 'failed', 'refunded', 'cancelled'])],
            'external_payment_id' => 'nullable|string',
            'metadata' => 'nullable|array',
            'failure_reason' => 'nullable|string',
        ]);

        try {
            $payment->update($validated);

            // Mettre à jour les timestamps selon le statut
            if (isset($validated['status'])) {
                switch ($validated['status']) {
                    case 'completed':
                        $payment->markAsCompleted();
                        break;
                    case 'failed':
                        $payment->markAsFailed($validated['failure_reason'] ?? 'Raison non spécifiée');
                        break;
                    case 'refunded':
                        $payment->refund();
                        break;
                }
            }

            return response()->json([
                'message' => 'Paiement mis à jour avec succès',
                'payment' => $payment->fresh()->load(['user', 'seller', 'sound', 'event', 'competition'])
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
    public function destroy(Payment $payment): JsonResponse
    {
        try {
            $payment->delete();

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
     * Obtenir les statistiques des paiements
     */
    public function statistics(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $stats = DB::select("
            SELECT
                COUNT(*) as total_payments,
                SUM(amount) as total_amount,
                SUM(commission_amount) as total_commission,
                SUM(seller_amount) as total_seller_amount,
                AVG(amount) as average_amount,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
                COUNT(CASE WHEN type = 'sound' THEN 1 END) as sound_payments,
                COUNT(CASE WHEN type = 'event' THEN 1 END) as event_payments
            FROM payments
            WHERE created_at BETWEEN ? AND ?
        ", [$startDate, $endDate]);

        // Statistiques par jour pour les graphiques
        $dailyStats = Payment::selectRaw('
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(amount) as amount,
                SUM(commission_amount) as commission
            ')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top vendeurs
        $topSellers = Payment::selectRaw('
                seller_id,
                users.name as seller_name,
                COUNT(*) as sales_count,
                SUM(seller_amount) as total_earnings
            ')
            ->join('users', 'payments.seller_id', '=', 'users.id')
            ->where('status', 'completed')
            ->whereBetween('payments.created_at', [$startDate, $endDate])
            ->groupBy('seller_id', 'users.name')
            ->orderBy('total_earnings', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'overview' => $stats[0] ?? null,
            'daily_stats' => $dailyStats,
            'top_sellers' => $topSellers,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ]);
    }

    /**
     * Marquer un paiement comme complété
     */
    public function markAsCompleted(Payment $payment): JsonResponse
    {
        if ($payment->status !== 'pending') {
            return response()->json([
                'message' => 'Seuls les paiements en attente peuvent être marqués comme complétés'
            ], 400);
        }

        $payment->markAsCompleted();

        return response()->json([
            'message' => 'Paiement marqué comme complété',
            'payment' => $payment->fresh()
        ]);
    }

    /**
     * Rembourser un paiement
     */
    public function refund(Payment $payment): JsonResponse
    {
        if ($payment->status !== 'completed') {
            return response()->json([
                'message' => 'Seuls les paiements complétés peuvent être remboursés'
            ], 400);
        }

        $payment->refund();

        return response()->json([
            'message' => 'Paiement remboursé avec succès',
            'payment' => $payment->fresh()
        ]);
    }

    /**
     * Export des paiements en CSV
     */
    public function export(Request $request)
    {
        $payments = Payment::with(['user', 'seller', 'sound', 'event'])
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->type, function ($query, $type) {
                return $query->where('type', $type);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $filename = 'paiements_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($payments) {
            $file = fopen('php://output', 'w');

            // En-têtes CSV
            fputcsv($file, [
                'ID Transaction',
                'Acheteur',
                'Vendeur',
                'Type',
                'Produit',
                'Montant Total',
                'Commission',
                'Montant Vendeur',
                'Statut',
                'Date',
            ]);

            // Données
            foreach ($payments as $payment) {
                fputcsv($file, [
                    $payment->transaction_id,
                    $payment->user->name ?? 'N/A',
                    $payment->seller->name ?? 'N/A',
                    $payment->type === 'sound' ? 'Son' : ($payment->type === 'event' ? 'Événement' : 'Participation à une compétition'),
                    $payment->product_name,
                    $payment->amount,
                    $payment->commission_amount,
                    $payment->seller_amount,
                    $payment->status_label,
                    $payment->created_at->format('d/m/Y H:i'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Traiter un paiement de test depuis le panier
     */
    public function processTestPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.type' => 'required|in:sound,event',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'promo_code' => 'nullable|string',
            'payment_method' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $orderNumber = 'RVL-' . time() . '-' . strtoupper(Str::random(5));
            $payments = [];

            // Créer un paiement pour chaque article
            foreach ($validated['items'] as $item) {
                $itemPrice = $item['price'] * $item['quantity'];

                // Appliquer la réduction proportionnelle si applicable
                if ($validated['discount'] > 0) {
                    $discountRatio = $validated['discount'] / $validated['subtotal'];
                    $itemDiscount = $itemPrice * $discountRatio;
                    $finalItemPrice = $itemPrice - $itemDiscount;
                } else {
                    $finalItemPrice = $itemPrice;
                }

                // Déterminer le vendeur selon le type
                if ($item['type'] === 'sound') {
                    $product = Sound::findOrFail($item['id']);
                    $sellerId = $product->user_id;
                } else {
                    $product = Event::findOrFail($item['id']);
                    $sellerId = $product->user_id;
                }

                // Calculer les commissions
                $commission = Payment::calculateCommission($finalItemPrice, $item['type']);

                // Créer le paiement
                $paymentData = [
                    'user_id' => $validated['user_id'],
                    'seller_id' => $sellerId,
                    'type' => $item['type'],
                    'amount' => $finalItemPrice,
                    'payment_method' => $validated['payment_method'],
                    'payment_provider' => 'test_payment',
                    'external_payment_id' => $orderNumber . '-' . $item['id'],
                    'metadata' => json_encode([
                        'order_number' => $orderNumber,
                        'quantity' => $item['quantity'],
                        'original_price' => $item['price'],
                        'promo_code' => $validated['promo_code'],
                        'test_payment' => true
                    ])
                ];

                if ($item['type'] === 'sound') {
                    $paymentData['sound_id'] = $item['id'];
                } else {
                    $paymentData['event_id'] = $item['id'];
                }

                $payment = Payment::create(array_merge($paymentData, $commission, [
                    'transaction_id' => 'TXN_' . time() . '_' . rand(1000, 9999),
                    'status' => 'completed', // Test payment = automatiquement complété
                    'paid_at' => now(),
                ]));

                $payments[] = $payment->load(['user', 'seller', 'sound', 'event']);

                // Mettre à jour les statistiques du produit
                if ($item['type'] === 'sound') {
                    $product->increment('downloads_count', $item['quantity']);
                } else {
                    $product->increment('current_attendees', $item['quantity']);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Paiement de test traité avec succès',
                'order_number' => $orderNumber,
                'payments' => $payments,
                'total_amount' => $validated['total'],
                'discount_applied' => $validated['discount'] ?? 0,
                'promo_code' => $validated['promo_code']
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
