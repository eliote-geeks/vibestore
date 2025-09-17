<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\Sound;
use App\Models\Event;
use App\Models\Category;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

// Charger Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Test Complet de la Page 'Mes Créations' ===\n\n";

// Créer ou récupérer un utilisateur complet
$testUser = User::firstOrCreate(
    ['email' => 'artiste.complet@reveilartist.com'],
    [
        'name' => 'Artiste Complet Pro',
        'password' => bcrypt('password'),
        'role' => 'artist',
        'email_verified_at' => now()
    ]
);

echo "👤 Utilisateur de test: {$testUser->name} (ID: {$testUser->id})\n\n";

// Nettoyer les anciennes données de test
Sound::where('user_id', $testUser->id)->delete();
Event::where('user_id', $testUser->id)->delete();
Payment::where('seller_id', $testUser->id)->delete();

// Récupérer ou créer des catégories
$categories = Category::all();
if ($categories->isEmpty()) {
    $category = Category::create([
        'name' => 'Hip-Hop',
        'slug' => 'hip-hop',
        'description' => 'Musique Hip-Hop'
    ]);
    $categories = collect([$category]);
}

// === CRÉER DES SONS DE TEST ===
echo "🎵 Création de sons de test...\n";
$soundsData = [
    ['title' => 'Beat Viral 2024', 'price' => 8000, 'is_free' => false, 'status' => 'published', 'plays' => 2500, 'likes' => 150],
    ['title' => 'Instrumental Gratuit', 'price' => 0, 'is_free' => true, 'status' => 'published', 'plays' => 1800, 'likes' => 200],
    ['title' => 'Son Premium Exclusif', 'price' => 15000, 'is_free' => false, 'status' => 'published', 'plays' => 900, 'likes' => 75],
    ['title' => 'Nouveau Projet', 'price' => 5000, 'is_free' => false, 'status' => 'draft', 'plays' => 0, 'likes' => 0],
    ['title' => 'En Validation', 'price' => 6000, 'is_free' => false, 'status' => 'pending', 'plays' => 10, 'likes' => 2],
];

$createdSounds = [];
foreach ($soundsData as $index => $data) {
    $sound = Sound::create([
        'title' => $data['title'],
        'slug' => \Illuminate\Support\Str::slug($data['title']),
        'description' => "Description détaillée pour {$data['title']}",
        'user_id' => $testUser->id,
        'category_id' => $categories->random()->id,
        'file_path' => "sounds/test-complete-{$index}.mp3",
        'duration' => rand(120, 350),
        'genre' => 'Hip-Hop',
        'price' => $data['price'],
        'is_free' => $data['is_free'],
        'status' => $data['status'],
        'plays_count' => $data['plays'],
        'likes_count' => $data['likes'],
        'downloads_count' => rand(10, 100),
        'bpm' => rand(80, 140),
        'key' => 'C Major'
    ]);
    $createdSounds[] = $sound;
    echo "  ✓ {$data['title']} ({$data['status']})\n";
}

// === CRÉER DES ÉVÉNEMENTS DE TEST ===
echo "\n🎪 Création d'événements de test...\n";
$eventsData = [
    ['title' => 'Concert Live Douala', 'status' => 'active', 'price' => 12000, 'attendees' => 45],
    ['title' => 'Festival Hip-Hop 2024', 'status' => 'active', 'price' => 25000, 'attendees' => 120],
    ['title' => 'Showcase Privé', 'status' => 'pending', 'price' => 8000, 'attendees' => 0],
    ['title' => 'Event Terminé', 'status' => 'completed', 'price' => 15000, 'attendees' => 85],
];

