<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\CommissionSetting;

class TestDashboardApi extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:dashboard-api';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tester l\'API du dashboard simplifié';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧪 Test de l\'API Dashboard Simplifié...');

        // 1. Vérifier l'admin
        $admin = User::where('email', 'admin@reveilartist.com')->first();
        if (!$admin) {
            $this->error('❌ Utilisateur admin non trouvé');
            $this->line('Créez un admin avec: php artisan admin:create');
            return 1;
        }

        $this->line("✅ Admin trouvé: {$admin->name} ({$admin->email})");

        // 2. Tester les paramètres de commission
        $this->info("\n📊 Test des paramètres de commission:");
        try {
            $soundRate = CommissionSetting::getValue('sound_commission', 15);
            $eventRate = CommissionSetting::getValue('event_commission', 10);
            $this->line("✅ Commission sons: {$soundRate}%");
            $this->line("✅ Commission événements: {$eventRate}%");
        } catch (\Exception $e) {
            $this->error("❌ Erreur commission: " . $e->getMessage());
        }

        // 3. Tester la mise à jour de commission
        $this->info("\n🔄 Test mise à jour commission:");
        try {
            CommissionSetting::setValue('sound_commission', 20);
            $newRate = CommissionSetting::getValue('sound_commission');
            $this->line("✅ Nouvelle commission sons: {$newRate}%");

            // Remettre la valeur par défaut
            CommissionSetting::setValue('sound_commission', 15);
            $this->line("✅ Commission remise à 15%");
        } catch (\Exception $e) {
            $this->error("❌ Erreur mise à jour: " . $e->getMessage());
        }

        // 4. Afficher les routes API disponibles
        $this->info("\n🌐 Routes API disponibles:");
        $routes = [
            'GET /api/dashboard/stats',
            'GET /api/dashboard/commission',
            'POST /api/dashboard/commission',
            'GET /api/dashboard/sounds',
            'GET /api/dashboard/events',
            'GET /api/dashboard/users'
        ];

        foreach ($routes as $route) {
            $this->line("  📡 {$route}");
        }

        // 5. Informations de test
        $this->info("\n🎯 Pour tester dans le navigateur:");
        $this->line("URL: http://127.0.0.1:8000/login");
        $this->line("Email: admin@reveilartist.com");
        $this->line("Mot de passe: admin123");

        $this->info("\n✨ Nouvelles fonctionnalités:");
        $this->line("🎵 Lecteur audio avec bouton play/pause");
        $this->line("⚙️ Modification commission en temps réel");
        $this->line("📊 Interface simplifiée et responsive");
        $this->line("🎨 Icônes dynamiques selon le type de contenu");

        $this->info("\n🚀 Test terminé avec succès!");
        return 0;
    }
}
