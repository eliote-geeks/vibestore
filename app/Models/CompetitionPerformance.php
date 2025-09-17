<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionPerformance extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'participant_id',
        'title',
        'description',
        'audio_file_path',
        'audio_file_name',
        'duration_seconds',
        'file_size_kb',
        'status',
        'play_order',
        'recorded_at',
        'played_at',
        'metadata'
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'played_at' => 'datetime',
        'metadata' => 'array',
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
     * Scope pour filtrer par statut
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope pour filtrer par compétition
     */
    public function scopeForCompetition($query, $competitionId)
    {
        return $query->where('competition_id', $competitionId);
    }

    /**
     * Scope pour les performances approuvées
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope pour les performances en attente
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Obtenir l'URL publique du fichier audio
     */
    public function getAudioUrlAttribute()
    {
        return $this->audio_file_path ? asset('storage/' . $this->audio_file_path) : null;
    }

    /**
     * Formater la durée en minutes:secondes
     */
    public function getFormattedDurationAttribute()
    {
        $minutes = floor($this->duration_seconds / 60);
        $seconds = $this->duration_seconds % 60;
        return sprintf('%d:%02d', $minutes, $seconds);
    }
}
