<?php

use App\Models\User;
use App\Models\Payment;
use App\Models\Sound;
use App\Models\Event;

echo "=== Test de gestion des paiements ===\n\n";

// Vérifier les données de base
$usersCount = User::count();
$paymentsCount = Payment::count();
$soundsCount = Sound::count();
$eventsCount = Event::count();

echo "Données de base:\n";
echo "- Utilisateurs: {$usersCount}\n";
echo "- Paiements: {$paymentsCount}\n";
echo "- Sons: {$soundsCount}\n";
echo "- Événements: {$eventsCount}\n\n";

if ($paymentsCount === 0) {
    echo "❌ Aucun paiement trouvé. Exécutez d'abord les seeders.\n";
    exit;
}

// Trouver un utilisateur avec des paiements
$userWithPayments = User::whereHas('sales')->first();

if (!$userWithPayments) {
    echo "❌ Aucun utilisateur avec des ventes trouvé.\n";
    exit;
}

echo "Utilisateur testé: {$userWithPayments->name} (ID: {$userWithPayments->id})\n";

// Obtenir ses paiements
$userPayments = Payment::where('seller_id', $userWithPayments->id)
    ->with(['user', 'sound', 'event'])
    ->get();

echo "Paiements de cet utilisateur: {$userPayments->count()}\n\n";

// Afficher le détail des paiements
echo "Détail des paiements:\n";
foreach ($userPayments->take(5) as $payment) {
    $productName = $payment->sound ? $payment->sound->title : ($payment->event ? $payment->event->title : 'Produit supprimé');
    $buyerName = $payment->user ? $payment->user->name : 'Utilisateur supprimé';

    echo "- ID: {$payment->id} | {$payment->transaction_id}\n";
    echo "  Type: {$payment->type} | Produit: {$productName}\n";
    echo "  Acheteur: {$buyerName}\n";
    echo "  Montant: {$payment->amount} XAF | Commission: {$payment->commission_amount} XAF\n";
    echo "  Statut: {$payment->status} | Créé: {$payment->created_at->format('d/m/Y H:i')}\n";
    echo "  Peut être approuvé: " . ($payment->status === 'pending' ? '✅' : '❌') . "\n";
    echo "  Peut être annulé: " . (in_array($payment->status, ['pending', 'completed']) ? '✅' : '❌') . "\n";
    echo "  Peut être remboursé: " . ($payment->status === 'completed' ? '✅' : '❌') . "\n";
    echo "\n";
}

// Statistiques par statut
$statusStats = Payment::where('seller_id', $userWithPayments->id)
    ->selectRaw('status, COUNT(*) as count, SUM(amount) as total_amount')
    ->groupBy('status')
    ->get();

echo "Statistiques par statut:\n";
foreach ($statusStats as $stat) {
    echo "- {$stat->status}: {$stat->count} paiements, {$stat->total_amount} XAF\n";
}

// Test des fonctionnalités de contrôleur
echo "\n=== Test des méthodes du contrôleur ===\n";

// Simuler une requête pour getUserPayments
$request = new Illuminate\Http\Request();
$request->merge(['per_page' => 5]);

$controller = new App\Http\Controllers\DashboardController();

try {
    $response = $controller->getUserPayments($request, $userWithPayments->id);
    $data = json_decode($response->getContent(), true);

    if ($data['success']) {
        echo "✅ getUserPayments fonctionne\n";
        echo "- Utilisateur: {$data['user']['name']}\n";
        echo "- Paiements retournés: " . count($data['payments']['data']) . "\n";
        echo "- Total paiements: {$data['payments']['total']}\n";
    } else {
        echo "❌ Erreur getUserPayments: {$data['message']}\n";
    }
} catch (Exception $e) {
    echo "❌ Exception getUserPayments: " . $e->getMessage() . "\n";
}

// Chercher un paiement en attente pour tester l'approbation
$pendingPayment = Payment::where('seller_id', $userWithPayments->id)
    ->where('status', 'pending')
    ->first();

if ($pendingPayment) {
    echo "\n=== Test d'approbation d'un paiement ===\n";
    echo "Paiement à approuver: {$pendingPayment->transaction_id} (statut: {$pendingPayment->status})\n";

    try {
        $response = $controller->approvePayment($request, $pendingPayment->id);
        $data = json_decode($response->getContent(), true);

        if ($data['success']) {
            echo "✅ Approbation réussie\n";
            echo "- Nouveau statut: {$data['payment']['status']}\n";
            echo "- Date paiement: {$data['payment']['formatted_paid_at']}\n";

            // Vérifier en base
            $updatedPayment = Payment::find($pendingPayment->id);
            echo "- Statut en base: {$updatedPayment->status}\n";
        } else {
            echo "❌ Erreur approbation: {$data['message']}\n";
        }
    } catch (Exception $e) {
        echo "❌ Exception approbation: " . $e->getMessage() . "\n";
    }
} else {
    echo "\n❌ Aucun paiement en attente trouvé pour tester l'approbation\n";

    // Créer un paiement de test en statut pending
    if ($soundsCount > 0) {
        $sound = Sound::first();
        $buyer = User::where('id', '!=', $userWithPayments->id)->first();

        if ($buyer) {
            echo "Création d'un paiement de test en statut pending...\n";

            $testPayment = Payment::create([
                'user_id' => $buyer->id,
                'seller_id' => $userWithPayments->id,
                'sound_id' => $sound->id,
                'type' => 'sound',
                'amount' => 1500,
                'seller_amount' => 1275,
                'commission_amount' => 225,
                'commission_rate' => 15,
                'transaction_id' => 'TEST_' . time(),
                'status' => 'pending',
                'payment_method' => 'test',
            ]);

            echo "✅ Paiement de test créé: {$testPayment->transaction_id}\n";

            // Tester l'approbation
            try {
                $response = $controller->approvePayment($request, $testPayment->id);
                $data = json_decode($response->getContent(), true);

                if ($data['success']) {
                    echo "✅ Approbation du paiement de test réussie\n";
                    echo "- Nouveau statut: {$data['payment']['status']}\n";
                } else {
                    echo "❌ Erreur approbation test: {$data['message']}\n";
                }
            } catch (Exception $e) {
                echo "❌ Exception approbation test: " . $e->getMessage() . "\n";
            }
        }
    }
}

echo "\n=== Test terminé ===\n";
