<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'participant_id', 
        'user_id',
        'reaction_type',
        'reacted_at'
    ];

    protected $casts = [
        'reacted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec la compétition
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * Relation avec le participant
     */
    public function participant(): BelongsTo
    {
        return $this->belongsTo(CompetitionParticipant::class);
    }

    /**
     * Relation avec l'utilisateur
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope pour filtrer par type de réaction
     */
    public function scopeByType($query, $type)
    {
        return $query->where('reaction_type', $type);
    }

    /**
     * Scope pour filtrer par participant
     */
    public function scopeForParticipant($query, $participantId)
    {
        return $query->where('participant_id', $participantId);
    }

    /**
     * Scope pour filtrer par compétition
     */
    public function scopeForCompetition($query, $competitionId)
    {
        return $query->where('competition_id', $competitionId);
    }
}
