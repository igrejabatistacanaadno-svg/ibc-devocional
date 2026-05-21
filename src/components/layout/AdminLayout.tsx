import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Mic, Music, MessageSquare,
  Heart, Bell, Megaphone, Settings, LogOut, Menu, X, Landmark, Users,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

const adminNav = [
  { to: '/admin',                  label: 'Dashboard',         icon: LayoutDashboard, end: true },
  { to: '/admin/devocionais',      label: 'Devocionais',       icon: BookOpen         },
  { to: '/admin/nova-devocional',  label: 'Nova devocional',   icon: Mic              },
  { to: '/admin/musicas',          label: 'Biblioteca musical',icon: Music            },
  { to: '/admin/comentarios',      label: 'Comentários',       icon: MessageSquare    },
  { to: '/admin/oracao',           label: 'Pedidos de oração', icon: Heart            },
  { to: '/admin/avisos',           label: 'Avisos',            icon: Megaphone        },
  { to: '/admin/tesouraria',       label: 'Tesouraria',        icon: Landmark         },
  { to: '/admin/celulas',          label: 'Células',           icon: Users            },
  { to: '/admin/notificacoes',     label: 'Notificações',      icon: Bell             },
  { to: '/admin/configuracoes',    label: 'Configurações',     icon: Settings         },
]

export default function AdminLayout() {
  const { adminLogout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    adminLogout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white flex flex-col
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-primary-800">
          <img src="/icons/icon.svg" alt="IBC" className="w-9 h-9 rounded-xl flex-shrink-0" />
          <div>
            <p className="font-bold text-sm text-white">IBC Devocional</p>
            <p className="text-xs text-primary-300">Painel Administrativo</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X size={18} className="text-primary-300" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {adminNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bw-primary-800 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-primary-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-primary-200 hover:bg-primary-800 hover:text-white transition-colors"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <img src="/icons/icon.svg" alt="IBC" className="w-7 h-7 rounded-lg flex-shrink-0" />
          <span className="font-semibold text-gray-800 text-sm">Admin</span>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
