<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'seller_id',
        'sound_id',
        'event_id',
        'competition_id',
        'amount',
        'seller_amount',
        'commission_amount',
        'commission_rate',
        'type',
        'status',
        'payment_method',
        'payment_provider',
        'transaction_id',
        'external_payment_id',
        'failure_reason',
        'metadata',
        'paid_at',
        'refunded_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'seller_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'metadata' => 'array',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur (acheteur)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec le vendeur
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    /**
     * Relation avec le son
     */
    public function sound(): BelongsTo
    {
        return $this->belongsTo(Sound::class);
    }

    /**
     * Relation avec l'événement
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Relation avec la compétition
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * Calculer les montants de commission
     */
    public static function calculateCommission(float $amount, string $type): array
    {
        $commissionRate = CommissionSetting::getRate($type . '_commission');
        $commissionAmount = ($amount * $commissionRate) / 100;
        $sellerAmount = $amount - $commissionAmount;

        return [
            'commission_rate' => $commissionRate,
            'commission_amount' => round($commissionAmount, 2),
            'seller_amount' => round($sellerAmount, 2),
        ];
    }

    /**
     * Créer un nouveau paiement avec calcul automatique des commissions
     */
    public static function createPayment(array $data): self
    {
        $commission = self::calculateCommission($data['amount'], $data['type']);

        return self::create(array_merge($data, $commission, [
            'transaction_id' => 'TXN_' . time() . '_' . rand(1000, 9999),
            'status' => 'pending',
        ]));
    }

    /**
     * Marquer le paiement comme complété
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'paid_at' => now(),
        ]);
    }

    /**
     * Marquer le paiement comme échoué
     */
    public function markAsFailed(string $reason): void
    {
        $this->update([
            'status' => 'failed',
            'failure_reason' => $reason,
        ]);
    }

    /**
     * Rembourser le paiement
     */
    public function refund(): void
    {
        $this->update([
            'status' => 'refunded',
            'refunded_at' => now(),
        ]);
    }

    /**
     * Scopes pour les requêtes
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeRefunded($query)
    {
        return $query->where('status', 'refunded');
    }

    public function scopeSounds($query)
    {
        return $query->where('type', 'sound');
    }

    public function scopeEvents($query)
    {
        return $query->where('type', 'event');
    }

    public function scopeCompetitions($query)
    {
        return $query->where('type', 'competition_entry');
    }

    /**
     * Obtenir le nom du produit acheté
     */
    public function getProductNameAttribute(): string
    {
        if ($this->type === 'sound' && $this->sound) {
            return $this->sound->title;
        }

        if ($this->type === 'event' && $this->event) {
            return $this->event->title;
        }

        if ($this->type === 'competition_entry' && $this->competition) {
            return 'Inscription: ' . $this->competition->title;
        }

        return 'Produit inconnu';
    }

    /**
     * Obtenir le statut formaté
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'En attente',
            'completed' => 'Complété',
            'failed' => 'Échoué',
            'refunded' => 'Remboursé',
            'cancelled' => 'Annulé',
            default => $this->status,
        };
    }
}
