import { lazy, Suspense } from 'react'
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
import AffiliateInfoPage from './pages/admin/AffiliateInfoPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import TermsOfUsePage from './pages/TermsOfUsePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ReportPage from './pages/ReportPage'

// Admin/superadmin routes are behind auth, so they're safe to code-split —
// visitors who never log in never pay for this JS.
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'))
const ProductFormPage = lazy(() => import('./pages/admin/ProductFormPage'))
const AttributesPage = lazy(() => import('./pages/admin/AttributesPage'))
const ProductTypesPage = lazy(() => import('./pages/admin/ProductTypesPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const OnboardingPage = lazy(() => import('./pages/admin/OnboardingPage'))
const SuperadminStoresPage = lazy(() => import('./pages/superadmin/StoresPage'))
const SuperadminStatsPage = lazy(() => import('./pages/superadmin/StatsPage'))

// PDV
const PdvLayout = lazy(() => import('./pages/admin/pdv/PdvLayout'))
const PdvHomePage = lazy(() => import('./pages/admin/pdv/PdvHomePage'))
const PdvNovaVenda = lazy(() => import('./pages/admin/pdv/PdvNovaVenda'))
const PdvVendasPage = lazy(() => import('./pages/admin/pdv/PdvVendasPage'))
const PdvVendaDetalhePage = lazy(() => import('./pages/admin/pdv/PdvVendaDetalhePage'))
const PdvClientesPage = lazy(() => import('./pages/admin/pdv/PdvClientesPage'))
const PdvClienteDetalhePage = lazy(() => import('./pages/admin/pdv/PdvClienteDetalhePage'))
const PdvFuncionariosPage = lazy(() => import('./pages/admin/pdv/PdvFuncionariosPage'))
const PdvCaixaPage = lazy(() => import('./pages/admin/pdv/PdvCaixaPage'))
const PdvEstoquePage = lazy(() => import('./pages/admin/pdv/PdvEstoquePage'))

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
        <Suspense fallback={null}>
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
          </Route>

          {/* ── Register: open route — navigates away after auth commit ── */}
          <Route path="/admin/register" element={<RegisterPage />} />
          <Route path="/admin/afiliados" element={<AffiliateInfoPage />} />

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

            {/* ── PDV (own full-screen layout, no AdminLayout sidebar) ── */}
            <Route element={<PdvLayout />}>
              <Route path="/admin/pdv" element={<PdvHomePage />} />
              <Route path="/admin/pdv/nova-venda" element={<PdvNovaVenda />} />
              <Route path="/admin/pdv/vendas" element={<PdvVendasPage />} />
              <Route path="/admin/pdv/vendas/:id" element={<PdvVendaDetalhePage />} />
              <Route path="/admin/pdv/clientes" element={<PdvClientesPage />} />
              <Route path="/admin/pdv/clientes/:id" element={<PdvClienteDetalhePage />} />
              <Route path="/admin/pdv/funcionarios" element={<PdvFuncionariosPage />} />
              <Route path="/admin/pdv/caixa" element={<PdvCaixaPage />} />
              <Route path="/admin/pdv/estoque" element={<PdvEstoquePage />} />
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
        </Suspense>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
