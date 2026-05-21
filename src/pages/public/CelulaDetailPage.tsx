import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Megaphone, Bell, Mic2, MessageCircle,
  CheckCircle, Users, Send, X, ExternalLink, Pin, ChevronDown, ChevronUp,
  Home,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { celulasApi, celulaPostsApi, celulaInteracoesApi } from '@/lib/supabase'
import type { Celula, CelulaPost, CelulaComment } from '@/types'

// --- Helpers -----------------------------------------------------------------
const getDeviceId = (): string => {
  let id = localStorage.getItem('ibc_device_id')
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('ibc_device_id', id)
  }
  return id
}

const getSavedName = (): string => localStorage.getItem('ibc_comment_name') ?? ''

// --- Tipos de aba ------------------------------------------------------------
type TabId = 'inicio' | 'pdfs' | 'comunicados' | 'avisos' | 'pregacao' | 'interacoes'

interface Tab {
  id: TabId
  label: string
  icon: React.ElementType
  postType?: string
}

const TABS: Tab[] = [
  { id: 'inicio',       label: 'Início',         icon: Home },
  { id: 'pdfs',         label: 'PDFs/Cursos',    icon: FileText,    postType: 'pdf_curso' },
  { id: 'comunicados',  label: 'Comunicados',    icon: Megaphone,   postType: 'comunicado' },
  { id: 'avisos',       label: 'Avisos',         icon: Bell,        postType: 'aviso' },
  { id: 'pregacao',     label: 'Pregação',       icon: Mic2,        postType: 'pregacao' },
  { id: 'interacoes',   label: 'Interações',     icon: MessageCircle, postType: 'interacao' },
]

const CELULA_THEMES: Record<string, { gradient: string; emoji: string }> = {
  'homens-posicionados': {
    gradient: 'linear-gradient(135deg, #0d2654 0%, #1a3f7a 100%)',
    emoji: '🛡️',
  },
  'mulheres-de-excelencia': {
    gradient: 'linear-gradient(135deg, #4a1456 0%, #7b2d8b 100%)',
    emoji: '✨',
  },
}

