<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClipLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'clip_id',
        'user_id',
    ];

    public function clip()
    {
        return $this->belongsTo(Clip::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
