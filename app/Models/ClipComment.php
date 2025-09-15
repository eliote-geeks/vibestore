<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClipComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'clip_id',
        'user_id',
        'content',
        'parent_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function clip()
    {
        return $this->belongsTo(Clip::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(ClipComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(ClipComment::class, 'parent_id');
    }

    public function likes()
    {
        return $this->hasMany(ClipCommentLike::class);
    }

    public function isLikedBy($userId)
    {
        return $this->likes()->where('user_id', $userId)->exists();
    }

    public function getLikesCountAttribute()
    {
        return $this->likes()->count();
    }

    public function incrementLikes()
    {
        // Pas besoin de colonne likes_count, on compte directement
        return $this->likes()->count();
    }

    public function decrementLikes()
    {
        // Pas besoin de colonne likes_count, on compte directement
        return $this->likes()->count();
    }
}
