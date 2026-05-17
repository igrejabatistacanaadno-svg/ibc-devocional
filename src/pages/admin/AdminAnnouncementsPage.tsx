import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { announcementsApi } from '@/lib/supabase'
import { sendNotification } from '@/lib/pushNotifications'
import type { Announcement } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const useMock = !import.meta.env.VITE_SUPABASE_URL

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal' as Announcement['priority'],
    send_notification: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (useMock) setAnnouncements([
      { id: '1', title: 'Culto de Oração', content: 'Hoje às 19h30.', priority: 'important', status: 'active', publish_date: new Date().toISOString(), created_at: new Date().toISOString() },
    ])
    else announcementsApi.getAll().then(({ data }) => data && setAnnouncements(data))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (!useMock) {
        const { data } = await announcementsApi.create({
          title: form.title,
          content: form.content,
          priority: form.priority,
          status: 'active',
          publish_date: new Date().toISOString(),
        })
        if (data) setAnnouncements(a => [data as Announcement, ...a])

        if (form.send_notification) {
          try {
            await sendNotification({
              title: `📢 ${form.title}`,
              body: form.content.length > 100 ? form.content.slice(0, 97) + '...' : form.content,
              targetUrl: '/app/avisos',
            })
          } catch (pushErr) {
            console.warn('[Avisos] Aviso publicado, mas notificação push falhou:', pushErr)
          }
        }
      } else {
        setAnnouncements(a => [
          { id: Date.now().toString(), ...form, status: 'active', publish_date: new Date().toISOString(), created_at: new Date().toISOString() },
          ...a,
        ])
      }
      setForm({ title: '', content: '', priority: 'normal', send_notification: true })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este aviso?')) return
    if (!useMock) await announcementsApi.delete(id)
    setAnnouncements(a => a.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Avisos da Igreja</h1>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(!showForm)}>
          Novo aviso
        </Button>
      </div>

      {showForm && (
        <Card padding="md">
          <h3 className="font-semibold text-gray-700 mb-4">Novo aviso</h3>
          <form onSubmit={handleSave} className="space-y-3">
            <input
              placeholder="Título do aviso"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"
              required
            />
            <textarea
              placeholder="Conteúdo do aviso..."
              rows={3}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 resize-none"
              required
            />
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as Announcement['priority'] }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"
            >
              <option value="normal">Normal</option>
              <option value="important">Importante</option>
              <option value="urgent">Urgente</option>
            </select>
            <label className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={form.send_notification}
                onChange={e => setForm(f => ({ ...f, send_notification: e.target.checked }))}
                className="w-4 h-4 accent-primary-700"
              />
              <div>
                <p className="font-medium text-primary-800 text-sm">Enviar notificação push</p>
                <p className="text-primary-600 text-xs">Notifica todos os membros inscritos</p>
              </div>
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)} className="border border-gray-200">Cancelar</Button>
              <Button type="submit" variant="primary" size="sm" loading={saving} fullWidth>Publicar aviso</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {announcements.map(a => (
          <Card key={a.id} padding="md" className={`border-l-4 ${a.priority === 'urgent' ? 'border-red-500' : a.priority === 'important' ? 'border-gold-500' : 'border-primary-300'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">{a.title}</p>
                <p className="text-gray-600 text-sm mt-0.5">{a.content}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 size={15} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
