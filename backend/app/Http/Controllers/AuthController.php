<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            // Password::min(8) -> en az 8 karakter
            // ->letters()->numbers() -> en az bir harf ve bir rakam zorunlu
            // Bu, "12345678" gibi zayıf şifreleri otomatik reddeder.
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'], // User modelindeki 'hashed' cast otomatik hash'liyor
            'phone' => $validated['phone'] ?? null,
            'role' => 'admin',
            // Public booking URL'i için otomatik benzersiz slug
            'slug' => $this->generateUniqueSlug($validated['name']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Girilen bilgiler hatalı.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Çıkış yapıldı']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Verilen isimden benzersiz bir slug türetir ("Ayşe Kuaför" → "ayse-kuafor").
     * Çakışırsa sonuna -2, -3 ... ekler.
     */
    private function generateUniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'isletme';
        $slug = $base;
        $i = 2;
        while (User::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }
        return $slug;
    }
}