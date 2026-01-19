<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PollOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'poll_id',
        'text',
        'image_url',
        'name',
        'position',
        'order',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<string>
     */
    protected $appends = ['image_full_url'];

    /**
     * Get the poll that owns the option.
     */
    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    /**
     * Get the votes for this option.
     */
    public function votes()
    {
        return $this->hasMany(Vote::class, 'poll_option_id');
    }

    /**
     * Get the full URL for the option's image.
     */
    public function getImageFullUrlAttribute(): ?string
    {
        if (! $this->image_url) {
            return null;
        }

        return Storage::disk('public')->url($this->image_url);
    }

    /**
     * Check if this is a profile-type option (has image/name/position).
     */
    public function isProfileOption(): bool
    {
        return $this->image_url !== null || $this->name !== null || $this->position !== null;
    }
}
