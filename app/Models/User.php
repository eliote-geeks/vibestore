<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Jetstream\HasProfilePhoto;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    use HasProfilePhoto;
    use Notifiable;
    use TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'bio',
        'location',
        'status',
        'last_login_at',
        'profile_photo_path',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'profile_photo_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Scope pour filtrer par rôle
     */
    public function scopeRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope pour filtrer par statut
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Vérifier si l'utilisateur est un artiste
     */
    public function isArtist()
    {
        return $this->role === 'artist';
    }

    /**
     * Vérifier si l'utilisateur est un producteur
     */
    public function isProducer()
    {
        return $this->role === 'producer';
    }

    /**
     * Vérifier si l'utilisateur est un administrateur
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Vérifier si l'utilisateur est actif
     */
    public function isActive()
    {
        return $this->status === 'active';
    }

    /**
     * Obtenir le nom d'affichage du rôle
     */
    public function getRoleDisplayNameAttribute()
    {
        $roles = [
            'user' => 'Utilisateur',
            'artist' => 'Artiste',
            'producer' => 'Producteur',
            'admin' => 'Administrateur'
        ];

        return $roles[$this->role] ?? 'Utilisateur';
    }

    /**
     * Obtenir le nom d'affichage du statut
     */
    public function getStatusDisplayNameAttribute()
    {
        $statuses = [
            'active' => 'Actif',
            'suspended' => 'Suspendu',
            'pending' => 'En attente'
        ];

        return $statuses[$this->status] ?? 'Actif';
    }

    /**
     * Obtenir l'URL de la photo de profil personnalisée
     */
    public function getProfilePhotoUrlAttribute()
    {
        if ($this->profile_photo_path) {
            return asset('storage/' . $this->profile_photo_path);
        }

        // Générer une photo par défaut avec les initiales
        $initials = strtoupper(substr($this->name, 0, 1));
        return "https://ui-avatars.com/api/?name=" . urlencode($this->name) . "&color=7F9CF5&background=EBF4FF&size=200";
    }

    /**
     * Sons créés par l'utilisateur
     */
    public function sounds()
    {
        return $this->hasMany(Sound::class);
    }

    /**
     * Événements créés par l'utilisateur
     */
    public function events()
    {
        return $this->hasMany(Event::class);
    }

    /**
     * Clips créés par l'utilisateur
     */
    public function clips()
    {
        return $this->hasMany(Clip::class);
    }

    /**
     * Compétitions créées par l'utilisateur
     */
    public function competitions()
    {
        return $this->hasMany(Competition::class);
    }

    /**
     * Participations aux compétitions
     */
    public function competitionParticipations()
    {
        return $this->hasMany(CompetitionParticipant::class);
    }

    /**
     * Compétitions auxquelles l'utilisateur participe
     */
    public function participatedCompetitions()
    {
        return $this->belongsToMany(Competition::class, 'competition_participants')
                    ->withPivot(['status', 'entry_fee_paid', 'payment_status', 'total_score', 'position'])
                    ->withTimestamps();
    }

    /**
     * Paiements effectués par l'utilisateur (en tant qu'acheteur)
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Paiements reçus par l'utilisateur (en tant que vendeur)
     */
    public function sales()
    {
        return $this->hasMany(Payment::class, 'seller_id');
    }

    /**
     * Utilisateurs que cet utilisateur suit
     */
    public function following()
    {
        return $this->belongsToMany(User::class, 'user_follows', 'follower_id', 'followed_id')
                    ->withTimestamps();
    }

    /**
     * Utilisateurs qui suivent cet utilisateur
     */
    public function followers()
    {
        return $this->belongsToMany(User::class, 'user_follows', 'followed_id', 'follower_id')
                    ->withTimestamps();
    }

    /**
     * Sons aimés par l'utilisateur
     */
    public function likedSounds()
    {
        return $this->belongsToMany(Sound::class, 'sound_likes', 'user_id', 'sound_id')
                    ->withTimestamps();
    }

    /**
     * Événements aimés par l'utilisateur
     */
    public function likedEvents()
    {
        return $this->belongsToMany(Event::class, 'event_likes', 'user_id', 'event_id')
                    ->withTimestamps();
    }

    /**
     * Sons achetés par l'utilisateur (via les paiements)
     */
    public function purchasedSounds()
    {
        return $this->belongsToMany(Sound::class, 'payments', 'user_id', 'sound_id')
                    ->wherePivot('type', 'sound')
                    ->wherePivot('status', 'completed')
                    ->withPivot(['amount', 'paid_at', 'transaction_id'])
                    ->withTimestamps();
    }

    /**
     * Événements pour lesquels l'utilisateur a acheté des billets
     */
    public function purchasedEvents()
    {
        return $this->belongsToMany(Event::class, 'payments', 'user_id', 'event_id')
                    ->wherePivot('type', 'event')
                    ->wherePivot('status', 'completed')
                    ->withPivot(['amount', 'paid_at', 'transaction_id'])
                    ->withTimestamps();
    }

    /**
     * Vérifier si cet utilisateur suit un autre utilisateur
     */
    public function isFollowing($userId)
    {
        return $this->following()->where('followed_id', $userId)->exists();
    }

    /**
     * Suivre un utilisateur
     */
    public function follow($userId)
    {
        if (!$this->isFollowing($userId) && $this->id !== $userId) {
            $this->following()->attach($userId);
        }
    }

    /**
     * Ne plus suivre un utilisateur
     */
    public function unfollow($userId)
    {
        $this->following()->detach($userId);
    }

    /**
     * Obtenir le nombre total d'écoutes de tous les sons de l'utilisateur
     */
    public function getTotalPlaysAttribute()
    {
        return $this->sounds()->sum('plays_count');
    }

    /**
     * Obtenir le nombre total de likes de tous les sons de l'utilisateur
     */
    public function getTotalLikesAttribute()
    {
        return $this->sounds()->sum('likes_count');
    }

    /**
     * Obtenir le genre musical principal de l'utilisateur
     */
    public function getPrimaryGenreAttribute()
    {
        return $this->sounds()
                    ->selectRaw('genre, COUNT(*) as count')
                    ->groupBy('genre')
                    ->orderByDesc('count')
                    ->value('genre') ?? 'Non défini';
    }
}
