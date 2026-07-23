import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import SuperadminLayout from './layouts/SuperadminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PlatformLandingPage from './pages/PlatformLandingPage'
import StorePage from './pages/StorePage'
import LoginPage from './pages/admin/LoginPage'
import RegisterPage from './pages/admin/RegisterPage'
import AffiliateRegisterPage from './pages/admin/AffiliateRegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/admin/DashboardPage'
import ProductManagement from './pages/admin/ProductManagement'
import ProductFormPage from './pages/admin/ProductFormPage'
import AttributesPage from './pages/admin/AttributesPage'
import ProductTypesPage from './pages/admin/ProductTypesPage'
import SettingsPage from './pages/admin/SettingsPage'
import TermsOfUsePage from './pages/TermsOfUsePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ReportPage from './pages/ReportPage'
import SuperadminStoresPage from './pages/superadmin/StoresPage'
import SuperadminStatsPage from './pages/superadmin/StatsPage'
import OnboardingPage from './pages/admin/OnboardingPage'

function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <Navigate to="/admin/products" replace /> : <Outlet />
}

function AdminOnlyRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/admin/products" replace />
  return <Outlet />
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  return (
    <GoogleOAuthProvider clientId={googleClientId ?? ''}>
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* ── Platform landing ── */}
          <Route path="/" element={<PlatformLandingPage />} />

          {/* ── Public storefront + legal pages ── */}
          <Route element={<MainLayout />}>
            <Route path="/:storeSlug" element={<StorePage />} />
            <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
            <Route path="/privacidade" element={<PrivacyPolicyPage />} />
            <Route path="/denunciar" element={<ReportPage />} />
          </Route>

          {/* ── Email verification (public) ── */}
          <Route path="/verificar-email" element={<VerifyEmailPage />} />

          {/* ── Affiliate secret registration (public) ── */}
          <Route path="/admin/cadastro-parceiro/a8f2x1m5" element={<AffiliateRegisterPage />} />

          {/* ── Admin: public (only for guests) ── */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/register" element={<RegisterPage />} />
          </Route>

          {/* ── Onboarding (protected, own full-screen layout) ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* ── Admin: protected (requires auth) ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/products" element={<ProductManagement />} />
              <Route path="/admin/products/new" element={<ProductFormPage />} />
              <Route path="/admin/products/edit/:id" element={<ProductFormPage />} />
              <Route path="/admin/attributes" element={<AttributesPage />} />
              <Route path="/admin/product-types" element={<ProductTypesPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* ── Superadmin: ADMIN role only ── */}
          <Route element={<AdminOnlyRoute />}>
            <Route element={<SuperadminLayout />}>
              <Route path="/superadmin" element={<Navigate to="/superadmin/lojas" replace />} />
              <Route path="/superadmin/lojas" element={<SuperadminStoresPage />} />
              <Route path="/superadmin/stats" element={<SuperadminStatsPage />} />
            </Route>
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
