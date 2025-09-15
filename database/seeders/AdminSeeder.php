<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer un administrateur par défaut
        User::create([
            'name' => 'Administrateur',
            'email' => 'admin@reveilart4artist.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'phone' => '+237670123456',
            'bio' => 'Administrateur principal de la plateforme Reveil4artist',
            'location' => 'Yaoundé, Cameroun',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Créer des utilisateurs de test pour différents rôles
        User::create([
            'name' => 'DJ Cameroun',
            'email' => 'dj@reveilart4artist.com',
            'password' => Hash::make('password123'),
            'role' => 'artist',
            'phone' => '+237677123456',
            'bio' => 'DJ et producteur camerounais spécialisé dans l\'Afrobeat et le Makossa',
            'location' => 'Douala, Cameroun',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'BeatMaster237',
            'email' => 'producer@reveilart4artist.com',
            'password' => Hash::make('password123'),
            'role' => 'producer',
            'phone' => '+237681123456',
            'bio' => 'Producteur de musique électronique et hip-hop',
            'location' => 'Bafoussam, Cameroun',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Marie Utilisatrice',
            'email' => 'user@reveilart4artist.com',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'phone' => '+237690123456',
            'bio' => 'Passionnée de musique camerounaise',
            'location' => 'Garoua, Cameroun',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
    }
}
