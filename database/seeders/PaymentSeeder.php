<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Payment;
use App\Models\User;
use App\Models\Sound;
use App\Models\Event;
use Carbon\Carbon;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer des utilisateurs, sons et événements existants
        $users = User::all();
        $sounds = Sound::all();
        $events = Event::all();

        if ($users->isEmpty() || ($sounds->isEmpty() && $events->isEmpty())) {
            $this->command->info('Aucun utilisateur, son ou événement trouvé. Veuillez d\'abord exécuter les autres seeders.');
            return;
        }

        // Générer des paiements pour les sons
        if ($sounds->isNotEmpty()) {
            foreach ($sounds->take(20) as $sound) {
                $buyer = $users->where('id', '!=', $sound->user_id)->random();

                Payment::createPayment([
                    'user_id' => $buyer->id,
                    'seller_id' => $sound->user_id,
                    'type' => 'sound',
                    'sound_id' => $sound->id,
                    'amount' => $sound->price ?: rand(199, 999) / 100, // Prix entre 1.99 et 9.99
                    'payment_method' => collect(['card', 'mobile_money', 'bank_transfer'])->random(),
                    'payment_provider' => collect(['stripe', 'paypal', 'orange_money', 'mtn_money'])->random(),
                    'status' => collect(['completed', 'completed', 'completed', 'completed', 'completed', 'pending', 'failed'])->random(), // 85% complétés
                    'created_at' => Carbon::now()->subDays(rand(0, 30)),
                ]);
            }
        }

        // Générer des paiements pour les événements
        if ($events->isNotEmpty()) {
            foreach ($events->take(15) as $event) {
                // Générer plusieurs billets par événement
                $ticketCount = rand(1, 5);

                for ($i = 0; $i < $ticketCount; $i++) {
                    $buyer = $users->where('id', '!=', $event->user_id)->random();

                    Payment::createPayment([
                        'user_id' => $buyer->id,
                        'seller_id' => $event->user_id,
                        'type' => 'event',
                        'event_id' => $event->id,
                        'amount' => $event->ticket_price ?: rand(1000, 5000) / 100, // Prix entre 10 et 50
                        'payment_method' => collect(['card', 'mobile_money', 'bank_transfer'])->random(),
                        'payment_provider' => collect(['stripe', 'paypal', 'orange_money', 'mtn_money'])->random(),
                        'status' => collect(['completed', 'completed', 'completed', 'completed', 'completed', 'pending', 'failed'])->random(), // 85% complétés
                        'created_at' => Carbon::now()->subDays(rand(0, 30)),
                    ]);
                }
            }
        }

        // Générer quelques paiements remboursés
        $completedPayments = Payment::where('status', 'completed')->take(5)->get();
        foreach ($completedPayments as $payment) {
            if (rand(1, 10) <= 2) { // 20% de chance d'être remboursé
                $payment->update([
                    'status' => 'refunded',
                    'refunded_at' => Carbon::now()->subDays(rand(1, 10)),
                ]);
            }
        }

        $this->command->info('Paiements de test créés avec succès !');
    }
}
