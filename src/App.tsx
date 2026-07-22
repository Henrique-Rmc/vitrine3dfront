import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PlatformLandingPage from './pages/PlatformLandingPage'
import StorePage from './pages/StorePage'
import LoginPage from './pages/admin/LoginPage'
import RegisterPage from './pages/admin/RegisterPage'
import DashboardPage from './pages/admin/DashboardPage'
import ProductManagement from './pages/admin/ProductManagement'
import ProductFormPage from './pages/admin/ProductFormPage'
import AttributesPage from './pages/admin/AttributesPage'
import ProductTypesPage from './pages/admin/ProductTypesPage'
import SettingsPage from './pages/admin/SettingsPage'
import TermsOfUsePage from './pages/TermsOfUsePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ReportPage from './pages/ReportPage'
import BetaPage from './pages/BetaPage'

function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <Navigate to="/admin/products" replace /> : <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
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

          {/* ── Beta gate: public ── */}
          <Route path="/admin/register" element={<BetaPage />} />

          {/* ── Admin: public (only for guests) ── */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/register/k7m3p9r2" element={<RegisterPage />} />
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

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
