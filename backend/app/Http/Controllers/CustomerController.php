<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    /**
     * Sadece giriş yapan işletmenin müşterilerini, en yeniden başlayarak listele.
     */
    public function index(Request $request)
    {
        $customers = Customer::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($customers);
    }

    /**
     * Yeni bir müşteri kaydı oluştur (giriş yapan işletmeye bağlı).
     * Telefon benzersizliği işletme bazında kontrol edilir.
     */
    public function store(Request $request)
    {
        $userId = $request->user()->id;
        $this->normalizePhone($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => [
                'required', 'string', 'max:20',
                Rule::unique('customers', 'phone')->where('user_id', $userId),
            ],
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create([
            ...$validated,
            'user_id' => $userId,
        ]);

        return response()->json($customer, 201);
    }

    /**
     * Tek bir müşterinin detayını (geçmiş randevularıyla) getir.
     */
    public function show(Request $request, Customer $customer)
    {
        $this->authorizeOwner($request, $customer);

        $customer->load('appointments');

        return response()->json($customer);
    }

    /**
     * Var olan bir müşteriyi güncelle.
     */
    public function update(Request $request, Customer $customer)
    {
        $this->authorizeOwner($request, $customer);
        $this->normalizePhone($request);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            // Telefon benzersizliği: aynı işletme içinde, kendi kaydı hariç.
            'phone' => [
                'sometimes', 'required', 'string', 'max:20',
                Rule::unique('customers', 'phone')
                    ->where('user_id', $request->user()->id)
                    ->ignore($customer->id),
            ],
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
        ]);

        $customer->update($validated);

        return response()->json($customer);
    }

    /**
     * Bir müşteriyi sil.
     */
    public function destroy(Request $request, Customer $customer)
    {
        $this->authorizeOwner($request, $customer);

        $customer->delete();

        return response()->json(null, 204);
    }

    /** Müşteri başka bir işletmeye aitse 404. */
    private function authorizeOwner(Request $request, Customer $customer): void
    {
        if ($customer->user_id !== $request->user()->id) {
            abort(404);
        }
    }

    /**
     * Telefonu son 10 haneye indir (0/+90 ne olursa olsun "5551234567").
     * Public booking ile aynı format → aynı kişi iki kayıt olmaz, eşleşir.
     * Doğrulamadan önce çağrılır ki benzersizlik normalize değer üzerinden bakılsın.
     */
    private function normalizePhone(Request $request): void
    {
        if ($request->filled('phone')) {
            $request->merge([
                'phone' => substr(preg_replace('/\D/', '', $request->input('phone')), -10),
            ]);
        }
    }
}
