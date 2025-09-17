<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'competition_id',
        'organizer_id',
        'amount',
        'organizer_amount',
        'commission_amount',
        'commission_rate',
        'payment_method',
        'payment_provider',
        'transaction_id',
        'external_payment_id',
        'status',
        'failure_reason',
        'currency',
        'metadata',
        'paid_at',
        'refunded_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'organizer_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'metadata' => 'array',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur (participant)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec la compétition
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * Relation avec l'organisateur
     */
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    /**
     * Calculer les montants de commission
     */
    public static function calculateCommission(float $amount): array
    {
        // Taux de commission fixe pour les compétitions (ex: 10%)
        $commissionRate = 10.0;
        $commissionAmount = ($amount * $commissionRate) / 100;
        $organizerAmount = $amount - $commissionAmount;

        return [
            'commission_rate' => $commissionRate,
            'commission_amount' => round($commissionAmount, 2),
            'organizer_amount' => round($organizerAmount, 2),
        ];
    }

    /**
     * Créer un nouveau paiement avec calcul automatique des commissions
     */
    public static function createPayment(array $data): self
    {
        $commission = self::calculateCommission($data['amount']);

        return self::create(array_merge($data, $commission, [
            'transaction_id' => 'COMP_' . time() . '_' . rand(1000, 9999),
            'status' => 'pending',
            'currency' => 'XAF',
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

    public function scopeByCompetition($query, $competitionId)
    {
        return $query->where('competition_id', $competitionId);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Obtenir le statut formaté
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'En attente',
            'completed' => 'Paiement réussi',
            'failed' => 'Échec du paiement',
            'refunded' => 'Remboursé',
            'cancelled' => 'Annulé',
            default => $this->status,
        };
    }

    /**
     * Obtenir le montant formaté
     */
    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 0, ',', ' ') . ' XAF';
    }

    /**
     * Vérifier si le paiement peut être remboursé
     */
    public function canBeRefunded(): bool
    {
        return $this->status === 'completed' &&
               $this->paid_at &&
               $this->paid_at->diffInDays(now()) <= 30; // Remboursement possible dans les 30 jours
    }

    /**
     * Obtenir la description du paiement
     */
    public function getDescriptionAttribute(): string
    {
        return "Inscription à la compétition: {$this->competition->title}";
    }
}
