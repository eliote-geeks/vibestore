<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Clip extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'tags',
        'video_path',
        'thumbnail_path',
        'duration',
        'views',
        'likes',
        'comments_count',
        'shares',
        'featured',
        'is_active',
        'credits',
        'user_id',
    ];

    protected $casts = [
        'tags' => 'array',
        'credits' => 'array',
        'featured' => 'boolean',
        'is_active' => 'boolean',
        'views' => 'integer',
        'likes' => 'integer',
        'comments_count' => 'integer',
        'shares' => 'integer',
    ];

    /**
     * Relation avec l'utilisateur (artiste)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec les commentaires
     */
    public function comments(): HasMany
    {
        return $this->hasMany(ClipComment::class);
    }

    /**
     * Relation avec les likes
     */
    public function clipLikes(): HasMany
    {
        return $this->hasMany(ClipLike::class);
    }

    /**
     * Relation avec les bookmarks
     */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(ClipBookmark::class);
    }

    /**
     * Scope pour les clips actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour les clips populaires
     */
    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    /**
     * Scope pour les clips par catégorie
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope pour rechercher des clips
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhereJsonContains('tags', $search);
        });
    }

    /**
     * Scope pour trier par popularité
     */
    public function scopePopular($query)
    {
        return $query->orderByDesc('views');
    }

    /**
     * Scope pour les clips récents
     */
    public function scopeRecent($query)
    {
        return $query->orderByDesc('created_at');
    }

    /**
     * Scope pour les clips tendances (derniers 7 jours avec beaucoup de vues)
     */
    public function scopeTrending($query)
    {
        return $query->where('created_at', '>=', now()->subDays(7))
                    ->where('views', '>=', 10000)
                    ->orderByDesc('views');
    }

    /**
     * Obtenir l'URL complète de la vidéo
     */
    public function getVideoUrlAttribute()
    {
        return $this->video_path ? Storage::url($this->video_path) : null;
    }

    /**
     * Obtenir l'URL complète de la miniature
     */
    public function getThumbnailUrlAttribute()
    {
        return $this->thumbnail_path ? Storage::url($this->thumbnail_path) : null;
    }

    /**
     * Déterminer le type de récompense basé sur les vues
     */
    public function getRewardTypeAttribute()
    {
        if ($this->views >= 1000000) {
            return 'Diamant';
        } elseif ($this->views >= 500000) {
            return 'Platine';
        } elseif ($this->views >= 100000) {
            return 'Or';
        } elseif ($this->views >= 50000) {
            return 'Argent';
        } elseif ($this->views >= 10000) {
            return 'Bronze';
        }
        return null;
    }

    /**
     * Incrémenter le nombre de vues
     */
    public function incrementViews()
    {
        $this->increment('views');

        // Vérifier si le clip devient populaire automatiquement
        if ($this->views >= 100000 && !$this->featured) {
            $this->update(['featured' => true]);
        }
    }

    /**
     * Incrémenter le nombre de likes
     */
    public function incrementLikes()
    {
        $this->increment('likes');
    }

    /**
     * Décrémenter le nombre de likes
     */
    public function decrementLikes()
    {
        $this->decrement('likes');
    }

    /**
     * Incrémenter le nombre de partages
     */
    public function incrementShares()
    {
        $this->increment('shares');
    }

    /**
     * Formater le nombre de vues
     */
    public function getFormattedViewsAttribute()
    {
        if ($this->views >= 1000000) {
            return round($this->views / 1000000, 1) . 'M';
        } elseif ($this->views >= 1000) {
            return round($this->views / 1000, 1) . 'K';
        }
        return (string) $this->views;
    }

    /**
     * Vérifier si l'utilisateur a liké ce clip
     */
    public function isLikedBy($userId)
    {
        return $this->clipLikes()->where('user_id', $userId)->exists();
    }

    /**
     * Obtenir les clips similaires
     */
    public function getSimilarClips($limit = 5)
    {
        return self::where('category', $this->category)
                   ->where('id', '!=', $this->id)
                   ->where('is_active', true)
                   ->orderByDesc('views')
                   ->limit($limit)
                   ->get();
    }

    /**
     * Vérifier si l'utilisateur a mis ce clip en bookmark
     */
    public function isBookmarkedBy($userId)
    {
        return $this->bookmarks()->where('user_id', $userId)->exists();
    }
}
