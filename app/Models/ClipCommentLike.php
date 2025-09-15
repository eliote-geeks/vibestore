<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClipCommentLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'clip_comment_id',
        'user_id',
    ];

    public function comment()
    {
        return $this->belongsTo(ClipComment::class, 'clip_comment_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
