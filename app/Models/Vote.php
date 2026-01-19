<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    protected $fillable = [
        'poll_id',
        'poll_option_id',
        'user_id',
        'proxy_user_id',
        'ip_address',
        'verification_type',
    ];

    public function poll()
    {
        return $this->belongsTo(Poll::class);
    }

    public function option()
    {
        return $this->belongsTo(PollOption::class, 'poll_option_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function proxyUser()
    {
        return $this->belongsTo(User::class, 'proxy_user_id');
    }
}