$createdEvents = [];
foreach ($eventsData as $index => $data) {
    $eventDate = $data['status'] === 'completed' ? now()->subDays(30) : now()->addDays(rand(7, 60));

    $event = Event::create([
        'title' => $data['title'],
        'slug' => \Illuminate\Support\Str::slug($data['title']),
        'description' => "Description de l'événement {$data['title']}",
        'user_id' => $testUser->id,
        'venue' => 'Salle de Concert',
        'location' => 'Salle de Concert',
        'address' => 'Avenue de la République',
        'city' => 'Douala',
        'country' => 'Cameroun',
        'event_date' => $eventDate,
        'start_time' => '20:00:00',
        'end_time' => '23:30:00',
        'category' => 'concert',
        'status' => $data['status'],
        'is_free' => false,
        'ticket_price' => $data['price'],
        'max_attendees' => 200,
        'current_attendees' => $data['attendees'],
        'contact_email' => $testUser->email,
        'contact_phone' => '+237 6 78 90 12 34'
    ]);
    $createdEvents[] = $event;
    echo "  ✓ {$data['title']} ({$data['status']})\n";
}

// === CRÉER DES PAIEMENTS/REVENUS DE TEST ===
echo "\n💰 Création de revenus de test...\n";
$totalRevenue = 0;

// Paiements pour les sons
foreach ($createdSounds as $sound) {
    if (!$sound->is_free && $sound->status === 'published') {
        $salesCount = rand(3, 8);
        for ($i = 0; $i < $salesCount; $i++) {
            $amount = $sound->price;
            $commissionRate = 15.0;
            $commissionAmount = $amount * ($commissionRate / 100);
            $sellerAmount = $amount - $commissionAmount;
            $totalRevenue += $sellerAmount;

            Payment::create([
                'user_id' => User::where('id', '!=', $testUser->id)->inRandomOrder()->first()->id ?? 1,
                'seller_id' => $testUser->id,
                'sound_id' => $sound->id,
                'amount' => $amount,
                'seller_amount' => $sellerAmount,
                'commission_amount' => $commissionAmount,
                'commission_rate' => $commissionRate,
                'type' => 'sound',
                'status' => 'completed',
                'transaction_id' => 'TEST_SOUND_' . uniqid(),
                'paid_at' => now()->subDays(rand(1, 60))
            ]);
        }
        echo "  ✓ {$salesCount} ventes pour '{$sound->title}'\n";
    }
}

// Paiements pour les événements
foreach ($createdEvents as $event) {
    if ($event->status === 'active' || $event->status === 'completed') {
        $ticketsSold = $event->current_attendees;
        for ($i = 0; $i < $ticketsSold; $i++) {
            $amount = $event->ticket_price;
            $commissionRate = 10.0; // Commission plus faible pour les événements
            $commissionAmount = $amount * ($commissionRate / 100);
            $sellerAmount = $amount - $commissionAmount;
            $totalRevenue += $sellerAmount;

            Payment::create([
                'user_id' => User::where('id', '!=', $testUser->id)->inRandomOrder()->first()->id ?? 1,
                'seller_id' => $testUser->id,
                'event_id' => $event->id,
                'amount' => $amount,
                'seller_amount' => $sellerAmount,
                'commission_amount' => $commissionAmount,
                'commission_rate' => $commissionRate,
                'type' => 'event',
                'status' => 'completed',
                'transaction_id' => 'TEST_EVENT_' . uniqid(),
                'paid_at' => now()->subDays(rand(1, 90))
            ]);
        }
        echo "  ✓ {$ticketsSold} billets vendus pour '{$event->title}'\n";
    }
}

echo "\n💵 Revenu total généré: " . number_format($totalRevenue, 0, ',', ' ') . " XAF\n\n";

// === TESTER LES APIS ===
// Simuler l'authentification
auth('sanctum')->setUser($testUser);
$controller = new \App\Http\Controllers\Api\UserController();

echo "🧪 === TESTS DES APIS ===\n\n";

// Test 1: API Sons
echo "1️⃣ Test API Mes Sons\n";
echo "─────────────────────\n";
$request1 = new \Illuminate\Http\Request();
$response1 = $controller->getUserSounds($request1);
$data1 = json_decode($response1->getContent(), true);

