<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CommissionSetting;

class CreateCommissionSettings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'commission:init';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initialiser les paramètres de commission par défaut';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Initialisation des paramètres de commission...');

        // Créer les paramètres par défaut
        $settings = [
            [
                'key' => 'sound_commission',
                'value' => 15.00,
                'description' => 'Commission sur les ventes de sons (%)',
                'is_active' => true
            ],
            [
                'key' => 'event_commission',
                'value' => 10.00,
                'description' => 'Commission sur les ventes de billets d\'événements (%)',
                'is_active' => true
            ]
        ];

        $created = 0;
        $updated = 0;

        foreach ($settings as $setting) {
            $existing = CommissionSetting::where('key', $setting['key'])->first();

            if ($existing) {
                $existing->update($setting);
                $updated++;
                $this->line("✓ Mis à jour: {$setting['key']} = {$setting['value']}%");
            } else {
                CommissionSetting::create($setting);
                $created++;
                $this->line("✓ Créé: {$setting['key']} = {$setting['value']}%");
            }
        }

        $this->info("Terminé! {$created} paramètre(s) créé(s), {$updated} paramètre(s) mis à jour.");

        // Afficher tous les paramètres actuels
        $this->newLine();
        $this->info('Paramètres de commission actuels:');
        $this->table(
            ['Clé', 'Valeur', 'Description', 'Actif'],
            CommissionSetting::all()->map(function ($setting) {
                return [
                    $setting->key,
                    $setting->value . '%',
                    $setting->description,
                    $setting->is_active ? 'Oui' : 'Non'
                ];
            })
        );

        return 0;
    }
}
