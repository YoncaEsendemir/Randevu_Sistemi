import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  UserPlus,
  Search,
  Users,
  Trash2,
  Phone as PhoneIcon,
  Mail,
  StickyNote,
} from 'lucide-react';
import { createCustomer, deleteCustomer, getCustomers } from '../api/customers';
import type { Customer } from '../types';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const inputClasses =
  'w-full rounded-xl border border-brand-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-brand-ink/40 focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/15 dark:border-line-dark dark:bg-surface-dark-2 dark:text-slate-100 dark:placeholder:text-slate-500';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setIsLoading(true);
    try {
      setCustomers(await getCustomers());
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const created = await createCustomer({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        notes: form.notes || null,
      });
      setCustomers((prev) => [created, ...prev]);
      setForm({ name: '', phone: '', email: '', notes: '' });
      setToast(`${created.name} müşteri listesine eklendi.`);
    } catch {
      setError('Müşteri eklenemedi. Telefon numarası daha önce kayıtlı olabilir.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setToast('Müşteri silindi.');
  }

  // Arama - isim/telefon/e-posta üzerinde harf duyarsız
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.email ?? '']
        .join(' ')
        .toLocaleLowerCase('tr')
        .includes(q),
    );
  }, [customers, query]);

  // Sayfalanmış görünüm - filtreleme değişince sayfa 1'e döneriz
  useEffect(() => {
    setPage(1);
  }, [query, customers.length]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Müşteriler"
        subtitle={`${customers.length} kayıtlı müşteri`}
      />

      {/* Ekleme formu */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
            <UserPlus className="h-4 w-4 text-brand-teal" />
            Yeni müşteri ekle
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Ad Soyad"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClasses}
            />
            <input
              placeholder="Telefon"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClasses}
            />
            <input
              placeholder="E-posta (opsiyonel)"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClasses}
            />
            <input
              placeholder="Not (opsiyonel)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={inputClasses}
            />
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-teal/25 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            Müşteri ekle
          </button>
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
          placeholder="Müşteri ara: isim, telefon veya e-posta"
          className={`${inputClasses} pl-10`}
        />
      </div>

      {/* Liste */}
      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-brand-ink/60 dark:text-slate-400">
            <Spinner className="h-4 w-4" />
            Yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyRow
            title={query ? 'Aramaya uygun müşteri bulunamadı.' : 'Henüz müşteri eklenmedi.'}
            hint={query ? 'Arama terimini kısaltmayı dene.' : 'Yukarıdaki formdan hızlıca ekleyebilirsin.'}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-line/60 text-xs font-medium uppercase tracking-wider text-brand-ink/50 dark:border-line-dark dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Müşteri</th>
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3">E-posta</th>
                <th className="px-5 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr
                  key={c.id}
                  className="animate-fade-in-up border-t border-brand-line/50 transition hover:bg-brand-mist/50 dark:border-line-dark/50 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-white">
                        {c.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        {c.notes && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-ink/50 dark:text-slate-500">
                            <StickyNote className="h-3 w-3" />
                            {c.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-brand-ink/80 dark:text-slate-300">
                      <PhoneIcon className="h-3.5 w-3.5 text-brand-ink/40" />
                      {c.phone}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {c.email ? (
                      <span className="inline-flex items-center gap-1.5 text-brand-ink/80 dark:text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-brand-ink/40" />
                        {c.email}
                      </span>
                    ) : (
                      <span className="text-brand-ink/30 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setPendingDeleteId(c.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onChange={setPage}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Müşteriyi sil"
        message="Bu müşteriyi silmek istediğine emin misin? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// --- Sayfaların hepsinde ortak kullanılacak küçük başlık şablonu ---
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Users;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-brand-teal/25">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-brand-ink/60 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyRow({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-teal/10 text-brand-teal">
        <Users className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-brand-ink/50 dark:text-slate-500">{hint}</p>
    </div>
  );
}
