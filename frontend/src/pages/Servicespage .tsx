import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Scissors, Search, Plus, Trash2, Clock, Tag } from 'lucide-react';
import { createService, deleteService, getServices } from '../api/services';
import type { Service } from '../types';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import Pagination from '../components/Pagination';
import { PageHeader } from './Customerspage';

const PAGE_SIZE = 9;

const inputClasses =
  'w-full rounded-xl border border-brand-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-brand-ink/40 focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/15 dark:border-line-dark dark:bg-surface-dark-2 dark:text-slate-100 dark:placeholder:text-slate-500';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({ name: '', duration_minutes: '30', price: '' });

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setIsLoading(true);
    try {
      setServices(await getServices());
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const created = await createService({
        name: form.name,
        duration_minutes: Number(form.duration_minutes),
        price: Number(form.price),
        is_active: true,
      });
      setServices((prev) => [created, ...prev]);
      setForm({ name: '', duration_minutes: '30', price: '' });
      setToast(`${created.name} hizmet listesine eklendi.`);
    } catch {
      setError('Hizmet eklenemedi. Bilgileri kontrol et.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await deleteService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    setToast('Hizmet silindi.');
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return services;
    return services.filter((s) => s.name.toLocaleLowerCase('tr').includes(q));
  }, [services, query]);

  useEffect(() => {
    setPage(1);
  }, [query, services.length]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Scissors}
        title="Hizmetler"
        subtitle={`${services.length} aktif hizmet`}
      />

      {/* Ekleme formu */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
            <Plus className="h-4 w-4 text-brand-teal" />
            Yeni hizmet ekle
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              placeholder="Hizmet adı (örn. Saç Kesimi)"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`${inputClasses} sm:col-span-3`}
            />
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
              <input
                placeholder="Süre (dakika)"
                type="number"
                min={1}
                required
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                className={`${inputClasses} pl-9`}
              />
            </div>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
              <input
                placeholder="Fiyat (TL)"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={`${inputClasses} pl-9`}
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-teal/25 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Hizmet ekle
            </button>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}
        </form>

        {isSaving && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm dark:bg-surface-dark/70">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Spinner />
              Kaydediliyor...
            </div>
          </div>
        )}
      </div>

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40 dark:text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hizmet ara"
          className={`${inputClasses} pl-10`}
        />
      </div>

      {/* Kart görünümü - tablo yerine kartlar daha görsel */}
      {isLoading ? (
        <div className="surface-card flex items-center gap-2 p-6 text-sm text-brand-ink/60 dark:text-slate-400">
          <Spinner className="h-4 w-4" />
          Yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-2 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-teal/10 text-brand-teal">
            <Scissors className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">
            {query ? 'Aramaya uygun hizmet bulunamadı.' : 'Henüz hizmet eklenmedi.'}
          </p>
          <p className="text-xs text-brand-ink/50 dark:text-slate-500">
            {query ? 'Farklı bir arama dene.' : 'Yukarıdaki formdan hızlıca ekleyebilirsin.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((s) => (
            <div
              key={s.id}
              className="surface-card group animate-fade-in-up flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-teal/10 text-brand-teal">
                  <Scissors className="h-5 w-5" />
                </div>
                <button
                  onClick={() => setPendingDeleteId(s.id)}
                  className="rounded-lg p-1.5 text-red-500 opacity-0 transition hover:bg-red-50 group-hover:opacity-100 dark:hover:bg-red-500/10"
                  aria-label="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.name}</h3>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-brand-ink/60 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {s.duration_minutes} dk
                </span>
                <span className="font-display text-lg font-bold text-brand-teal">
                  {Number(s.price).toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onChange={setPage}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Hizmeti sil"
        message="Bu hizmeti silmek istediğine emin misin? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
