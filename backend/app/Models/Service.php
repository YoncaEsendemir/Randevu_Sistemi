<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'duration_minutes', 'price', 'is_active'];

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    /** Hizmetin ait olduğu işletme (admin kullanıcı). */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}