import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ChevronRight, ArrowLeft } from 'lucide-react'
import { celulasApi } from '@/lib/supabase'
import type { Celula } from '@/types'
import Header from '@/components/layout/Header'

// ConfiguraÃ§Ãµes visuais por slug
const CELULA_THEMES: Record<string, { gradient: string; emoji: string; accent: string }> = {
  'homens-posicionados': {
    gradient: 'linear-gradient(135deg, #0d2654 0%, #1a3f7a 50%, #0d2654 100%)',
    emoji: 'ð¡ï¸',
    accent: '#c9a84c',
  },
  'mulheres-de-excelencia': {
    gradient: 'linear-gradient(135deg, #4a1456 0%, #7b2d8b 50%, #4a1456 100%)',
    emoji: 'â¨',
    accent: '#e8a0d0',
  },
}

const DEFAULT_THEME = {
  gradient: 'linear-gradient(135deg, #0d2654 0%, #1a3f7a 100%)',
  emoji: 'âª',
  accent: '#c9a84c',
}

export default function CelulasPage() {
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    celulasApi.getAll().then(({ data }) => {
      if (data) setCelulas(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="CÃ©lulas" />

      <div className="px-4 pt-4 pb-8 space-y-5">

        {/* IntroduÃ§Ã£o */}
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
            <Users size={26} className="text-primary-700" />
          </div>
          <h2 className="text-gray-800 font-bold text-lg">Grupos de CÃ©lula</h2>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            Conecte-se com sua cÃ©lula, acompanhe materiais e participe das interaÃ§Ãµes
          </p>
        </div>

        {/* Cards das cÃ©lulas */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-52 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : celulas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">âª</p>
            <p className="text-gray-500 font-medium">Nenhuma cÃ©lula disponÃ­vel</p>
            <p className="text-gray-400 text-sm mt-1">Verifique com a lideranÃ§a</p>
          </div>
        ) : (
          <div className="space-y-4">
            {celulas.map(celula => {
              const theme = CELULA_THEMES[celula.slug] ?? DEFAULT_THEME
              return (
                <button
                  key={celula.id}
                  onClick={() => navigate(`/app/celula/${celula.slug}`)}
                  className="relative w-full text-left rounded-2xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform"
                  style={{ background: theme.gradient }}
                >
                  {/* Cover image overlay se tiver */}
                  {celula.cover_image_url && (
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        backgroundImage: `url(${celula.cover_image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.3,
                      }}
                    />
                  )}

                  <div className="relative p-6 min-h-[200px] flex flex-col justify-between">
                    {/* Topo */}
                    <div className="flex items-start justify-between">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                      >
                        {theme.emoji}
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                      >
                        CÃ©lula ativa
                      </div>
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-white font-bold text-xl leading-tight mb-1">
                        {celula.name}
                      </h3>
                      {celula.description && (
                        <p className="text-white/70 text-sm mb-4">{celula.description}</p>
                      )}
                      {(celula.meeting_day || celula.meeting_time) && (
                        <p className="text-white/60 text-xs mb-4">
                          ð {[celula.meeting_day, celula.meeting_time, celula.meeting_location].filter(Boolean).join(' Â· ')}
                        </p>
                      )}

                      {/* BotÃ£o */}
                      <div
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                        style={{ background: theme.accent, color: '#1a1a1a' }}
                      >
                        Acessar cÃ©lula
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary-700 text-sm font-medium mt-2"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>
    </div>
  )
}
