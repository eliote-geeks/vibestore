<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create {--email=admin@reveilartist.com} {--password=admin123} {--name=Admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Créer un utilisateur administrateur';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->option('email');
        $password = $this->option('password');
        $name = $this->option('name');

        // Vérifier si l'utilisateur existe déjà
        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            // Mettre à jour l'utilisateur existant
            $existingUser->update([
                'role' => 'admin',
                'status' => 'active',
                'password' => Hash::make($password)
            ]);

            $this->info("Utilisateur existant mis à jour avec le rôle admin:");
            $this->line("Email: {$existingUser->email}");
            $this->line("Nom: {$existingUser->name}");
            $this->line("Rôle: {$existingUser->role}");
        } else {
            // Créer un nouvel utilisateur admin
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now()
            ]);

            $this->info("Nouvel utilisateur admin créé:");
            $this->line("Email: {$user->email}");
            $this->line("Nom: {$user->name}");
            $this->line("Rôle: {$user->role}");
        }

        $this->newLine();
        $this->info("Mot de passe: {$password}");
        $this->warn("N'oubliez pas de changer le mot de passe après la première connexion!");

        return 0;
    }
}
