import { useEffect, useState } from 'react'
import { Check, EyeOff, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { commentsApi } from '@/lib/supabase'
import type { Comment } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const useMock = !import.meta.env.VITE_SUPABASE_URL

const mockPending: Comment[] = [
  { id: 'p1', devotional_id: '1', author_name: 'Pedro Lima', comment_text: 'Palavra poderosa! Que Deus abençoe muito nosso pastor.', status: 'pending', created_at: new Date().toISOString(), approved_at: null },
  { id: 'p2', devotional_id: '1', author_name: 'Lucia Ferreira', comment_text: 'Fui muito edificada hoje. Obrigada Senhor!', status: 'pending', created_at: new Date(Date.now() - 1800000).toISOString(), approved_at: null },
]

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')

  useEffect(() => {
    setLoading(true)
    if (useMock) {
      setComments(tab === 'pending' ? mockPending : [])
    } else {
      commentsApi.getPending().then(({ data }) => data && setComments(data as Comment[]))
    }
    setLoading(false)
  }, [tab])

  const handleApprove = async (id: string) => {
    if (!useMock) await commentsApi.updateStatus(id, 'approved')
    setComments(c => c.filter(x => x.id !== id))
  }

  const handleHide = async (id: string) => {
    if (!useMock) await commentsApi.updateStatus(id, 'hidden')
    setComments(c => c.filter(x => x.id !== id))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este comentário?')) return
    if (!useMock) await commentsApi.delete(id)
    setComments(c => c.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Moderação de comentários</h1>

      <div className="flex gap-2">
        {(['pending', 'approved'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-primary-800 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            {t === 'pending' ? `Pendentes (${useMock ? mockPending.length : comments.length})` : 'Aprovados'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-gray-500 font-medium">Nenhum comentário {tab === 'pending' ? 'pendente' : 'aprovado'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <Card key={c.id} padding="md">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                  {c.author_name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">{c.author_name}</span>
                    <span className="text-gray-400 text-xs">
                      {format(new Date(c.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-mint-100 text-mint-700'
                    }`}>
                      {c.status === 'pending' ? 'Pendente' : 'Aprovado'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{c.comment_text}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {c.status === 'pending' && (
                  <Button size="sm" variant="primary" icon={<Check size={13} />} onClick={() => handleApprove(c.id)}>
                    Aprovar
                  </Button>
                )}
                <Button size="sm" variant="ghost" icon={<EyeOff size={13} />} onClick={() => handleHide(c.id)} className="border border-gray-200">
                  Ocultar
                </Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => handleDelete(c.id)}>
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
