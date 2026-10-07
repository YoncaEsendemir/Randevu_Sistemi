<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'phone', 'email', 'notes'];

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    /** Müşterinin ait olduğu işletme (admin kullanıcı). */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}