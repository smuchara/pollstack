<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PollProxy extends Model
{
    protected $fillable = [
        'poll_id',
        'user_id',
        'proxy_user_id',
        'created_by',
    ];

    public function poll()
    {
        return $this->belongsTo(Poll::class);
    }

    /**
     * The user who holds the original vote (Principal).
     */
    public function originalUser()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The user designated to vote on their behalf (Proxy).
     */
    public function proxyUser()
    {
        return $this->belongsTo(User::class, 'proxy_user_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
