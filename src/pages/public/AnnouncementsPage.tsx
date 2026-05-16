import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { announcementsApi } from '@/lib/supabase'
import { MOCK_ANNOUNCEMENTS } from '@/lib/mockData'
import type { Announcement } from '@/types'
import Card from '@/components/ui/Card'
import Header from '@/components/layout/Header'

const useMock = !import.meta.env.VITE_SUPABASE_URL

const priorityBorder: Record<string, string> = {
  urgent:    'border-l-4 border-red-500',
  important: 'border-l-4 border-gold-500',
  normal:    'border-l-4 border-primary-300',
}
const priorityLabel: Record<string, string> = {
  urgent: '🔴 Urgente', important: '🟡 Importante', normal: '',
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (useMock) {
      setAnnouncements(MOCK_ANNOUNCEMENTS)
    } else {
      announcementsApi.getActive().then(({ data }) => data && setAnnouncements(data))
    }
    setLoading(false)
  }, [])

  return (
    <div>
      <Header title="Avisos da Igreja" />
      <div className="px-4 pt-3 pb-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">Nenhum aviso no momento</p>
          </div>
        ) : (
          announcements.map(a => (
            <Card key={a.id} padding="md" className={priorityBorder[a.priority]}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {priorityLabel[a.priority] && (
                    <p className="text-xs font-semibold text-gray-500 mb-1">{priorityLabel[a.priority]}</p>
                  )}
                  <h3 className="font-bold text-gray-800 text-sm">{a.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{a.content}</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                {format(new Date(a.publish_date), "d 'de' MMMM", { locale: ptBR })}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
