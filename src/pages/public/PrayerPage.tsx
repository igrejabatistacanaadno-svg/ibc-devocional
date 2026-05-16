import { useEffect, useState } from 'react'
import { Heart, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { prayerApi } from '@/lib/supabase'
import { MOCK_PRAYER_REQUESTS } from '@/lib/mockData'
import type { PrayerRequest } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Header from '@/components/layout/Header'

const useMock = !import.meta.env.VITE_SUPABASE_URL

export default function PrayerPage() {
  const [requests, setRequests] = useState<PrayerRequest[]>([])
  const [name, setName] = useState(() => localStorage.getItem('ibc_comment_name') ?? '')
  const [text, setText] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [prayedIds, setPrayedIds] = useState<string[]>([])

  useEffect(() => {
    if (useMock) {
      setRequests(MOCK_PRAYER_REQUESTS)
    } else {
      prayerApi.getPublicApproved().then(({ data }) => data && setRequests(data))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    setSubmitting(true)
    localStorage.setItem('ibc_comment_name', name)
    if (!useMock) {
      await prayerApi.create({ author_name: name, request_text: text, visibility })
    }
    setText('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 5000)
    setSubmitting(false)
  }

  const handlePrayed = (id: string) => {
    setPrayedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div>
      <Header title="Mural de Oração" />
      <div className="px-4 pt-3 pb-6 space-y-5">
        {/* Send form */}
        <Card padding="md">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Heart size={16} className="text-red-500" /> Enviar pedido de oração
          </h3>

          {success && (
            <div className="bg-mint-50 border border-mint-200 rounded-xl p-3 mb-3 text-center">
              <p className="text-mint-700 text-sm font-medium">Pedido enviado! Estamos orando por você. 🙏</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"
              required
            />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Descreva seu pedido de oração..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 resize-none"
              required
              maxLength={600}
            />
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                  className="accent-primary-700"
                />
                Compartilhar com a igreja
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                  className="accent-primary-700"
                />
                Somente para o pastor
              </label>
            </div>
            <Button type="submit" variant="primary" fullWidth loading={submitting} icon={<Send size={14} />}>
              Enviar pedido
            </Button>
          </form>
        </Card>

        {/* Public requests */}
        {requests.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Pedidos da comunidade ({requests.length})</h3>
            <div className="space-y-3">
              {requests.map(r => (
                <Card key={r.id} padding="sm">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500 font-bold text-sm">
                      {r.author_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-gray-800">{r.author_name}</span>
                        <span className="text-gray-400 text-xs">
                          {format(new Date(r.created_at), "d MMM", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">{r.request_text}</p>
                      <button
                        onClick={() => handlePrayed(r.id)}
                        className={`mt-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${prayedIds.includes(r.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                      >
                        <Heart size={13} fill={prayedIds.includes(r.id) ? 'currentColor' : 'none'} />
                        {prayedIds.includes(r.id) ? 'Estou orando' : 'Orar por este pedido'}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
