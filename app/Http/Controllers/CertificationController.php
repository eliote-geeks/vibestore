<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Sound;
use App\Models\User;
// use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificationController extends Controller
{
    // Seuils pour les certifications (basés sur les téléchargements/ventes)
    const CERTIFICATION_THRESHOLDS = [
        'bronze' => 1000,      // 1k téléchargements/ventes
        'silver' => 5000,      // 5k téléchargements/ventes
        'gold' => 10000,       // 10k téléchargements/ventes
        'platinum' => 50000,   // 50k téléchargements/ventes
        'diamond' => 100000,   // 100k téléchargements/ventes
    ];

    /**
     * Obtenir les statistiques de certification pour tous les sons
     */
    public function getCertificationStats()
    {
        try {
            $sounds = Sound::with(['user'])
                ->select([
                    'id', 'title', 'user_id', 'downloads_count', 'likes_count',
                    'plays_count', 'price', 'is_free', 'created_at'
                ])
                ->get()
                ->map(function ($sound) {
                    // Pour simplifier, utilisons les métriques existantes
                    // Pour les sons gratuits, utiliser les téléchargements
                    // Pour les sons payants, utiliser les écoutes comme proxy des ventes
                    $metric = $sound->is_free ?
                        ($sound->downloads_count ?? 0) :
                        ($sound->plays_count ?? 0);

                    $certification = $this->calculateCertification($metric);
                    $nextLevel = $this->getNextCertificationLevel($certification);
                    $progress = $this->calculateProgress($metric, $certification, $nextLevel);

                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'artist' => $sound->user ? $sound->user->name : 'Artiste inconnu',
                        'user_id' => $sound->user_id,
                        'downloads_count' => $sound->downloads_count ?? 0,
                        'sales_count' => $sound->is_free ? 0 : ($sound->plays_count ?? 0), // Proxy pour les ventes
                        'likes_count' => $sound->likes_count ?? 0,
                        'plays_count' => $sound->plays_count ?? 0,
                        'is_free' => $sound->is_free,
                        'price' => $sound->price,
                        'metric_value' => $metric,
                        'certification' => $certification,
                        'certification_label' => $this->getCertificationLabel($certification),
                        'certification_icon' => $this->getCertificationIcon($certification),
                        'certification_color' => $this->getCertificationColor($certification),
                        'next_level' => $nextLevel,
                        'next_level_label' => $nextLevel ? $this->getCertificationLabel($nextLevel) : null,
                        'progress_to_next' => $progress,
                        'threshold_current' => $certification ? self::CERTIFICATION_THRESHOLDS[$certification] : 0,
                        'threshold_next' => $nextLevel ? self::CERTIFICATION_THRESHOLDS[$nextLevel] : null,
                        'created_at' => $sound->created_at,
                        'has_certification' => !is_null($certification),
                        'can_generate_certificate' => !is_null($certification),
                    ];
                });

            // Statistiques globales
            $totalSounds = $sounds->count();
            $certifiedSounds = $sounds->where('has_certification', true)->count();

            $certificationCounts = [
                'bronze' => $sounds->where('certification', 'bronze')->count(),
                'silver' => $sounds->where('certification', 'silver')->count(),
                'gold' => $sounds->where('certification', 'gold')->count(),
                'platinum' => $sounds->where('certification', 'platinum')->count(),
                'diamond' => $sounds->where('certification', 'diamond')->count(),
            ];

            // Top sons par certification
            $topSounds = $sounds->where('has_certification', true)
                ->sortByDesc('metric_value')
                ->take(10)
                ->values();

            return response()->json([
                'success' => true,
                'sounds' => $sounds->sortByDesc('metric_value')->values(),
                'stats' => [
                    'total_sounds' => $totalSounds,
                    'certified_sounds' => $certifiedSounds,
                    'certification_rate' => $totalSounds > 0 ? round(($certifiedSounds / $totalSounds) * 100, 1) : 0,
                    'certification_counts' => $certificationCounts,
                ],
                'top_sounds' => $topSounds,
                'thresholds' => self::CERTIFICATION_THRESHOLDS
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getCertificationStats: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur chargement certifications'], 500);
        }
    }

    /**
     * Générer un certificat de disque pour un son
     */
    public function generateCertificate(Request $request, $soundId)
    {
        try {
            $sound = Sound::with(['user'])->findOrFail($soundId);

            // Vérifier si le son a droit à une certification
            $metric = $sound->is_free ?
                ($sound->downloads_count ?? 0) :
                ($sound->plays_count ?? 0);

            $certification = $this->calculateCertification($metric);

            if (!$certification) {
                return response()->json([
                    'success' => false,
                    'error' => 'Ce son n\'a pas encore atteint les seuils de certification'
                ], 400);
            }

            // Données pour le certificat
            $certificateData = [
                'sound' => $sound,
                'artist' => $sound->user ? $sound->user->name : 'Artiste inconnu',
                'certification' => $certification,
                'certification_label' => $this->getCertificationLabel($certification),
                'metric_value' => $metric,
                'metric_label' => $sound->is_free ? 'téléchargements' : 'ventes',
                'threshold' => self::CERTIFICATION_THRESHOLDS[$certification],
                'date' => now()->format('d/m/Y'),
                'certificate_number' => $this->generateCertificateNumber($sound->id, $certification),
            ];

            // Générer le PDF
            if ($request->get('format') === 'pdf') {
                try {
                    $pdf = Pdf::loadView('certificates.disk-certificate', $certificateData);
                    $pdf->setPaper('A4', 'landscape');

                    // Créer un nom de fichier sûr
                    $safeSoundTitle = preg_replace('/[^a-zA-Z0-9-_]/', '-', $sound->title);
                    $filename = "certificat-disque-{$certification}-{$safeSoundTitle}-{$sound->id}.pdf";

                    return $pdf->download($filename);
                } catch (\Exception $pdfError) {
                    Log::error('Erreur génération PDF: ' . $pdfError->getMessage());
                    return response()->json([
                        'success' => false,
                        'error' => 'Erreur lors de la génération du PDF: ' . $pdfError->getMessage()
                    ], 500);
                }
            }

            // Retourner les données pour affichage web
            return response()->json([
                'success' => true,
                'certificate_data' => $certificateData
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur generateCertificate: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur génération certificat'], 500);
        }
    }

    /**
     * Obtenir l'historique des certifications pour un artiste
     */
    public function getArtistCertifications(Request $request, $userId)
    {
        try {
            $user = User::findOrFail($userId);

            $sounds = Sound::where('user_id', $userId)
                ->select(['id', 'title', 'downloads_count', 'is_free', 'plays_count', 'created_at'])
                ->get()
                ->map(function ($sound) {
                    $metric = $sound->is_free ?
                        ($sound->downloads_count ?? 0) :
                        ($sound->plays_count ?? 0);

                    $certification = $this->calculateCertification($metric);

                    return [
                        'id' => $sound->id,
                        'title' => $sound->title,
                        'metric_value' => $metric,
                        'certification' => $certification,
                        'certification_label' => $certification ? $this->getCertificationLabel($certification) : 'Aucune',
                        'certification_color' => $certification ? $this->getCertificationColor($certification) : '#6c757d',
                        'created_at' => $sound->created_at,
                        'has_certification' => !is_null($certification),
                    ];
                })
                ->filter(function ($sound) {
                    return $sound['has_certification'];
                })
                ->sortByDesc('metric_value')
                ->values();

            $certificationCounts = $sounds->countBy('certification');
            $totalCertifications = $sounds->count();
            $highestCertification = $sounds->first()['certification'] ?? null;

            return response()->json([
                'success' => true,
                'artist' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'sounds' => $sounds,
                'stats' => [
                    'total_certifications' => $totalCertifications,
                    'highest_certification' => $highestCertification,
                    'highest_certification_label' => $highestCertification ? $this->getCertificationLabel($highestCertification) : 'Aucune',
                    'certification_breakdown' => $certificationCounts,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getArtistCertifications: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Erreur chargement certifications artiste'], 500);
        }
    }

    /**
     * Calculer le niveau de certification basé sur les métriques
     */
    private function calculateCertification($metricValue)
    {
        foreach (array_reverse(self::CERTIFICATION_THRESHOLDS, true) as $level => $threshold) {
            if ($metricValue >= $threshold) {
                return $level;
            }
        }
        return null;
    }

    /**
     * Obtenir le prochain niveau de certification
     */
    private function getNextCertificationLevel($currentLevel)
    {
        if (!$currentLevel) {
            return 'bronze'; // Premier niveau
        }

        $levels = array_keys(self::CERTIFICATION_THRESHOLDS);
        $currentIndex = array_search($currentLevel, $levels);

        return isset($levels[$currentIndex + 1]) ? $levels[$currentIndex + 1] : null;
    }

    /**
     * Calculer le progrès vers le prochain niveau
     */
    private function calculateProgress($metricValue, $currentLevel, $nextLevel)
    {
        if (!$nextLevel) {
            return 100; // Niveau maximum atteint
        }

        $currentThreshold = $currentLevel ? self::CERTIFICATION_THRESHOLDS[$currentLevel] : 0;
        $nextThreshold = self::CERTIFICATION_THRESHOLDS[$nextLevel];

        if ($metricValue <= $currentThreshold) {
            return round(($metricValue / $nextThreshold) * 100, 1);
        }

        return round((($metricValue - $currentThreshold) / ($nextThreshold - $currentThreshold)) * 100, 1);
    }

    /**
     * Obtenir le libellé d'une certification
     */
    private function getCertificationLabel($certification)
    {
        $labels = [
            'bronze' => 'Disque de Bronze',
            'silver' => 'Disque d\'Argent',
            'gold' => 'Disque d\'Or',
            'platinum' => 'Disque de Platine',
            'diamond' => 'Disque de Diamant',
        ];

        return $labels[$certification] ?? 'Aucune certification';
    }

    /**
     * Obtenir l'icône d'une certification
     */
    private function getCertificationIcon($certification)
    {
        $icons = [
            'bronze' => '🥉',
            'silver' => '🥈',
            'gold' => '🥇',
            'platinum' => '🏆',
            'diamond' => '💎',
        ];

        return $icons[$certification] ?? '';
    }

    /**
     * Obtenir la couleur d'une certification
     */
    private function getCertificationColor($certification)
    {
        $colors = [
            'bronze' => '#CD7F32',
            'silver' => '#C0C0C0',
            'gold' => '#FFD700',
            'platinum' => '#E5E4E2',
            'diamond' => '#B9F2FF',
        ];

        return $colors[$certification] ?? '#6c757d';
    }

    /**
     * Générer un numéro de certificat unique
     */
    private function generateCertificateNumber($soundId, $certification)
    {
        $prefix = strtoupper(substr($certification, 0, 2));
        $year = date('Y');
        $padded = str_pad($soundId, 6, '0', STR_PAD_LEFT);

        return "{$prefix}-{$year}-{$padded}";
    }
}
