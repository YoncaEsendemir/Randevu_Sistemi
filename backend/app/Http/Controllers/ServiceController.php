<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * Sadece giriş yapan işletmenin hizmetlerini listele.
     */
    public function index(Request $request)
    {
        $services = Service::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($services);
    }

    /**
     * Yeni bir hizmet oluştur (ör. "Saç kesimi", 30 dk, 250 TL).
     * Hizmet, oluşturan işletmeye (user_id) bağlanır.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $service = Service::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($service, 201);
    }

    public function show(Request $request, Service $service)
    {
        $this->authorizeOwner($request, $service);

        return response()->json($service);
    }

    public function update(Request $request, Service $service)
    {
        $this->authorizeOwner($request, $service);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'duration_minutes' => 'sometimes|required|integer|min:1',
            'price' => 'sometimes|required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $service->update($validated);

        return response()->json($service);
    }

    public function destroy(Request $request, Service $service)
    {
        $this->authorizeOwner($request, $service);

        $service->delete();

        return response()->json(null, 204);
    }

    /** Hizmet başka bir işletmeye aitse 404 (varlığını sızdırmamak için). */
    private function authorizeOwner(Request $request, Service $service): void
    {
        if ($service->user_id !== $request->user()->id) {
            abort(404);
        }
    }
}
