<?php

namespace App\Console\Commands;

use App\Models\Sound;
use App\Models\SoundCertification;
use App\Models\Payment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CalculateCertifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'certifications:calculate {--force : Force recalculation of existing certifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculate and assign certifications to sounds based on sales/downloads';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Démarrage du calcul des certifications...');

        $force = $this->option('force');
        $newCertifications = 0;
        $updatedCertifications = 0;
        $totalSounds = 0;

        $sounds = Sound::with('certifications')
                      ->where('status', 'published')
                      ->get();

        $progressBar = $this->output->createProgressBar($sounds->count());
        $progressBar->start();

        foreach ($sounds as $sound) {
            $totalSounds++;

            // Calculer la métrique (ventes ou téléchargements)
            if ($sound->is_free) {
                // Pour les sons gratuits, compter les téléchargements
                $metricValue = $sound->downloads_count ?? 0;
            } else {
                // Pour les sons payants, utiliser une valeur temporaire ou basée sur des vues
                $metricValue = $sound->plays_count ?? 0;
            }

            // Calculer le niveau de certification requis
            $certificationLevel = SoundCertification::calculateCertification($metricValue);

            if ($certificationLevel) {
                $existingCertification = $sound->certifications()
                                              ->where('certification_type', $certificationLevel)
                                              ->first();

                if (!$existingCertification) {
                    // Créer une nouvelle certification
                    $certification = SoundCertification::create([
                        'sound_id' => $sound->id,
                        'certification_type' => $certificationLevel,
                        'threshold_reached' => SoundCertification::getCertificationThresholds()[$certificationLevel],
                        'metric_value' => $metricValue,
                        'certificate_number' => SoundCertification::generateCertificateNumber(),
                        'achieved_at' => now(),
                        'is_active' => true
                    ]);

                    $newCertifications++;

                    Log::info("Nouvelle certification créée", [
                        'sound_id' => $sound->id,
                        'sound_title' => $sound->title,
                        'certification' => $certificationLevel,
                        'metric_value' => $metricValue
                    ]);

                } elseif ($force) {
                    // Mettre à jour la certification existante
                    $existingCertification->update([
                        'metric_value' => $metricValue,
                        'threshold_reached' => SoundCertification::getCertificationThresholds()[$certificationLevel]
                    ]);

                    $updatedCertifications++;
                }

                // Vérifier s'il y a un niveau supérieur à atteindre
                $higherLevels = ['silver', 'gold', 'platinum', 'diamond'];
                $currentIndex = array_search($certificationLevel, array_keys(SoundCertification::getCertificationThresholds()));

                if ($currentIndex < count($higherLevels)) {
                    foreach (array_slice($higherLevels, $currentIndex + 1) as $higherLevel) {
                        $higherThreshold = SoundCertification::getCertificationThresholds()[$higherLevel];

                        if ($metricValue >= $higherThreshold) {
                            $higherCertification = $sound->certifications()
                                                       ->where('certification_type', $higherLevel)
                                                       ->first();

                            if (!$higherCertification) {
                                SoundCertification::create([
                                    'sound_id' => $sound->id,
                                    'certification_type' => $higherLevel,
                                    'threshold_reached' => $higherThreshold,
                                    'metric_value' => $metricValue,
                                    'certificate_number' => SoundCertification::generateCertificateNumber(),
                                    'achieved_at' => now(),
                                    'is_active' => true
                                ]);

                                $newCertifications++;

                                Log::info("Certification supérieure créée", [
                                    'sound_id' => $sound->id,
                                    'sound_title' => $sound->title,
                                    'certification' => $higherLevel,
                                    'metric_value' => $metricValue
                                ]);
                            }
                        }
                    }
                }
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();

        $this->info("Calcul des certifications terminé !");
        $this->table(
            ['Métrique', 'Valeur'],
            [
                ['Sons traités', $totalSounds],
                ['Nouvelles certifications', $newCertifications],
                ['Certifications mises à jour', $updatedCertifications]
            ]
        );

        // Afficher un résumé des certifications par type
        $certificationCounts = SoundCertification::selectRaw('certification_type, COUNT(*) as count')
                                                ->groupBy('certification_type')
                                                ->pluck('count', 'certification_type')
                                                ->toArray();

        if (!empty($certificationCounts)) {
            $this->newLine();
            $this->info("Répartition des certifications :");

            $summaryData = [];
            foreach (['bronze', 'silver', 'gold', 'platinum', 'diamond'] as $level) {
                $count = $certificationCounts[$level] ?? 0;
                $emoji = [
                    'bronze' => '🥉',
                    'silver' => '🥈',
                    'gold' => '🥇',
                    'platinum' => '🏆',
                    'diamond' => '💎'
                ][$level];

                $summaryData[] = [$emoji . ' ' . ucfirst($level), $count];
            }

            $this->table(['Type', 'Nombre'], $summaryData);
        }

        return Command::SUCCESS;
    }
}
