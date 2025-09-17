<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'user_id',
        'status',
        'entry_fee_paid',
        'payment_status',
        'performance_file',
        'scores',
        'total_score',
        'position',
    ];

    protected $casts = [
        'scores' => 'array',
        'entry_fee_paid' => 'decimal:2',
        'total_score' => 'decimal:2',
        'position' => 'integer',
    ];

    /**
     * Relation avec la compétition
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * Relation avec l'utilisateur
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope pour les participants confirmés
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    /**
     * Scope pour les gagnants
     */
    public function scopeWinners($query)
    {
        return $query->where('status', 'winner')->orderBy('position');
    }

    /**
     * Vérifier si le participant a payé
     */
    public function hasPaidAttribute()
    {
        return $this->payment_status === 'paid';
    }

    /**
     * Obtenir le statut en français
     */
    public function getStatusLabelAttribute()
    {
        $statuses = [
            'registered' => 'Inscrit',
            'confirmed' => 'Confirmé',
            'disqualified' => 'Disqualifié',
            'winner' => 'Gagnant'
        ];

        return $statuses[$this->status] ?? 'Inconnu';
    }

    /**
     * Obtenir le statut de paiement en français
     */
    public function getPaymentStatusLabelAttribute()
    {
        $statuses = [
            'pending' => 'En attente',
            'paid' => 'Payé',
            'refunded' => 'Remboursé'
        ];

        return $statuses[$this->payment_status] ?? 'Inconnu';
    }

    /**
     * Calculer le score total à partir des scores par critère
     */
    public function calculateTotalScore()
    {
        if (!$this->scores) {
            return 0;
        }

        $totalScore = 0;
        $criteria = $this->competition->judging_criteria;

        foreach ($criteria as $criterion) {
            $criterionName = $criterion['name'];
            $weight = $criterion['weight'];
            $score = $this->scores[$criterionName] ?? 0;

            $totalScore += ($score * $weight) / 100;
        }

        return round($totalScore, 2);
    }

    /**
     * Mettre à jour le score total
     */
    public function updateTotalScore()
    {
        $this->update(['total_score' => $this->calculateTotalScore()]);
    }
}
