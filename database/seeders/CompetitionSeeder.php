<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Competition;
use App\Models\User;
use Carbon\Carbon;

class CompetitionSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Récupérer quelques utilisateurs organisateurs
        $organizers = User::whereIn('role', ['artist', 'producer', 'admin'])->get();

        if ($organizers->isEmpty()) {
            // Créer un utilisateur organisateur test
            $organizer = User::create([
                'name' => 'Organisateur Pro',
                'email' => 'organisateur@test.com',
                'password' => bcrypt('password'),
                'role' => 'producer',
                'status' => 'active',
            ]);
            $organizers = collect([$organizer]);
        }

        $competitions = [
            [
                'title' => 'Battle de Rap Urbain 2024',
                'description' => 'La plus grande compétition de rap du Cameroun ! Venez montrer votre talent et affronter les meilleurs rappeurs de la région. Prix exceptionnels et reconnaissance garantie pour les gagnants.',
                'category' => 'Rap',
                'entry_fee' => 5000,
                'max_participants' => 20,
                'start_date' => Carbon::now()->addDays(15)->format('Y-m-d'),
                'start_time' => '20:00',
                'duration' => 180, // 3 heures
                'rules' => [
                    'Performance de 3 minutes maximum par participant',
                    'Contenu original uniquement, pas de covers',
                    'Respect du temps de passage strictement appliqué',
                    'Tenue correcte exigée',
                    'Pas de contenu offensant ou inapproprié'
                ],
                'prizes' => [
                    ['position' => 1, 'percentage' => 50, 'label' => '1er Prix'],
                    ['position' => 2, 'percentage' => 30, 'label' => '2ème Prix'],
                    ['position' => 3, 'percentage' => 20, 'label' => '3ème Prix']
                ],
                'judging_criteria' => [
                    ['name' => 'Flow/Rythme', 'weight' => 30],
                    ['name' => 'Originalité', 'weight' => 25],
                    ['name' => 'Technique', 'weight' => 25],
                    ['name' => 'Présence scénique', 'weight' => 20]
                ],
                'status' => 'published',
                'current_participants' => 12,
            ],
            [
                'title' => 'Concours Afrobeat Stars',
                'description' => 'Célébrons les rythmes afrobeat ! Une compétition dédiée aux artistes afrobeat émergents. Ambiance garantie et prix attractifs pour les meilleurs talents.',
                'category' => 'Afrobeat',
                'entry_fee' => 7500,
                'max_participants' => 15,
                'start_date' => Carbon::now()->addDays(22)->format('Y-m-d'),
                'start_time' => '19:30',
                'duration' => 150, // 2h30
                'rules' => [
                    'Style afrobeat obligatoire',
                    'Performance de 4 minutes maximum',
                    'Instruments live encouragés',
                    'Chorégraphie appréciée'
                ],
                'prizes' => [
                    ['position' => 1, 'percentage' => 45, 'label' => '1er Prix'],
                    ['position' => 2, 'percentage' => 35, 'label' => '2ème Prix'],
                    ['position' => 3, 'percentage' => 20, 'label' => '3ème Prix']
                ],
                'judging_criteria' => [
                    ['name' => 'Authenticité afrobeat', 'weight' => 35],
                    ['name' => 'Énergie scénique', 'weight' => 25],
                    ['name' => 'Musicalité', 'weight' => 25],
                    ['name' => 'Créativité', 'weight' => 15]
                ],
                'status' => 'published',
                'current_participants' => 8,
            ],
            [
                'title' => 'Gospel Voice Competition',
                'description' => 'Une compétition spirituelle pour les voix gospel exceptionnelles. Venez partager votre foi à travers la musique et inspirez la communauté.',
                'category' => 'Gospel',
                'entry_fee' => 3000,
                'max_participants' => 25,
                'start_date' => Carbon::now()->addDays(10)->format('Y-m-d'),
                'start_time' => '15:00',
                'duration' => 120, // 2 heures
                'rules' => [
                    'Répertoire gospel uniquement',
                    'Performance de 5 minutes maximum',
                    'Accompagnement musical autorisé',
                    'Message inspirant encouragé'
                ],
                'prizes' => [
                    ['position' => 1, 'percentage' => 50, 'label' => '1er Prix'],
                    ['position' => 2, 'percentage' => 30, 'label' => '2ème Prix'],
                    ['position' => 3, 'percentage' => 20, 'label' => '3ème Prix']
                ],
                'judging_criteria' => [
                    ['name' => 'Qualité vocale', 'weight' => 40],
                    ['name' => 'Émotion/Spiritualité', 'weight' => 30],
                    ['name' => 'Technique', 'weight' => 20],
                    ['name' => 'Présence', 'weight' => 10]
                ],
                'status' => 'published',
                'current_participants' => 18,
            ],
            [
                'title' => 'Makossa Heritage Contest',
                'description' => 'Préservons notre patrimoine musical ! Une compétition dédiée au Makossa traditionnel et moderne. Célébrons nos racines culturelles.',
                'category' => 'Makossa',
                'entry_fee' => 4000,
                'max_participants' => 12,
                'start_date' => Carbon::now()->addDays(30)->format('Y-m-d'),
                'start_time' => '18:00',
                'duration' => 90, // 1h30
                'rules' => [
                    'Style makossa obligatoire',
                    'Instruments traditionnels encouragés',
                    'Performance de 6 minutes maximum',
                    'Respect des traditions culturelles'
                ],
                'prizes' => [
                    ['position' => 1, 'percentage' => 55, 'label' => '1er Prix'],
                    ['position' => 2, 'percentage' => 30, 'label' => '2ème Prix'],
                    ['position' => 3, 'percentage' => 15, 'label' => '3ème Prix']
                ],
                'judging_criteria' => [
                    ['name' => 'Authenticité makossa', 'weight' => 40],
                    ['name' => 'Technique musicale', 'weight' => 30],
                    ['name' => 'Créativité', 'weight' => 20],
                    ['name' => 'Respect tradition', 'weight' => 10]
                ],
                'status' => 'published',
                'current_participants' => 6,
            ],
            [
                'title' => 'Open Mic Challenge',
                'description' => 'Toutes catégories confondues ! Une compétition ouverte à tous les styles musicaux. Montrez votre polyvalence et votre originalité.',
                'category' => 'Pop',
                'entry_fee' => 2500,
                'max_participants' => 30,
                'start_date' => Carbon::now()->addDays(45)->format('Y-m-d'),
                'start_time' => '16:00',
                'duration' => 240, // 4 heures
                'rules' => [
                    'Tous styles musicaux acceptés',
                    'Performance de 4 minutes maximum',
                    'Instruments et backing tracks autorisés',
                    'Créativité sans limites'
                ],
                'prizes' => [
                    ['position' => 1, 'percentage' => 40, 'label' => '1er Prix'],
                    ['position' => 2, 'percentage' => 25, 'label' => '2ème Prix'],
                    ['position' => 3, 'percentage' => 20, 'label' => '3ème Prix'],
                    ['position' => 4, 'percentage' => 15, 'label' => 'Prix du public']
                ],
                'judging_criteria' => [
                    ['name' => 'Originalité', 'weight' => 30],
                    ['name' => 'Performance', 'weight' => 25],
                    ['name' => 'Technique', 'weight' => 25],
                    ['name' => 'Impact émotionnel', 'weight' => 20]
                ],
                'status' => 'published',
                'current_participants' => 22,
            ],
        ];

        foreach ($competitions as $competitionData) {
            // Calculer la deadline d'inscription (24h avant le début)
            $startDateTime = Carbon::parse($competitionData['start_date'] . ' ' . $competitionData['start_time']);
            $competitionData['registration_deadline'] = $startDateTime->copy()->subDay();

            // Calculer la cagnotte totale
            $competitionData['total_prize_pool'] = $competitionData['entry_fee'] * $competitionData['current_participants'];

            // Assigner un organisateur aléatoire
            $competitionData['user_id'] = $organizers->random()->id;

            $competition = Competition::create($competitionData);

            $this->command->info("Compétition créée: {$competition->title} - {$competition->formatted_total_prize_pool}");
        }

        $this->command->info('Compétitions de test créées avec succès !');
    }
}
