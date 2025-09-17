<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CommissionSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'description',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Obtenir le taux de commission par clé
     */
    public static function getRate(string $key): float
    {
        return Cache::remember("commission_rate_{$key}", 3600, function () use ($key) {
            $setting = self::where('key', $key)->where('is_active', true)->first();
            return $setting ? (float) $setting->value : 0.0;
        });
    }

    /**
     * Mettre à jour ou créer un taux de commission
     */
    public static function updateRate(string $key, float $rate): bool
    {
        try {
            self::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $rate,
                    'is_active' => true,
                    'updated_at' => now()
                ]
            );
            return true;
        } catch (\Exception $e) {
            Log::error("Erreur lors de la mise à jour du taux {$key}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Méthode simplifiée pour obtenir une valeur
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = self::where('key', $key)->where('is_active', true)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Méthode simplifiée pour définir une valeur
     */
    public static function setValue(string $key, $value): bool
    {
        try {
            self::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'is_active' => true,
                    'updated_at' => now()
                ]
            );
            return true;
        } catch (\Exception $e) {
            Log::error("Erreur lors de la définition de {$key}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtenir tous les taux de commission actifs
     */
    public static function getAllRates(): array
    {
        return Cache::remember('all_commission_rates', 3600, function () {
            return self::where('is_active', true)
                ->pluck('value', 'key')
                ->toArray();
        });
    }

    /**
     * Désactiver un taux de commission
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
        Cache::forget("commission_rate_{$this->key}");
        Cache::forget('all_commission_rates');
    }

    /**
     * Activer un taux de commission
     */
    public function activate(): void
    {
        $this->update(['is_active' => true]);
        Cache::forget("commission_rate_{$this->key}");
        Cache::forget('all_commission_rates');
    }

    /**
     * Scope pour les paramètres actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Obtenir le nom formaté de la commission
     */
    public function getDisplayNameAttribute(): string
    {
        return match($this->key) {
            'sound_commission' => 'Commission sur les sons',
            'event_commission' => 'Commission sur les événements',
            default => $this->description ?: $this->key,
        };
    }

    /**
     * Formater la valeur avec le symbole %
     */
    public function getFormattedValueAttribute(): string
    {
        return $this->value . '%';
    }

    /**
     * Event handlers pour vider le cache
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($model) {
            Cache::forget("commission_rate_{$model->key}");
            Cache::forget('all_commission_rates');
        });

        static::deleted(function ($model) {
            Cache::forget("commission_rate_{$model->key}");
            Cache::forget('all_commission_rates');
        });
    }
}
