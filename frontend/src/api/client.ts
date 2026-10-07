import axios from 'axios';

// Adres .env dosyasındaki VITE_API_URL'den okunuyor, kodun içine
// sabit yazılmıyor - yayına alırken tek satır değiştirmek yeterli olacak.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
});

// Tarayıcıda kayıtlı bir token varsa, her isteğe otomatik olarak
// "Authorization: Bearer <token>" header'ı ekleniyor.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token geçersiz veya süresi dolmuşsa (401), oturumu temizleyip
// kullanıcıyı otomatik olarak giriş sayfasına gönderiyoruz.
// 429 (hız sınırı aşıldı) için konsola okunabilir uyarı bırakıyoruz
// - UI tarafında istenirse toast ile gösterilebilir.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Zaten /giris veya /kayit'tayken yönlendirme döngüsüne girmemek için koruma.
      const path = window.location.pathname;
      if (path !== '/giris' && path !== '/kayit') {
        window.location.href = '/giris';
      }
    }

    if (status === 429) {
      // Backend throttle middleware'i tetiklendi. Retry-After header'ı saniye verir.
      const retryAfter = error.response?.headers?.['retry-after'];
      error.message = retryAfter
        ? `Çok fazla istek. ${retryAfter} saniye sonra tekrar deneyin.`
        : 'Çok fazla istek. Lütfen biraz bekleyin.';
    }

    return Promise.reject(error);
  },
);

export default apiClient;