import { useEffect, useState } from 'react'
import { CheckCircle, Lock, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { prayerApi } from '@/lib/supabase'
import type { PrayerRequest } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const useMock = !import.meta.env.VITE_SUPABASE_URL
const mockAll: PrayerRequest[] = [
  { id: '1', author_name: 'Maria Silva', request_text: 'Oração pela minha família.', visibility: 'public', status: 'pending', created_at: new Date().toISOString() },
  { id: '2', author_name: 'João Santos', request_text: 'Saúde da minha mãe.', visibility: 'public', status: 'approved', created_at: new Date().toISOString() },
  { id: '3', author_name: 'Ana Costa', request_text: 'Pedido particular — não divulgar.', visibility: 'private', status: 'pending', created_at: new Date().toISOString() },
]

export default function AdminPrayerPage() {
  const [requests, setRequests] = useState<PrayerRequest[]>([])

  useEffect(() => {
    if (useMock) setRequests(mockAll)
    else prayerApi.getAll().then(({ data }) => data && setRequests(data))
  }, [])

  const update = async (id: string, status: string) => {
    if (!useMock) await prayerApi.updateStatus(id, status)
    setRequests(r => r.map(x => x.id === id ? { ...x, status: status as PrayerRequest['status'] } : x))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Pedidos de oração</h1>
      <div className="space-y-3">
        {requests.map(r => (
          <Card key={r.id} padding="md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{r.author_name}</span>
                  {r.visibility === 'private' && <Lock size={12} className="text-gray-400" title="Privado" />}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    r.status === 'approved' ? 'bg-mint-100 text-mint-700' :
                    r.status === 'prayed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{r.status}</span>
                  <span className="text-gray-400 text-xs">{format(new Date(r.created_at), "d MMM", { locale: ptBR })}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{r.request_text}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {r.status === 'pending' && r.visibility === 'public' && (
                <Button size="sm" variant="primary" icon={<CheckCircle size={13} />} onClick={() => update(r.id, 'approved')}>
                  Aprovar
                </Button>
              )}
              {r.status !== 'prayed' && (
                <Button size="sm" variant="secondary" onClick={() => update(r.id, 'prayed')}>
                  Marcar como orado
                </Button>
              )}
              {r.status !== 'answered' && (
                <Button size="sm" variant="ghost" onClick={() => update(r.id, 'answered')} className="border border-gray-200">
                  Respondido
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
