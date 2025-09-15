<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Event extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'user_id',
        'venue',
        'address',
        'city',
        'country',
        'event_date',
        'start_time',
        'end_time',
        'poster_image',
        'gallery_images',
        'category',
        'status',
        'is_featured',
        'is_free',
        'ticket_price',
        'max_attendees',
        'current_attendees',
        'artists',
        'sponsors',
        'requirements',
        'contact_phone',
        'contact_email',
        'website_url',
        'social_links',
        'location',
        'artist',
        'price_min',
        'price_max',
        'capacity',
        'featured_image',
        'tickets',
        'facebook_url',
        'instagram_url',
        'twitter_url',
        'views_count',
        'featured'
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
            'event_date' => 'date',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'is_featured' => 'boolean',
            'is_free' => 'boolean',
            'gallery_images' => 'array',
            'artists' => 'array',
            'sponsors' => 'array',
            'social_links' => 'array',
            'ticket_price' => 'decimal:2',
        'price_min' => 'decimal:2',
        'price_max' => 'decimal:2',
        'capacity' => 'integer',
        'views_count' => 'integer',
        'featured' => 'boolean',
        'tickets' => 'array'
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array<string, string>
     */
    protected $dates = [
        'event_date',
        'created_at',
        'updated_at'
    ];

    /**
     * Boot du modèle pour générer automatiquement le slug
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($event) {
            if (empty($event->slug)) {
                $event->slug = Str::slug($event->title);
            }
        });

        static::updating(function ($event) {
            if ($event->isDirty('title') && empty($event->slug)) {
                $event->slug = Str::slug($event->title);
            }
        });
    }

    /**
     * Relation vers l'utilisateur organisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation vers les paiements (ventes de billets pour cet événement)
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Utilisateurs qui ont aimé cet événement
     */
    public function likes()
    {
        return $this->belongsToMany(User::class, 'event_likes', 'event_id', 'user_id')
                    ->withTimestamps();
    }

    /**
     * Compter le nombre de likes
     */
    public function getLikesCountAttribute()
    {
        return $this->likes()->count();
    }

    /**
     * Scope pour les événements publiés
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope pour les événements à venir
     */
    public function scopeUpcoming($query)
    {
        return $query->where('event_date', '>=', now()->toDateString());
    }

    /**
     * Scope pour les événements en vedette
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope pour les événements gratuits
     */
    public function scopeFree($query)
    {
        return $query->where('is_free', true);
    }

    /**
     * Scope pour les événements actifs
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope pour filtrer par catégorie
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope pour filtrer par ville
     */
    public function scopeByCity($query, $city)
    {
        return $query->where('city', $city);
    }

    /**
     * Accesseur pour l'URL de l'affiche
     */
    public function getPosterImageUrlAttribute()
    {
        if ($this->poster_image) {
            return asset('storage/' . $this->poster_image);
        }

        // Image par défaut
        return "https://ui-avatars.com/api/?name=" . urlencode($this->title) . "&color=7F9CF5&background=EBF4FF&size=400";
    }

    /**
     * Accesseur pour les URLs des images de galerie
     */
    public function getGalleryImageUrlsAttribute()
    {
        if (!$this->gallery_images) {
            return [];
        }

        return array_map(function ($image) {
            return asset('storage/' . $image);
        }, $this->gallery_images);
    }

    /**
     * Accesseur pour la date formatée
     */
    public function getFormattedDateAttribute()
    {
        return $this->event_date->format('d/m/Y');
    }

    /**
     * Accesseur pour l'heure formatée
     */
    public function getFormattedTimeAttribute()
    {
        $start = Carbon::parse($this->start_time)->format('H:i');

        if ($this->end_time) {
            $end = Carbon::parse($this->end_time)->format('H:i');
            return $start . ' - ' . $end;
        }

        return $start;
    }

    /**
     * Accesseur pour le prix formaté
     */
    public function getFormattedPriceAttribute()
    {
        if ($this->is_free) {
            return 'Gratuit';
        }

        return number_format($this->ticket_price, 0, ',', ' ') . ' XAF';
    }

    /**
     * Accesseur pour le statut de disponibilité
     */
    public function getAvailabilityStatusAttribute()
    {
        if ($this->max_attendees && $this->current_attendees >= $this->max_attendees) {
            return 'sold_out';
        }

        if ($this->event_date < now()->toDateString()) {
            return 'past';
        }

        return 'available';
    }

    /**
     * Accesseur pour le pourcentage de places vendues
     */
    public function getTicketsSoldPercentageAttribute()
    {
        if (!$this->max_attendees) {
            return 0;
        }

        return round(($this->current_attendees / $this->max_attendees) * 100, 1);
    }

    /**
     * Vérifier si l'événement est complet
     */
    public function isSoldOut()
    {
        return $this->max_attendees && $this->current_attendees >= $this->max_attendees;
    }

    /**
     * Vérifier si l'événement est passé
     */
    public function isPast()
    {
        return $this->event_date < now()->toDateString();
    }

    /**
     * Incrémenter le nombre de participants
     */
    public function incrementAttendees($count = 1)
    {
        $this->increment('current_attendees', $count);
    }

    /**
     * Accessor pour l'URL de l'image principale
     */
    public function getFeaturedImageUrlAttribute()
    {
        if ($this->featured_image) {
            return asset('storage/' . $this->featured_image);
        }
        return null;
    }

    /**
     * Accessor pour le statut formaté
     */
    public function getStatusLabelAttribute()
    {
        $labels = [
            'pending' => 'En attente',
            'active' => 'Actif',
            'cancelled' => 'Annulé',
            'completed' => 'Terminé'
        ];

        return $labels[$this->status] ?? $this->status;
    }

    /**
     * Accessor pour la catégorie formatée
     */
    public function getCategoryLabelAttribute()
    {
        $labels = [
            'festival' => 'Festival',
            'concert' => 'Concert',
            'soiree' => 'Soirée',
            'showcase' => 'Showcase',
            'workshop' => 'Atelier'
        ];

        return $labels[$this->category] ?? $this->category;
    }

    /**
     * Mutator pour le slug
     */
    public function setTitleAttribute($value)
    {
        $this->attributes['title'] = $value;
        $this->attributes['slug'] = Str::slug($value);
    }

    /**
     * Incrémenter le nombre de vues
     */
    public function incrementViews()
    {
        $this->increment('views_count');
    }

    /**
     * Vérifier si l'événement est à venir
     */
    public function isUpcoming()
    {
        return $this->event_date >= now()->toDateString();
    }

    /**
     * Obtenir le prix minimum des billets
     */
    public function getMinTicketPrice()
    {
        if ($this->tickets && is_array($this->tickets)) {
            $prices = array_column($this->tickets, 'price');
            return min($prices);
        }
        return $this->price_min;
    }

    /**
     * Obtenir le prix maximum des billets
     */
    public function getMaxTicketPrice()
    {
        if ($this->tickets && is_array($this->tickets)) {
            $prices = array_column($this->tickets, 'price');
            return max($prices);
        }
        return $this->price_max;
    }
}
