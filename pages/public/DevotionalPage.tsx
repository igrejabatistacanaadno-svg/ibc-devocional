import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Share2, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { devotionalsApi, commentsApi, reactionsApi } from '@/lib/supabase'
import { MOCK_DEVOTIONALS, MOCK_COMMENTS } from '@/lib/mockData'
import { getDeviceId } from '@/lib/deviceId'
import type { Devotional, Comment } from '@/types'
import AudioPlayer from '@/components/devotional/AudioPlayer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Header from '@/components/layout/Header'

const useMock = !import.meta.env.VITE_SUPABASE_URL

export default function DevotionalPage() {
  const { id } = useParams<{ id: string }>()
  const [devotional, setDevotional] = useState<Devotional | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [userReactions, setUserReactions] = useState<{ amen: boolean; edified: boolean }>({ amen: false, edified: false })
  const [counts, setCounts] = useState({ amen: 0, edified: 0 })
  const [loading, setLoading] = useState(true)
  const [commentName, setCommentName] = useState(() => localStorage.getItem('ibc_comment_name') ?? '')
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentSuccess, setCommentSuccess] = useState(false)

  const deviceId = getDeviceId()

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    if (useMock) {
      const d = MOCK_DEVOTIONALS.find(x => x.id === id) ?? MOCK_DEVOTIONALS[0]
      setDevotional(d)
      setComments(MOCK_COMMENTS.filter(c => c.devotional_id === id || c.devotional_id === '1'))
      setCounts(d.reactions_count ?? { amen: 0, edified: 0 })
    } else {
      const { data: d } = await devotionalsApi.getById(id)
      if (d) setDevotional(d)
      const { data: c } = await commentsApi.getApproved(id)
      if (c) setComments(c)
      const { data: rc } = await reactionsApi.getCounts(id)
      if (rc) setCounts(rc)
      const { data: ur } = await reactionsApi.getUserReactions(id, deviceId)
      if (ur) {
        setUserReactions({
          amen: ur.some((r: { reaction_type: string }) => r.reaction_type === 'amen'),
          edified: ur.some((r: { reaction_type: string }) => r.reaction_type === 'edified'),
        })
      }
    }
    setLoading(false)
  }, [id, deviceId])

  useEffect(() => { loadData() }, [loadData])

  const handleReaction = async (type: 'amen' | 'edified') => {
    if (useMock) {
      setUserReactions(prev => ({ ...prev, [type]: !prev[type] }))
      setCounts(prev => ({ ...prev, [type]: prev[type] + (userReactions[type] ? -1 : 1) }))
      return
    }
    if (!id) return
    await reactionsApi.toggle(id, type, deviceId)
    const { data: rc } = await reactionsApi.getCounts(id)
    if (rc) setCounts(rc)
    setUserReactions(prev => ({ ...prev, [type]: !prev[type] }))
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentName.trim() || !commentText.trim() || !id) return
    setSubmitting(true)
    localStorage.setItem('ibc_comment_name', commentName)
    if (!useMock) {
      await commentsApi.create({ devotional_id: id, author_name: commentName, comment_text: commentText })
    }
    setCommentText('')
    setCommentSuccess(true)
    setTimeout(() => setCommentSuccess(false), 4000)
    setSubmitting(false)
  }

  const handleShare = () => {
    if (navigator.share && devotional) {
      navigator.share({
        title: devotional.title,
        text: `${devotional.title} - ${devotional.bible_reference}`,
        url: window.location.href,
      })
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!devotional) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Devocional não encontrada.</p>
    </div>
  )

  return (
    <div>
      <Header title="Devocional" showBack right={
        <button onClick={handleShare} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100">
          <Share2 size={18} />
        </button>
      } />

      <div className="px-4 pb-6 space-y-4 mt-2">
        {/* Title + verse */}
        <div className="text-center pt-2">
          <p className="text-primary-600 text-xs font-medium uppercase tracking-wider mb-2">
            {format(new Date(devotional.publish_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <h1 className="text-gray-900 font-bold text-xl leading-snug mb-2">{devotional.title}</h1>
          <p className="text-gold-600 font-semibold text-sm">{devotional.bible_reference}</p>
          {devotional.bible_text && (
            <p className="text-gray-600 italic text-sm mt-2 px-4 leading-relaxed">"{devotional.bible_text}"</p>
          )}
        </div>

        {/* Audio player */}
        {(devotional.mixed_audio_url || devotional.original_audio_url) && (
          <AudioPlayer
            src={(devotional.mixed_audio_url ?? devotional.original_audio_url)!}
            title={devotional.title}
          />
        )}

        {/* Devotional text */}
        {devotional.devotional_text && (
          <Card padding="md">
            <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-primary-700 inline-block" />
              Mensagem
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{devotional.devotional_text}</p>
          </Card>
        )}

        {/* Final prayer */}
        {devotional.final_prayer && (
          <Card padding="md" className="bg-primary-50 border border-primary-100">
            <h3 className="font-semibold text-primary-800 text-sm mb-2">🙏 Oração final</h3>
            <p className="text-primary-700 text-sm leading-relaxed italic">{devotional.final_prayer}</p>
          </Card>
        )}

        {/* Reactions */}
        <Card padding="md">
          <p className="text-xs text-gray-400 text-center mb-3">Como esta devocional te abençoou?</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleReaction('amen')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                userReactions.amen ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white'
              }`}
            >
              <span className="text-2xl">🙏</span>
              <span className={`text-xs font-semibold ${userReactions.amen ? 'text-primary-700' : 'text-gray-600'}`}>
                Amém ({counts.amen})
              </span>
            </button>
            <button
              onClick={() => handleReaction('edified')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                userReactions.edified ? 'border-gold-500 bg-yellow-50' : 'border-gray-200 bg-white'
              }`}
            >
              <span className="text-2xl">✨</span>
              <span className={`text-xs font-semibold ${userReactions.edified ? 'text-gold-600' : 'text-gray-600'}`}>
                Edificado ({counts.edified})
              </span>
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-gray-200 bg-white"
            >
              <span className="text-2xl">📤</span>
              <span className="text-xs font-semibold text-gray-600">Compartilhar</span>
            </button>
          </div>
        </Card>

        {/* Comments */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Comentários ({comments.length})</h3>

          {commentSuccess && (
            <Card padding="sm" className="bg-mint-50 border border-mint-200 mb-3 text-center">
              <p className="text-mint-700 text-sm font-medium">Comentário enviado para aprovação! 🙏</p>
            </Card>
          )}

          {/* Comment form */}
          <Card padding="md" className="mb-4">
            <p className="font-semibold text-gray-700 text-sm mb-3">Deixe seu comentário</p>
            <form onSubmit={handleComment} className="space-y-3">
              <input
                type="text"
                value={commentName}
                onChange={e => setCommentName(e.target.value)}
                placeholder="Seu nome"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"
                required
              />
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Compartilhe como esta devocional te abençoou..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 resize-none"
                required
                maxLength={500}
              />
              <Button type="submit" variant="primary" size="md" fullWidth loading={submitting} icon={<Send size={14} />}>
                Enviar comentário
              </Button>
            </form>
          </Card>

          {/* Comment list */}
          <div className="space-y-3">
            {comments.map(c => (
              <Card key={c.id} padding="sm">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-bold text-sm">
                    {c.author_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800">{c.author_name}</span>
                      <span className="text-gray-400 text-xs">
                        {format(new Date(c.created_at), "d MMM", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">{c.comment_text}</p>
                  </div>
                </div>
              </Card>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-gray-400 text-sm">Nenhum comentário ainda. Seja o primeiro!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
