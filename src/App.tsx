import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Platform landing ── */}
          <Route path="/" element={<PlatformLandingPage />} />

          {/* ── Public storefront (dynamic per seller) ── */}
          <Route element={<MainLayout />}>
            <Route path="/:storeSlug" element={<StorePage />} />
          </Route>

          {/* ── Admin: public ── */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/register" element={<RegisterPage />} />

          {/* ── Admin: protected (requires auth) ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/products" element={<ProductManagement />} />
              <Route path="/admin/products/new" element={<ProductFormPage />} />
              <Route path="/admin/products/edit/:id" element={<ProductFormPage />} />
            </Route>
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
