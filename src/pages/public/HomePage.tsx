import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, BookOpen, Bell, ChevronRight, Megaphone, Heart } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { devotionalsApi, announcementsApi } from '@/lib/supabase'
import { MOCK_DEVOTIONALS, MOCK_ANNOUNCEMENTS } from '@/lib/mockData'
import { subscribeToPush, isPushSubscribed, isPushSupported, isIOS } from '@/lib/pushNotifications'
import type { Devotional, Announcement } from '@/types'
import AudioPlayer from '@/components/devotional/AudioPlayer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const useMock = !import.meta.env.VITE_SUPABASE_URL

export default function HomePage() {
  const [todayDevotional, setTodayDevotional] = useState<Devotional | null>(null)
  const [recent, setRecent] = useState<Devotional[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [iosPrompt, setIosPrompt] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (useMock) {
      setTodayDevotional(MOCK_DEVOTIONALS[0])
      setRecent(MOCK_DEVOTIONALS.slice(1))
      setAnnouncements(MOCK_ANNOUNCEMENTS)
    } else {
      devotionalsApi.getToday().then(({ data }) => data && setTodayDevotional(data))
      devotionalsApi.getPublished().then(({ data }) => data && setRecent(data.slice(1, 4)))
      announcementsApi.getActive().then(({ data }) => data && setAnnouncements(data.slice(0, 3)))
    }
    isPushSubscribed().then(setPushSubscribed)
  }, [])

  const handlePushSubscribe = async () => {
    if (isIOS() && !('standalone' in navigator && (navigator as unknown as Record<string, unknown>).standalone)) {
      setIosPrompt(true)
      return
    }
    const ok = await subscribeToPush()
    if (ok) setPushSubscribed(true)
  }

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-700 px-5 pt-12 pb-8">
        <p className="text-primary-200 text-sm mb-1 capitalize">{today}</p>
        <h1 className="text-white text-2xl font-bold mb-1">Graça e paz! 🙏</h1>
        <p className="text-primary-300 text-sm">Igreja Batista Canaã — IBC</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Push notification prompt */}
        {isPushSupported() && !pushSubscribed && !iosPrompt && (
          <Card className="bg-gradient-to-r from-mint-600 to-mint-500 text-white" padding="md">
            <div className="flex items-center gap-3">
              <Bell size={22} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Receber devocionais</p>
                <p className="text-xs text-white/80">Ative as notificações para ser avisado todo dia</p>
              </div>
              <Button size="sm" variant="gold" onClick={handlePushSubscribe}>Ativar</Button>
            </div>
          </Card>
        )}

        {/* iOS PWA prompt */}
        {iosPrompt && (
          <Card className="bg-primary-50 border border-primary-200" padding="md">
            <p className="font-semibold text-primary-800 text-sm mb-1">Instale o app no iPhone</p>
            <p className="text-xs text-primary-600">
              Toque em <strong>Compartilhar</strong> no Safari e depois em <strong>"Adicionar à Tela de Início"</strong> para ativar notificações no iPhone.
            </p>
            <button onClick={() => setIosPrompt(false)} className="text-xs text-primary-400 mt-2">Fechar</button>
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

              {/* Reações */}
              <div className="flex gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <span>🙏</span>
                  <span>{todayDevotional.reactions_count?.amen ?? 0} Amém</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <span>✨</span>
                  <span>{todayDevotional.reactions_count?.edified ?? 0} Edificados</span>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card padding="md" className="text-center py-8">
            <p className="text-4xl mb-3">📖</p>
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
                    <p className="text-gray-400 text-xs mt-0.5">{d.bible_reference} • {format(new Date(d.publish_date), 'dd/MM', { locale: ptBR })}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pedidos de oração */}
        <Card padding="md" className="cursor-pointer" onClick={() => navigate('/app/oracao')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Heart size={18} className="text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">Pedidos de oração</p>
              <p className="text-gray-400 text-xs mt-0.5">Envie ou veja pedidos da comunidade</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </Card>
      </div>
    </div>
  )
}
