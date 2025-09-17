<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer un administrateur
        User::create([
            'name' => 'Admin Reveil4artist',
            'email' => 'admin@reveil4artist.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'phone' => '+237 690 123 456',
            'bio' => 'Administrateur de la plateforme Reveil4artist',
            'location' => 'Yaoundé',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Créer un artiste
        User::create([
            'name' => 'DJ Cameroun',
            'email' => 'dj.cameroun@reveil4artist.com',
            'password' => Hash::make('password123'),
            'role' => 'artist',
            'phone' => '+237 691 234 567',
            'bio' => 'Producteur et artiste spécialisé dans l\'Afrobeat et la musique traditionnelle camerounaise.',
            'location' => 'Douala',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Créer un producteur
        User::create([
            'name' => 'BeatMaster237',
            'email' => 'beatmaster@reveil4artist.com',
            'password' => Hash::make('password123'),
            'role' => 'producer',
            'phone' => '+237 692 345 678',
            'bio' => 'Producteur musical avec plus de 10 ans d\'expérience dans l\'industrie musicale camerounaise.',
            'location' => 'Bafoussam',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Créer un utilisateur standard
        User::create([
            'name' => 'Jean Kamga',
            'email' => 'jean.kamga@email.com',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'phone' => '+237 693 456 789',
            'bio' => 'Passionné de musique camerounaise et amateur d\'Afrobeat.',
            'location' => 'Garoua',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Créer un artiste suspendu pour tester
        User::create([
            'name' => 'Artiste Suspendu',
            'email' => 'suspendu@reveil4artist.com',
            'password' => Hash::make('password123'),
            'role' => 'artist',
            'phone' => '+237 694 567 890',
            'bio' => 'Compte suspendu pour violation des conditions d\'utilisation.',
            'location' => 'Bamenda',
            'status' => 'suspended',
            'email_verified_at' => now(),
        ]);
    }
}
