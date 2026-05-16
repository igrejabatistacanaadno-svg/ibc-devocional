import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { devotionalsApi } from '@/lib/supabase'
import { MOCK_DEVOTIONALS } from '@/lib/mockData'
import type { Devotional } from '@/types'
import Card from '@/components/ui/Card'
import Header from '@/components/layout/Header'

const useMock = !import.meta.env.VITE_SUPABASE_URL

export default function DevotionalsListPage() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    if (useMock) {
      setDevotionals(MOCK_DEVOTIONALS)
    } else {
      devotionalsApi.getPublished().then(({ data }) => {
        if (data) setDevotionals(data)
      })
    }
    setLoading(false)
  }, [])

  const filtered = devotionals.filter(
    d =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.bible_reference.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <Header title="Devocionais" />
      <div className="px-4 pt-3 pb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título ou versículo..."
            className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📖</p>
            <p className="text-gray-400">Nenhuma devocional encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(d => (
              <Card
                key={d.id}
                padding="sm"
                className="flex items-center gap-3 cursor-pointer active:bg-gray-50"
                onClick={() => navigate(`/app/devocional/${d.id}`)}
              >
                <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-primary-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{d.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {d.bible_reference} · {format(new Date(d.publish_date), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {d.reactions_count && (
                    <p className="text-gray-400 text-xs mt-0.5">
                      🙏 {d.reactions_count.amen} · ✨ {d.reactions_count.edified}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