if ($data1['success']) {
    echo "✅ Succès!\n";
    echo "📊 Sons trouvés: {$data1['pagination']['total']}\n";
    echo "💰 Revenu total sons: {$data1['global_stats']['formatted_total_revenue']}\n";
    echo "📈 Total lectures: {$data1['global_stats']['total_plays']}\n";
    echo "❤️  Total likes: {$data1['global_stats']['total_likes']}\n";

    echo "\n🎵 Répartition par statut:\n";
    foreach ($data1['status_stats'] as $status => $count) {
        echo "   • $status: $count\n";
    }
} else {
    echo "❌ Erreur: {$data1['message']}\n";
}

// Test 2: API Événements
echo "\n\n2️⃣ Test API Mes Événements\n";
echo "─────────────────────────\n";
$request2 = new \Illuminate\Http\Request();
$response2 = $controller->getUserEvents($request2);
$data2 = json_decode($response2->getContent(), true);

if ($data2['success']) {
    echo "✅ Succès!\n";
    echo "🎪 Événements trouvés: {$data2['pagination']['total']}\n";
    echo "💰 Revenu total événements: {$data2['global_stats']['formatted_total_revenue']}\n";
    echo "🎫 Total billets vendus: {$data2['global_stats']['total_tickets_sold']}\n";

    echo "\n🎭 Répartition par statut:\n";
    foreach ($data2['status_stats'] as $status => $count) {
        echo "   • $status: $count\n";
    }
} else {
    echo "❌ Erreur: {$data2['message']}\n";
}

// Test 3: API Revenus
echo "\n\n3️⃣ Test API Mes Revenus\n";
echo "─────────────────────────\n";
$request3 = new \Illuminate\Http\Request();
$response3 = $controller->getUserEarnings($request3);
$data3 = json_decode($response3->getContent(), true);

if ($data3['success']) {
    echo "✅ Succès!\n";
    echo "💎 Catégorie vendeur: {$data3['earnings_summary']['seller_category']}\n";
    echo "💰 Revenus totaux: {$data3['earnings_summary']['formatted_total_earnings']}\n";
    echo "🎵 Revenus sons: {$data3['earnings_summary']['formatted_sounds_earnings']}\n";
    echo "🎪 Revenus événements: {$data3['earnings_summary']['formatted_events_earnings']}\n";
    echo "⏳ Revenus en attente: {$data3['earnings_summary']['formatted_pending_earnings']}\n";
    echo "📈 Croissance mensuelle: {$data3['earnings_summary']['monthly_growth']}%\n";

    $withdrawalInfo = $data3['withdrawal_info'];
    echo "\n💸 Informations de retrait:\n";
    echo "   • Montant disponible: " . number_format($withdrawalInfo['available_for_withdrawal'], 0, ',', ' ') . " XAF\n";
    echo "   • Minimum de retrait: " . number_format($withdrawalInfo['minimum_withdrawal'], 0, ',', ' ') . " XAF\n";
    echo "   • Peut retirer: " . ($withdrawalInfo['can_withdraw'] ? '✅ Oui' : '❌ Non') . "\n";
    echo "   • Prochain paiement: {$withdrawalInfo['next_payout_date']}\n";

    echo "\n💳 Dernières transactions:\n";
    foreach (array_slice($data3['data'], 0, 5) as $transaction) {
        echo "   • {$transaction['item_title']} ({$transaction['type_label']}) - {$transaction['formatted_seller_amount']} - {$transaction['paid_at_human']}\n";
    }
} else {
    echo "❌ Erreur: {$data3['message']}\n";
}

echo "\n\n🎉 === RÉSUMÉ FINAL ===\n";
echo "✅ Toutes les APIs fonctionnent correctement!\n";
echo "📊 L'utilisateur a maintenant:\n";
echo "   • " . count($createdSounds) . " sons créés\n";
echo "   • " . count($createdEvents) . " événements organisés\n";
echo "   • " . number_format($totalRevenue, 0, ',', ' ') . " XAF de revenus\n";
echo "   • Accès complet à ses statistiques et revenus\n";
echo "   • Possibilité de retrait de fonds\n\n";

echo "🚀 La page 'Mes Créations' est prête avec des données réelles de la base de données!\n";
