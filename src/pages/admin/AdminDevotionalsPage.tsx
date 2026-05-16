import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { devotionalsApi } from '@/lib/supabase'
import { MOCK_DEVOTIONALS } from '@/lib/mockData'
import type { Devotional } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const useMock = !import.meta.env.VITE_SUPABASE_URL

const statusLabel: Record<string, string> = { draft: 'Rascunho', published: 'Publicada', scheduled: 'Agendada' }
const statusColor: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', published: 'bg-mint-100 text-mint-700', scheduled: 'bg-blue-100 text-blue-700' }

export default function AdminDevotionalsPage() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (useMock) setDevotionals(MOCK_DEVOTIONALS)
    else devotionalsApi.getAll().then(({ data }) => data && setDevotionals(data))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta devocional?')) return
    if (!useMock) await devotionalsApi.delete(id)
    setDevotionals(d => d.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Devocionais</h1>
        <Button variant="gold" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/admin/nova-devocional')}>
          Nova
        </Button>
      </div>

      <div className="space-y-3">
        {devotionals.map(d => (
          <Card key={d.id} padding="md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <BookOpen size={17} className="text-primary-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-800 text-sm">{d.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[d.status]}`}>
                    {statusLabel[d.status]}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{d.bible_reference}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {format(new Date(d.publish_date), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" icon={<Edit2 size={12} />}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" icon={<Trash2 size={12} />} onClick={() => handleDelete(d.id)} className="border border-red-200 text-red-600 hover:bg-red-50">
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
