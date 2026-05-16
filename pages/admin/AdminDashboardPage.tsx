import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, MessageSquare, Bell, Plus, TrendingUp, Heart, Mic } from 'lucide-react'
import { dashboardApi } from '@/lib/supabase'
import type { DashboardStats } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const mockStats: DashboardStats = {
  devotionalToday: true,
  totalDevotionals: 3,
  pendingComments: 2,
  approvedComments: 7,
  pushSubscribers: 18,
  lastNotificationSent: new Date().toISOString(),
}

const useMock = !import.meta.env.VITE_SUPABASE_URL

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (useMock) {
      setStats(mockStats)
    } else {
      dashboardApi.getStats().then(({ data }) => data && setStats(data))
    }
  }, [])

  const statCards = stats ? [
    { label: 'Devocional hoje', value: stats.devotionalToday ? ' Publicada' : ' Não publicada', icon: BookOpen, color: 'bg-primary-50 text-primary-700' },
    { label: 'Total de devocionais', value: stats.totalDevotionals, icon: TrendingUp, color: 'bg-mint-50 text-mint-700' },
    { label: 'Comentários pendentes', value: stats.pendingComments, icon: MessageSquare, color: 'bg-yellow-50 text-yellow-700', action: () => navigate('/admin/comentarios') },
    { label: 'Inscritos notificação', value: stats.pushSubscribers, icon: Bell, color: 'bg-blue-50 text-blue-700' },
    { label: 'Pedidos de oração', value: '-', icon: Heart, color: 'bg-red-50 text-red-700', action: () => navigate('/admin/oracao') },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Bem-vindo, pastor! 🙏</p>
        </div>
        <Button variant="gold" size="md" icon={<Plus size={16} />} onClick={() => navigate('/admin/nova-devocional')}>
          Nova devocional
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, action }) => (
          <Card
            key={label}
            padding="md"
            className={`${action ? 'cursor-pointer hover:shadow-card-hover' : ''} transition-shadow`}
            onClick={action}
          >
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-2`}>
              <Icon size={17} />
            </div>
            <p className="font-bold text-gray-900 text-lg leading-tight">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Nova devocional', icon: Mic, to: '/admin/nova-devocional', color: 'bg-primary-800' },
            { label: 'Comentários', icon: MessageSquare, to: '/admin/comentarios', color: 'bg-yellow-600' },
            { label: 'Pedidos de oração', icon: Heart, to: '/admin/oracao', color: 'bg-red-600' },
            { label: 'Enviar aviso', icon: Bell, to: '/admin/avisos', color: 'bg-mint-600' },
          ].map(({ label, icon: Icon, to, color }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`${color} text-white rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm active:scale-95 transition-transform`}
            >
              <Icon size={20} />
              <span className="font-semibold text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
