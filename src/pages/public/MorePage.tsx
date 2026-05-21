import { useNavigate } from 'react-router-dom'
import { User, Bell, Smartphone, LogOut, ChevronRight, Trash2, Landmark, QrCode, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { unsubscribeFromPush } from '@/lib/pushNotifications'
import Card from '@/components/ui/Card'
import Header from '@/components/layout/Header'

export default function MorePage() {
  const { memberLogout } = useAuth()
  const navigate = useNavigate()
  const savedName = localStorage.getItem('ibc_comment_name') ?? ''

  const handleClearData = () => {
    if (confirm('Isso apagará seu nome salvo e preferências locais. Continuar?')) {
      localStorage.removeItem('ibc_comment_name')
      unsubscribeFromPush()
    }
  }

  const handleLogout = () => {
    if (confirm('Deseja sair do aplicativo?')) {
      memberLogout()
      navigate('/')
    }
  }

  const menuItems = [
    {
      section: 'Igreja',
      items: [
        {
          icon: Users,
          label: 'Células',
          sub: 'Grupos de célula da igreja',
          action: () => navigate('/app/celulas'),
        },
        {
          icon: Landmark,
          label: 'Tesouraria',
          sub: 'Relatórios financeiros da igreja',
          action: () => navigate('/app/tesouraria'),
        },
        {
          icon: QrCode,
          label: 'PIX / Dados Bancários',
          sub: 'Copiar chave PIX ou dados para transferência',
          action: () => navigate('/app/pix'),
        },
      ],
    },
    {
      section: 'Perfil',
      items: [
        {
          icon: User,
          label: savedName ? `Olá, ${savedName}` : 'Seu nome local',
          sub: savedName ? 'Nome usado nos comentários' : 'Será salvo ao comentar',
          action: undefined,
        },
        {
          icon: Bell,
          label: 'Notificações',
          sub: 'Gerenciar notificações push',
          action: undefined,
        },
      ],
    },
    {
      section: 'Instalar o app',
      items: [
        {
          icon: Smartphone,
          label: 'Instalar no Android',
          sub: 'Chrome ou Edge: Adicionar à tela inicial',
          action: () => navigate('/app/instalar/android'),
        },
        {
          icon: Smartphone,
          label: 'Instalar no iPhone',
          sub: 'Safari: Compartilhar > Adicionar a Tela de Inicio',
          action: () => navigate('/app/instalar/ios'),
        },
      ],
    },
    {
      section: 'Conta',
      items: [
        {
          icon: Trash2,
          label: 'Limpar dados locais',
          sub: 'Remove nome e preferências salvas',
          action: handleClearData,
        },
        {
          icon: LogOut,
          label: 'Sair',
          sub: 'Deslogar do aplicativo',
          action: handleLogout,
          danger: true,
        },
      ],
    },
  ]

  return (
    <div>
      <Header title="Mais" />
      <div className="px-4 pt-3 pb-6 space-y-5">
        {/* Church tag */}
        <Card padding="md" className="flex items-center gap-3 bg-gradient-to-r from-primary-800 to-primary-700">
          <img src="/icons/icon.svg" alt="IBC" className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div>
            <p className="font-bold text-white text-sm">Igreja Batista Canaã</p>
            <p className="text-primary-300 text-xs">@igrejabatistaibc</p>
          </div>
        </Card>

        {menuItems.map(({ section, items }) => (
          <div key={section}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{section}</p>
            <Card padding="none" className="divide-y divide-gray-100">
              {items.map(({ icon: Icon, label, sub, action, danger }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={!action}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors ${action ? 'hover:bg-gray-50 active:bg-gray-100' : 'cursor-default'} ${danger ? 'text-red-600' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-50' : 'bg-gray-100'}`}>
                    <Icon size={15} className={danger ? 'text-red-500' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${danger ? 'text-red-600' : 'text-gray-800'}`}>{label}</p>
                    {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
                  </div>
                  {action && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
                </button>
              ))}
            </Card>
          </div>
        ))}

        <p className="text-center text-gray-400 text-xs">IBC Devocional v1.0 - Igreja Batista Canaã</p>
      </div>
    </div>
  )
}
