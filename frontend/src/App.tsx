import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/Customerspage';
import ServicesPage from './pages/Servicespage ';
import AppointmentsPage from './pages/Appointmentspage';
import SettingsPage from './pages/SettingsPage';
import PublicBookingPage from './pages/PublicBookingPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/kayit" element={<RegisterPage />} />
          {/* Public booking - giriş gerektirmez, slug ile işletme sayfası */}
          <Route path="/randevu-al/:slug" element={<PublicBookingPage />} />

          {/* ProtectedRoute: giriş yoksa hiçbiri açılmaz.
              AppLayout: içindeki her sayfaya aynı üst menüyü sarar. */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/musteriler" element={<CustomersPage />} />
              <Route path="/hizmetler" element={<ServicesPage />} />
              <Route path="/randevular" element={<AppointmentsPage />} />
              <Route path="/ayarlar" element={<SettingsPage />} />
            </Route>
          </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
