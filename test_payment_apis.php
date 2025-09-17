<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\Payment;

echo "=== Test des nouvelles APIs de gestion des paiements ===\n\n";

// 1. Test de getUsersRevenue
echo "1. Test getUsersRevenue...\n";
$controller = new App\Http\Controllers\DashboardController();
$request = new Illuminate\Http\Request();

try {
    $response = $controller->getUsersRevenue();
    $data = json_decode($response->getContent(), true);

    if (isset($data['users_revenue'])) {
        echo "✅ getUsersRevenue fonctionne\n";
        echo "- Nombre d'utilisateurs: " . count($data['users_revenue']) . "\n";
        echo "- Total revenus: " . $data['summary']['formatted_total_earnings_all'] . "\n";
        echo "- Vendeurs actifs: " . $data['summary']['active_sellers'] . "\n";

        // Afficher les 3 premiers utilisateurs
        echo "\nTop 3 vendeurs:\n";
        foreach (array_slice($data['users_revenue'], 0, 3) as $user) {
            echo "- {$user['name']}: {$user['formatted_total_earnings']} ({$user['total_sales_count']} ventes)\n";
        }
    } else {
        echo "❌ Erreur getUsersRevenue\n";
    }
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
}

echo "\n";

// 2. Test getUserPayments pour un utilisateur spécifique
echo "2. Test getUserPayments...\n";
$userWithPayments = User::whereHas('sales')->first();

if ($userWithPayments) {
    try {
        $response = $controller->getUserPayments($request, $userWithPayments->id);
        $data = json_decode($response->getContent(), true);

        if ($data['success']) {
            echo "✅ getUserPayments fonctionne\n";
            echo "- Utilisateur: {$data['user']['name']}\n";
            echo "- Total paiements: {$data['payments']['total']}\n";
            echo "- Paiements sur cette page: " . count($data['payments']['data']) . "\n";

            // Afficher les statuts des paiements
            $statuses = [];
            foreach ($data['payments']['data'] as $payment) {
                $statuses[$payment['status']] = ($statuses[$payment['status']] ?? 0) + 1;
            }

            echo "Statuts des paiements:\n";
            foreach ($statuses as $status => $count) {
                echo "- {$status}: {$count}\n";
            }
        } else {
            echo "❌ Erreur getUserPayments: {$data['message']}\n";
        }
    } catch (Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Aucun utilisateur avec des paiements trouvé\n";
}

echo "\n";

// 3. Test d'approbation d'un paiement
echo "3. Test d'approbation de paiement...\n";
$pendingPayment = Payment::where('status', 'pending')->first();

if ($pendingPayment) {
    echo "Paiement trouvé: {$pendingPayment->transaction_id} (statut: {$pendingPayment->status})\n";

    try {
        $response = $controller->approvePayment($request, $pendingPayment->id);
        $data = json_decode($response->getContent(), true);

        if ($data['success']) {
            echo "✅ Approbation réussie\n";
            echo "- Nouveau statut: {$data['payment']['status']}\n";
            echo "- Message: {$data['message']}\n";

            // Vérifier en base de données
            $updatedPayment = Payment::find($pendingPayment->id);
            echo "- Statut en BDD: {$updatedPayment->status}\n";
            echo "- Date de paiement: " . ($updatedPayment->paid_at ? $updatedPayment->paid_at->format('d/m/Y H:i') : 'N/A') . "\n";
        } else {
            echo "❌ Erreur approbation: {$data['message']}\n";
        }
    } catch (Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Aucun paiement en attente trouvé\n";

    // Créer un paiement de test
    $user1 = User::first();
    $user2 = User::skip(1)->first();
    $sound = \App\Models\Sound::first();

    if ($user1 && $user2 && $sound) {
        echo "Création d'un paiement de test...\n";

        $testPayment = Payment::create([
            'user_id' => $user1->id,
            'seller_id' => $user2->id,
            'sound_id' => $sound->id,
            'type' => 'sound',
            'amount' => 2000,
            'seller_amount' => 1700,
            'commission_amount' => 300,
            'commission_rate' => 15,
            'transaction_id' => 'TEST_APPROVE_' . time(),
            'status' => 'pending',
            'payment_method' => 'test',
        ]);

        echo "✅ Paiement de test créé: {$testPayment->transaction_id}\n";

        // Tester l'approbation
        try {
            $response = $controller->approvePayment($request, $testPayment->id);
            $data = json_decode($response->getContent(), true);

            if ($data['success']) {
                echo "✅ Approbation du test réussie\n";
                echo "- Nouveau statut: {$data['payment']['status']}\n";
            } else {
                echo "❌ Erreur approbation test: {$data['message']}\n";
            }
        } catch (Exception $e) {
            echo "❌ Exception: " . $e->getMessage() . "\n";
        }
    }
}

echo "\n";

// 4. Test d'annulation d'un paiement
echo "4. Test d'annulation de paiement...\n";
$completedPayment = Payment::where('status', 'completed')->first();

if ($completedPayment) {
    echo "Paiement trouvé: {$completedPayment->transaction_id} (statut: {$completedPayment->status})\n";

    $cancelRequest = new Illuminate\Http\Request();
    $cancelRequest->merge(['reason' => 'Test d\'annulation depuis le dashboard admin']);

    try {
        $response = $controller->cancelPayment($cancelRequest, $completedPayment->id);
        $data = json_decode($response->getContent(), true);

        if ($data['success']) {
            echo "✅ Annulation réussie\n";
            echo "- Nouveau statut: {$data['payment']['status']}\n";
            echo "- Message: {$data['message']}\n";

            // Vérifier en base
            $updatedPayment = Payment::find($completedPayment->id);
            echo "- Statut en BDD: {$updatedPayment->status}\n";
            echo "- Raison: {$updatedPayment->failure_reason}\n";
        } else {
            echo "❌ Erreur annulation: {$data['message']}\n";
        }
    } catch (Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Aucun paiement complété trouvé pour test d'annulation\n";
}

echo "\n";

// 5. Test de traitement par lot
echo "5. Test de traitement par lot...\n";
$pendingPayments = Payment::where('status', 'pending')->take(2)->pluck('id')->toArray();

if (count($pendingPayments) >= 1) {
    echo "Paiements à traiter: " . implode(', ', $pendingPayments) . "\n";

    $batchRequest = new Illuminate\Http\Request();
    $batchRequest->merge([
        'payment_ids' => $pendingPayments,
        'action' => 'approve'
    ]);

    try {
        $response = $controller->batchPaymentAction($batchRequest);
        $data = json_decode($response->getContent(), true);

        if ($data['success']) {
            echo "✅ Traitement par lot réussi\n";
            echo "- Message: {$data['message']}\n";
            echo "- Succès: {$data['results']['total_success']}\n";
            echo "- Erreurs: {$data['results']['total_errors']}\n";
        } else {
            echo "❌ Erreur traitement par lot: {$data['message']}\n";
        }
    } catch (Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Pas assez de paiements en attente pour test par lot\n";
}

echo "\n=== Tests terminés ===\n";
