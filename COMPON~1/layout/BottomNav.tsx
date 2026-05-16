import { NavLink } from 'react-router-dom'
import { Home, BookOpen, Heart, Bell, MoreHorizontal } from 'lucide-react'

const navItems = [
  { to: '/app',          label: 'Início',      icon: Home        },
  { to: '/app/devocionais', label: 'Devocionais', icon: BookOpen    },
  { to: '/app/oracao',   label: 'Oração',      icon: Heart       },
  { to: '/app/avisos',   label: 'Avisos',      icon: Bell        },
  { to: '/app/mais',     label: 'Mais',        icon: MoreHorizontal },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(13,38,85,0.06)] pb-safe">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors duration-150 ${
                isActive
                  ? 'text-primary-700'
                  : 'text-gray-400 hover:text-primary-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-xl transition-all duration-150 ${isActive ? 'bg-primary-50' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary-700' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