// --- PostCard ----------------------------------------------------------------
function PostCard({ post, deviceId }: { post: CelulaPost; deviceId: string }) {
  const [expanded, setExpanded]       = useState(false)
  const [read, setRead]               = useState(false)
  const [presenceCount, setPresenceCount] = useState(0)
  const [userPresent, setUserPresent] = useState(false)
  const [comments, setComments]       = useState<CelulaComment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [authorName, setAuthorName]   = useState(getSavedName)
  const [sending, setSending]         = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

  useEffect(() => {
    // Verificar se usuário já leu
    celulaInteracoesApi.userRead(post.id, deviceId).then(({ data }) => {
      if (data) setRead(true)
    })
    // Contagem de presenças
    celulaInteracoesApi.getPresences(post.id).then(({ data }) => {
      if (data) {
        setPresenceCount(data.length)
        setUserPresent(data.some(p => p.device_id === deviceId))
      }
    })
  }, [post.id, deviceId])

  const handleMarkRead = async () => {
    await celulaInteracoesApi.markRead(post.id, deviceId)
    setRead(true)
  }

  const handlePresence = async () => {
    if (userPresent) return
    const name = authorName || prompt('Seu nome para confirmação de presença:') || 'Anônimo'
    setAuthorName(name)
    localStorage.setItem('ibc_comment_name', name)
    await celulaInteracoesApi.confirmPresence(post.id, deviceId, name)
    setUserPresent(true)
    setPresenceCount(c => c + 1)
  }

  const handleShowComments = async () => {
    const next = !showComments
    setShowComments(next)
    if (next && comments.length === 0) {
      setLoadingComments(true)
      const { data } = await celulaInteracoesApi.getComments(post.id)
      if (data) setComments(data)
      setLoadingComments(false)
    }
  }

  const handleSendComment = async () => {
    if (!commentText.trim()) return
    const name = authorName.trim() || 'Anônimo'
    setSending(true)
    const { data } = await celulaInteracoesApi.addComment({
      post_id: post.id,
      author_name: name,
      comment_text: commentText.trim(),
    })
    if (data) {
      setComments(prev => [...prev, data])
      setCommentText('')
      localStorage.setItem('ibc_comment_name', name)
    }
    setSending(false)
  }

  const isLong = (post.content?.length ?? 0) > 200

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${post.pinned ? 'border-amber-300' : 'border-gray-100'}`}>
      {/* Header do card */}
      <div className="px-4 pt-4 pb-3">
        {post.pinned && (
          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold mb-2">
            <Pin size={11} />
            Fixado
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm leading-snug">{post.title}</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {format(new Date(post.created_at), "d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className={`text-gray-600 text-sm leading-relaxed whitespace-pre-wrap ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
            {post.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-primary-700 text-xs font-medium mt-1.5"
            >
              {expanded ? <><ChevronUp size={13} /> Mostrar menos</> : <><ChevronDown size={13} /> Ler mais</>}
            </button>
          )}
        </div>
      )}

      {/* PDF link */}
      {post.pdf_url && (
        <div className="px-4 pb-3">
          <a
            href={post.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <FileText size={16} />
            Abrir PDF / Material
            <ExternalLink size={13} />
          </a>
        </div>
      )}

      {/* Vídeo link */}
      {post.video_url && (
        <div className="px-4 pb-3">
          <a
            href={post.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Mic2 size={16} />
            Assistir pregação
            <ExternalLink size={13} />
          </a>
        </div>
      )}

      {/* Áudio */}
      {post.audio_url && (
        <div className="px-4 pb-3">
          <audio controls className="w-full rounded-xl" src={post.audio_url} />
        </div>
      )}

      {/* Ações */}
      <div className="border-t border-gray-50 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        {/* Confirmar leitura */}
        <button
          onClick={handleMarkRead}
          disabled={read}
          className={`flex items-center gap-1.5 text-xs font-medium rounded-xl px-3 py-1.5 transition-colors ${
            read
              ? 'bg-green-50 text-green-600 cursor-default'
              : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
          }`}
        >
          <CheckCircle size={13} />
          {read ? 'Lido ✓' : 'Confirmar leitura'}
        </button>

        {/* Presença (para interações) */}
        {post.type === 'interacao' && (
          <button
            onClick={handlePresence}
            disabled={userPresent}
            className={`flex items-center gap-1.5 text-xs font-medium rounded-xl px-3 py-1.5 transition-colors ${
              userPresent
                ? 'bg-primary-50 text-primary-700 cursor-default'
                : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-700'
            }`}
          >
            <Users size={13} />
            {userPresent ? `Presente ✓ (${presenceCount})` : `Confirmar presença (${presenceCount})`}
          </button>
        )}

        {/* Comentários */}
        <button
          onClick={handleShowComments}
          className="flex items-center gap-1.5 text-xs font-medium rounded-xl px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors ml-auto"
        >
          <MessageCircle size={13} />
          {showComments ? 'Fechar' : `Comentar`}
        </button>
      </div>

      {/* Seção de comentários */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {loadingComments ? (
            <p className="text-gray-400 text-xs text-center py-2">Carregando...</p>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="text-gray-400 text-xs text-center py-2">Seja o primeiro a comentar</p>
              )}
              <div className="space-y-2 mb-3">
                {comments.map(c => (
                  <div key={c.id} className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                    <p className="font-semibold text-gray-700 text-xs">{c.author_name}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{c.comment_text}</p>
                    <p className="text-gray-400 text-[10px] mt-1">
                      {format(new Date(c.created_at), "d/MM 'às' HH:mm")}
                    </p>
                  </div>
                ))}
              </div>
              {/* Input de comentário */}
              <div className="space-y-2">
                {!getSavedName() && (
                  <input
                    type="text"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                  />
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                    placeholder="Escreva um comentário..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={sending || !commentText.trim()}
                    className="w-10 h-10 rounded-xl bg-primary-700 text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-800 transition-colors flex-shrink-0"
                  >
                    {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// --- Tab content -------------------------------------------------------------
function TabContent({ posts, tab, deviceId }: { posts: CelulaPost[]; tab: Tab; deviceId: string }) {
  const filtered = tab.postType
    ? posts.filter(p => p.type === tab.postType)
    : posts // 'inicio' mostra pinned + últimos

  const displayed = tab.id === 'inicio'
    ? [...posts.filter(p => p.pinned), ...posts.filter(p => !p.pinned)].slice(0, 5)
    : filtered

  if (displayed.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-3xl mb-3">📭</p>
        <p className="text-gray-500 font-medium text-sm">Nenhum conteúdo ainda</p>
        <p className="text-gray-400 text-xs mt-1">Em breve novidades aqui</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {displayed.map(post => (
        <PostCard key={post.id} post={post} deviceId={deviceId} />
      ))}
    </div>
  )
}

// --- Main Page ---------------------------------------------------------------
export default function CelulaDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [celula, setCelula] = useState<Celula | null>(null)
  const [posts, setPosts] = useState<CelulaPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('inicio')
  const tabBarRef = useRef<HTMLDivElement>(null)
  const deviceId = getDeviceId()

  const theme = CELULA_THEMES[slug] ?? { gradient: 'linear-gradient(135deg, #0d2654 0%, #1a3f7a 100%)', emoji: '⛪' }

  useEffect(() => {
    celulasApi.getBySlug(slug).then(({ data }) => {
      if (data) setCelula(data)
    })
  }, [slug])

  useEffect(() => {
    if (!celula) return
    celulaPostsApi.getPublished(celula.id).then(({ data }) => {
      if (data) setPosts(data)
      setLoading(false)
    })
  }, [celula])

  const scrollTabIntoView = (tabId: TabId) => {
    setActiveTab(tabId)
    const bar = tabBarRef.current
    if (!bar) return
    const btn = bar.querySelector(`[data-tab="${tabId}"]`) as HTMLElement | null
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header com gradiente */}
      <div className="relative" style={{ background: theme.gradient }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-6">
          <button
            onClick={() => navigate('/app/celulas')}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Célula</p>
            <h1 className="text-white font-bold text-xl leading-tight truncate">{celula?.name ?? '...'}</h1>
          </div>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            {theme.emoji}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        ref={tabBarRef}
        className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm flex overflow-x-auto no-scrollbar"
      >
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const count = tab.postType ? posts.filter(p => p.type === tab.postType).length : undefined
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => scrollTabIntoView(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-700 text-primary-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Conteúdo da aba */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <TabContent
            posts={posts}
            tab={TABS.find(t => t.id === activeTab)!}
            deviceId={deviceId}
          />
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
