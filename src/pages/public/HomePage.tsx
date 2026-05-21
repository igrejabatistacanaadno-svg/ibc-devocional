import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, BookOpen, Bell, ChevronRight, Megaphone, Heart, Download, CheckCircle, BellOff, QrCode, Copy, Check, X, Users } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { devotionalsApi, announcementsApi } from '@/lib/supabase'
import { MOCK_DEVOTIONALS, MOCK_ANNOUNCEMENTS } from '@/lib/mockData'
import { subscribeToPush, isPushSubscribed, isPushSupported, isIOS } from '@/lib/pushNotifications'
import type { PushSubscribeResult } from '@/lib/pushNotifications'
import type { Devotional, Announcement } from '@/types'
import AudioPlayer from '@/components/devotional/AudioPlayer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

// Tipagem do evento de instalaÃ§Ã£o PWA (nÃ£o existe no lib padrÃ£o do TS)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const useMock = !import.meta.env.VITE_SUPABASE_URL

type PushStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error'

export default function HomePage() {
  const [todayDevotional, setTodayDevotional] = useState<Devotional | null>(null)
  const [recent, setRecent] = useState<Devotional[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle')
  const [pushErrorMsg, setPushErrorMsg] = useState<string>('')
  const [iosPrompt, setIosPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [appInstalled, setAppInstalled] = useState(false)
  const [showPix, setShowPix] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const navigate = useNavigate()

  // ââ PIX âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const PIX_KEY = '04.206.874/0001-50'
  const PIX_NAME = 'Igreja Batista CanaÃ£ - IBC'

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY)
    } catch {
      // Fallback para navegadores sem Clipboard API
      const el = document.createElement('textarea')
      el.value = PIX_KEY
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setPixCopied(true)
    setTimeout(() => setPixCopied(false), 3000)
  }

  useEffect(() => {
    // Dados
    if (useMock) {
      setTodayDevotional(MOCK_DEVOTIONALS[0])
      setRecent(MOCK_DEVOTIONALS.slice(1))
      setAnnouncements(MOCK_ANNOUNCEMENTS)
    } else {
      devotionalsApi.getToday().then(({ data }) => data && setTodayDevotional(data))
      devotionalsApi.getPublished().then(({ data }) => data && setRecent(data.slice(1, 4)))
      announcementsApi.getActive().then(({ data }) => data && setAnnouncements(data.slice(0, 3)))
    }

    // Estado inicial das notificaÃ§Ãµes
    isPushSubscribed().then(subscribed => {
      if (subscribed) setPushStatus('success')
    })

    // Captura o evento de instalaÃ§Ã£o PWA no Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const handleAppInstalled = () => {
      setAppInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Verifica se jÃ¡ estÃ¡ instalado (modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setAppInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // ââ Ativar notificaÃ§Ãµes push âââââââââââââââââââââââââââââââââââââââââââââââ
  const handlePushSubscribe = async () => {
    if (pushStatus === 'loading' || pushStatus === 'success') return

    // iOS fora do modo standalone â instruÃ§Ã£o para instalar o app
    if (isIOS() && !window.matchMedia('(display-mode: standalone)').matches) {
      setIosPrompt(true)
      return
    }

    // Navegador sem suporte â mostra mensagem clara
    if (!isPushSupported()) {
      setPushErrorMsg('Este navegador nÃ£o suporta notificaÃ§Ãµes push. Use o Chrome ou Edge no Android.')
      setPushStatus('error')
      return
    }

    // PermissÃ£o jÃ¡ negada pelo usuÃ¡rio nas configuraÃ§Ãµes do browser
    if (Notification.permission === 'denied') {
      setPushStatus('denied')
      return
    }

    setPushStatus('loading')
    setPushErrorMsg('')

    try {
      const result: PushSubscribeResult = await subscribeToPush()

      if (result.ok) {
        setPushStatus('success')
        // NotificaÃ§Ã£o local de boas-vindas
        const reg = await navigator.serviceWorker.ready
        reg.showNotification('Devocionais ativadas! ð', {
          body: 'VocÃª receberÃ¡ avisos quando uma nova devocional estiver disponÃ­vel.',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'ibc-welcome',
        })
      } else {
        // Traduz a causa do erro em mensagem amigÃ¡vel
        switch (result.reason) {
          case 'permission_denied':
            setPushStatus('denied')
            break
          case 'not_supported':
            setPushErrorMsg('Este navegador nÃ£o suporta notificaÃ§Ãµes push. Use o Chrome ou Edge.')
            setPushStatus('error')
            break
          case 'vapid_missing':
            setPushErrorMsg('ConfiguraÃ§Ã£o do servidor incompleta. Contate o administrador do app.')
            setPushStatus('error')
            break
          case 'sw_not_ready':
            setPushErrorMsg('NÃ£o foi possÃ­vel registrar o serviÃ§o em segundo plano. Recarregue o app e tente novamente.')
            setPushStatus('error')
            break
          default:
            setPushErrorMsg('NÃ£o foi possÃ­vel ativar. Verifique sua conexÃ£o e tente novamente.')
            setPushStatus('error')
        }
      }
    } catch {
      setPushErrorMsg('Erro inesperado. Verifique sua conexÃ£o e tente novamente.')
      setPushStatus('error')
    }
  }

  // ââ Instalar PWA âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleInstallApp = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setAppInstalled(true)
    setDeferredPrompt(null)
  }

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  // ââ Card de notificaÃ§Ãµes (estado dinÃ¢mico) âââââââââââââââââââââââââââââââââ
  const renderPushCard = () => {
    if (!isPushSupported() && !isIOS()) return null

    // iOS fora do app instalado
    if (iosPrompt) {
      return (
        <Card className="bg-primary-50 border border-primary-200" padding="md">
          <p className="font-semibold text-primary-800 text-sm mb-1">Instale o app no iPhone</p>
          <p className="text-xs text-primary-600">
            Toque em <strong>Compartilhar</strong> no Safari e depois em{' '}
            <strong>"Adicionar Ã  Tela de InÃ­cio"</strong> para ativar notificaÃ§Ãµes no iPhone.
          </p>
          <button onClick={() => setIosPrompt(false)} className="text-xs text-primary-400 mt-2">
            Fechar
          </button>
        </Card>
      )
    }

    // Ativado com sucesso
    if (pushStatus === 'success') {
      return (
        <Card className="bg-gradient-to-r from-green-600 to-green-500 text-white" padding="md">
          <div className="flex items-center gap-3">
            <CheckCircle size={22} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">NotificaÃ§Ãµes ativadas â</p>
              <p className="text-xs text-white/80">
                VocÃª serÃ¡ avisado quando houver nova devocional
              </p>
            </div>
          </div>
        </Card>
      )
    }

    // UsuÃ¡rio bloqueou as notificaÃ§Ãµes nas configuraÃ§Ãµes do browser
    if (pushStatus === 'denied') {
      return (
        <Card className="bg-amber-50 border border-amber-200" padding="md">
          <div className="flex items-start gap-3">
            <BellOff size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800 text-sm">NotificaÃ§Ãµes bloqueadas pelo navegador</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Para ativar: acesse as <strong>ConfiguraÃ§Ãµes do Chrome</strong> â
                Privacidade e seguranÃ§a â NotificaÃ§Ãµes â localize este site e clique em <strong>Permitir</strong>.
              </p>
            </div>
          </div>
        </Card>
      )
    }

    // Erro ao ativar â mostrar mensagem especÃ­fica + opÃ§Ã£o de tentar novamente
    if (pushStatus === 'error') {
      return (
        <Card className="bg-red-50 border border-red-200" padding="md">
          <div className="flex items-start gap-3">
            <Bell size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-700 text-sm">NÃ£o foi possÃ­vel ativar</p>
              <p className="text-xs text-red-500 mt-0.5">
                {pushErrorMsg || 'Verifique as permissÃµes e tente novamente'}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={handlePushSubscribe} className="flex-shrink-0">
              Tentar
            </Button>
          </div>
        </Card>
      )
    }

    // Estado padrÃ£o: idle ou loading â card verde com botÃ£o Ativar
    return (
      <Card
        className="bg-gradient-to-r from-mint-600 to-mint-500 text-white cursor-pointer active:opacity-90"
        padding="md"
        onClick={handlePushSubscribe}
      >
        <div className="flex items-center gap-3">
          <Bell size={22} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Receber devocionais</p>
            <p className="text-xs text-white/80">
              {pushStatus === 'loading'
                ? 'Aguardando permissÃ£o...'
                : 'Ative as notificaÃ§Ãµes para ser avisado todo dia'}
            </p>
          </div>
          <Button
            size="sm"
            variant="gold"
            loading={pushStatus === 'loading'}
            disabled={pushStatus === 'loading'}
            onClick={e => { e.stopPropagation(); handlePushSubscribe() }}
          >
            {pushStatus === 'loading' ? '' : 'Ativar'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-700 px-5 pt-12 pb-8">
        <p className="text-primary-200 text-sm mb-1 capitalize">{today}</p>
        <h1 className="text-white text-2xl font-bold mb-1">GraÃ§a e paz! ð</h1>
        <p className="text-primary-300 text-sm">Igreja Batista CanaÃ£ - IBC</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* Instalar PWA (Android / Chrome) */}
        {deferredPrompt && !appInstalled && (
          <Card className="bg-gradient-to-r from-primary-700 to-primary-600 text-white" padding="md">
            <div className="flex items-center gap-3">
              <Download size={22} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Instalar o app</p>
                <p className="text-xs text-white/80">Adicione Ã  tela inicial para acesso rÃ¡pido</p>
              </div>
              <Button size="sm" variant="gold" onClick={handleInstallApp}>
                Instalar
              </Button>
            </div>
          </Card>
        )}

        {/* Devocional do dia */}
        {todayDevotional ? (
          <Card padding="none" className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary-800 to-primary-900 p-4">
              <p className="text-primary-300 text-xs font-medium uppercase tracking-wider mb-1">Devocional de hoje</p>
              <h2 className="text-white font-bold text-lg leading-snug">{todayDevotional.title}</h2>
              <p className="text-gold-400 text-sm mt-1">{todayDevotional.bible_reference}</p>
            </div>

            <div className="p-4 space-y-3">
              {todayDevotional.mixed_audio_url || todayDevotional.original_audio_url ? (
                <AudioPlayer
                  src={(todayDevotional.mixed_audio_url ?? todayDevotional.original_audio_url)!}
                  title={todayDevotional.title}
                />
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<Play size={18} />}
                  onClick={() => navigate(`/app/devocional/${todayDevotional.id}`)}
                >
                  Ouvir devocional
                </Button>
              )}

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                icon={<BookOpen size={18} />}
                onClick={() => navigate(`/app/devocional/${todayDevotional.id}`)}
              >
                Ler devocional
              </Button>

              {/* ReaÃ§Ãµes */}
              <div className="flex gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <span>ð</span>
                  <span>{todayDevotional.reactions_count?.amen ?? 0} AmÃ©m</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <span>â¨</span>
                  <span>{todayDevotional.reactions_count?.edified ?? 0} Edificados</span>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card padding="md" className="text-center py-8">
            <p className="text-4xl mb-3">ð</p>
            <p className="text-gray-600 font-medium">Nenhuma devocional publicada hoje</p>
            <p className="text-gray-400 text-sm mt-1">Volte mais tarde</p>
          </Card>
        )}

        {/* Avisos */}
        {announcements.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Megaphone size={16} className="text-primary-700" /> Avisos
              </h3>
              <button onClick={() => navigate('/app/avisos')} className="text-primary-700 text-sm flex items-center gap-0.5">
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {announcements.map(a => (
                <Card key={a.id} padding="sm" className={`border-l-4 ${a.priority === 'important' ? 'border-gold-500' : a.priority === 'urgent' ? 'border-red-500' : 'border-primary-300'}`}>
                  <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{a.content}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Devocionais anteriores */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen size={16} className="text-primary-700" /> Devocionais anteriores
              </h3>
              <button onClick={() => navigate('/app/devocionais')} className="text-primary-700 text-sm flex items-center gap-0.5">
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {recent.map(d => (
                <Card
                  key={d.id}
                  padding="sm"
                  className="flex items-center gap-3 cursor-pointer active:bg-gray-50"
                  onClick={() => navigate(`/app/devocional/${d.id}`)}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-primary-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{d.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{d.bible_reference} Â· {format(new Date(d.publish_date), 'dd/MM', { locale: ptBR })}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* PIX da Igreja */}
        <Card
          padding="md"
          className="cursor-pointer active:opacity-90 bg-gradient-to-r from-primary-800 to-primary-700 text-white"
          onClick={() => setShowPix(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <QrCode size={20} className="text-gold-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-white">PIX da Igreja</p>
              <p className="text-white/70 text-xs mt-0.5">Toque para ver a chave e contribuir</p>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </div>
        </Card>

        {/* Pedidos de oraÃ§Ã£o */}
        <Card padding="md" className="cursor-pointer" onClick={() => navigate('/app/oracao')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Heart size={18} className="text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">Pedidos de oraÃ§Ã£o</p>
              <p className="text-gray-400 text-xs mt-0.5">Envie ou veja pedidos da comunidade</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </Card>

        {/* CÃ©lulas */}
        <Card
          padding="none"
          className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => navigate('/app/celulas')}
        >
          <div
            className="relative p-4 min-h-[90px] flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #1a3f7a 0%, #0d2654 100%)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
              ð¥
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">CÃ©lulas</p>
              <p className="text-white/70 text-xs mt-0.5">Homens Posicionados Â· Mulheres de ExcelÃªncia</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: '#c9a84c', color: '#1a1a1a' }}>
                Acessar
              </div>
              <ChevronRight size={16} className="text-white/40" />
            </div>
          </div>
        </Card>
      </div>

      {/* ââ Modal PIX âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {showPix && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => { setShowPix(false); setPixCopied(false) }}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            {/* Handle + fechar */}
            <div className="flex items-center justify-between mb-5">
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <p className="font-bold text-gray-900 text-base">PIX da Igreja</p>
              <button
                onClick={() => { setShowPix(false); setPixCopied(false) }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Card azul com Ã­cone PIX */}
            <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl p-5 mb-5 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <QrCode size={26} className="text-gold-400" />
                </div>
                <div>
                  <p className="font-bold text-base leading-tight">{PIX_NAME}</p>
                  <p className="text-primary-300 text-xs mt-0.5">ContribuiÃ§Ã£o Ã  Igreja</p>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl px-4 py-3">
                <p className="text-primary-300 text-xs mb-1 uppercase tracking-wider font-medium">Chave PIX (CNPJ)</p>
                <p className="text-white font-bold text-lg tracking-wider">{PIX_KEY}</p>
              </div>
            </div>

            {/* BotÃ£o copiar */}
            <button
              onClick={handleCopyPix}
              className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${
                pixCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-700 text-white hover:bg-primary-800'
              }`}
            >
              {pixCopied ? (
                <>
                  <Check size={20} />
                  Chave PIX copiada com sucesso!
                </>
              ) : (
                <>
                  <Copy size={20} />
                  Copiar chave PIX
                </>
              )}
            </button>

            <p className="text-center text-gray-400 text-xs mt-4 leading-relaxed">
              Abra o app do seu banco, escolha <strong>PIX</strong>,{' '}
              <strong>Pagar com chave</strong> e cole o CNPJ acima.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
