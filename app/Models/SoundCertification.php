<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SoundCertification extends Model
{
    use HasFactory;

    protected $fillable = [
        'sound_id',
        'certification_type',
        'threshold_reached',
        'achieved_at',
        'metric_value',
        'certificate_number',
        'is_active'
    ];

    protected $casts = [
        'achieved_at' => 'datetime',
        'is_active' => 'boolean'
    ];

    public function sound()
    {
        return $this->belongsTo(Sound::class);
    }

    public function getCertificationColorAttribute()
    {
        $colors = [
            'bronze' => '#CD7F32',
            'silver' => '#C0C0C0',
            'gold' => '#FFD700',
            'platinum' => '#E5E4E2',
            'diamond' => '#B9F2FF'
        ];

        return $colors[$this->certification_type] ?? '#6c757d';
    }

    public function getCertificationLabelAttribute()
    {
        $labels = [
            'bronze' => 'Disque de Bronze',
            'silver' => 'Disque d\'Argent',
            'gold' => 'Disque d\'Or',
            'platinum' => 'Disque de Platine',
            'diamond' => 'Disque de Diamant'
        ];

        return $labels[$this->certification_type] ?? 'Aucune certification';
    }

    public static function getCertificationThresholds()
    {
        return [
            'bronze' => 1000,
            'silver' => 5000,
            'gold' => 10000,
            'platinum' => 50000,
            'diamond' => 100000
        ];
    }

    public static function calculateCertification($metricValue)
    {
        $thresholds = self::getCertificationThresholds();

        if ($metricValue >= $thresholds['diamond']) {
            return 'diamond';
        } elseif ($metricValue >= $thresholds['platinum']) {
            return 'platinum';
        } elseif ($metricValue >= $thresholds['gold']) {
            return 'gold';
        } elseif ($metricValue >= $thresholds['silver']) {
            return 'silver';
        } elseif ($metricValue >= $thresholds['bronze']) {
            return 'bronze';
        }

        return null;
    }

    public static function getNextLevel($currentMetric)
    {
        $thresholds = self::getCertificationThresholds();

        foreach ($thresholds as $level => $threshold) {
            if ($currentMetric < $threshold) {
                return [
                    'level' => $level,
                    'threshold' => $threshold,
                    'progress' => ($currentMetric / $threshold) * 100
                ];
            }
        }

        return null; // Niveau maximum atteint
    }

    public static function generateCertificateNumber()
    {
        $date = now()->format('Ymd');
        $count = self::whereDate('created_at', today())->count() + 1;
        return 'CERT-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
