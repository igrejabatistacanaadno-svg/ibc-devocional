import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'

// Public pages
import EntryPage            from '@/pages/public/EntryPage'
import HomePage             from '@/pages/public/HomePage'
import DevotionalPage       from '@/pages/public/DevotionalPage'
import DevotionalsListPage  from '@/pages/public/DevotionalsListPage'
import PrayerPage           from '@/pages/public/PrayerPage'
import AnnouncementsPage    from '@/pages/public/AnnouncementsPage'
import MorePage             from '@/pages/public/MorePage'
import TesourariaPage       from '@/pages/public/TesourariaPage'
import PixPage              from '@/pages/public/PixPage'
import CelulasPage          from '@/pages/public/CelulasPage'
import CelulaDetailPage     from '@/pages/public/CelulaDetailPage'
import CursosPage           from '@/pages/public/CursosPage'

// Admin pages
import AdminLoginPage        from '@/pages/admin/AdminLoginPage'
import AdminDashboardPage    from '@/pages/admin/AdminDashboardPage'
import NewDevotionalPage     from '@/pages/admin/NewDevotionalPage'
import AdminDevotionalsPage  from '@/pages/admin/AdminDevotionalsPage'
import AdminCommentsPage     from '@/pages/admin/AdminCommentsPage'
import AdminPrayerPage       from '@/pages/admin/AdminPrayerPage'
import AdminAnnouncementsPage       from '@/pages/admin/AdminAnnouncementsPage'
import EditDevotionalPage           from '@/pages/admin/EditDevotionalPage'
import AdminFinancialReportsPage    from '@/pages/admin/AdminFinancialReportsPage'
import AdminCelulasPage            from '@/pages/admin/AdminCelulasPage'
import AdminCursosPage             from '@/pages/admin/AdminCursosPage'

// Layouts
import MemberLayout from '@/components/layout/MemberLayout'
import AdminLayout  from '@/components/layout/AdminLayout'

// --- Guards ------------------------------------------------------------------
function RequireMember({ children }: { children: React.ReactNode }) {
  const { isChurchMember } = useAuth()
  return isChurchMember ? <>{children}</> : <Navigate to="/" replace />
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />
}

// --- App ---------------------------------------------------------------------
function AppRoutes() {
  const { isChurchMember } = useAuth()

  return (
    <Routes>
      {/* Entry */}
      <Route
        path="/"
        element={isChurchMember ? <Navigate to="/app" replace /> : <EntryPage />}
      />

      {/* Member area */}
      <Route path="/app" element={<RequireMember><MemberLayout /></RequireMember>}>
        <Route index element={<HomePage />} />
        <Route path="devocionais"         element={<DevotionalsListPage />} />
        <Route path="devocional/:id"      element={<DevotionalPage />} />
        <Route path="oracao"              element={<PrayerPage />} />
        <Route path="avisos"              element={<AnnouncementsPage />} />
        <Route path="mais"                element={<MorePage />} />
        <Route path="tesouraria"          element={<TesourariaPage />} />
        <Route path="pix"                 element={<PixPage />} />
        <Route path="celulas"             element={<CelulasPage />} />
        <Route path="celula/:slug"        element={<CelulaDetailPage />} />
        <Route path="cursos"              element={<CursosPage />} />
      </Route>

      {/* Admin area */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index                    element={<AdminDashboardPage />} />
        <Route path="devocionais"       element={<AdminDevotionalsPage />} />
        <Route path="nova-devocional"          element={<NewDevotionalPage />} />
        <Route path="editar-devocional/:id"    element={<EditDevotionalPage />} />
        <Route path="comentarios"       element={<AdminCommentsPage />} />
        <Route path="oracao"            element={<AdminPrayerPage />} />
        <Route path="avisos"            element={<AdminAnnouncementsPage />} />
        <Route path="tesouraria"        element={<AdminFinancialReportsPage />} />
        <Route path="celulas"           element={<AdminCelulasPage />} />
        <Route path="cursos"            element={<AdminCursosPage />} />
        {/* Stubs for future pages */}
        <Route path="musicas"           element={<div className="p-6 text-gray-500">Biblioteca musical - em breve</div>} />
        <Route path="notificacoes"      element={<div className="p-6 text-gray-500">Notificações - em breve</div>} />
        <Route path="configuracoes"     element={<div className="p-6 text-gray-500">Configurações - em breve</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
