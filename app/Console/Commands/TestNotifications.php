<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Sound;
use App\Notifications\SoundApproved;
use App\Notifications\SoundRejected;

class TestNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:notifications {--user-id=1} {--sound-id=1}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tester le système de notifications pour l\'approbation et le rejet des sons';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->option('user-id');
        $soundId = $this->option('sound-id');

        try {
            // Récupérer l'utilisateur
            $user = User::find($userId);
            if (!$user) {
                $this->error("Utilisateur avec l'ID {$userId} non trouvé");
                return 1;
            }

            // Récupérer le son
            $sound = Sound::find($soundId);
            if (!$sound) {
                $this->error("Son avec l'ID {$soundId} non trouvé");
                return 1;
            }

            $this->info("Test du système de notifications");
            $this->info("Utilisateur: {$user->name} ({$user->email})");
            $this->info("Son: {$sound->title}");
            $this->newLine();

            // Test de notification d'approbation
            $this->info("1. Test de notification d'approbation...");
            $user->notify(new SoundApproved($sound));
            $this->info("✓ Notification d'approbation envoyée");

            // Test de notification de rejet
            $this->info("2. Test de notification de rejet...");
            $user->notify(new SoundRejected($sound, "Test de rejet automatique - qualité audio insuffisante"));
            $this->info("✓ Notification de rejet envoyée");

            $this->newLine();
            $this->info("Vérification des notifications dans la base de données...");

            $notificationsCount = $user->notifications()->count();
            $unreadCount = $user->unreadNotifications()->count();

            $this->info("Total des notifications: {$notificationsCount}");
            $this->info("Notifications non lues: {$unreadCount}");

            $this->newLine();
            $this->info("✅ Test terminé avec succès!");
            $this->info("Vous pouvez maintenant vérifier les notifications via l'API:");
            $this->info("GET /api/notifications");

            return 0;

        } catch (\Exception $e) {
            $this->error("Erreur lors du test: " . $e->getMessage());
            return 1;
        }
    }
}
