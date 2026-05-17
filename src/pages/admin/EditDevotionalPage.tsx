import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ChevronLeft } from 'lucide-react'
import { devotionalsApi } from '@/lib/supabase'
import { sendPushNotification } from '@/lib/pushNotifications'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function EditDevotionalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    title: '',
    bible_reference: '',
    bible_text: '',
    devotional_text: '',
    final_prayer: '',
    status: 'draft' as 'draft' | 'published' | 'scheduled' | 'cancelled',
    publish_date: new Date().toISOString().slice(0, 16),
    send_notification: false,
  })

  useEffect(() => {
    if (!id) return
    devotionalsApi.getById(id).then(({ data, error }) => {
      if (error || !data) { alert('Devocional não encontrado.'); navigate('/admin/devocionais'); return }
      setForm({
        title: data.title ?? '',
        bible_reference: data.bible_reference ?? '',
        bible_text: data.bible_text ?? '',
        devotional_text: data.devotional_text ?? '',
        final_prayer: data.final_prayer ?? '',
        status: data.status as 'draft' | 'published' | 'scheduled' | 'cancelled',
        publish_date: data.publish_date ? new Date(data.publish_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        send_notification: data.send_notification ?? false,
      })
      setLoading(false)
    })
  }, [id, navigate])

  const updateForm = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!id) return
    if (!form.title.trim() || !form.bible_reference.trim() || !form.devotional_text.trim()) {
      alert('Preencha título, versículo e mensagem.')
      return
    }
    setSaving(true)
    try {
      const { data, error } = await devotionalsApi.update(id, {
        ...form,
        publish_date: new Date(form.publish_date).toISOString(),
      })
      if (error) throw error

      if (form.send_notification && form.status === 'published' && data) {
        try {
          await sendPushNotification(id, form.title)
        } catch (pushErr) {
          console.warn('[EditDevocional] Devocional salva, mas push falhou:', pushErr)
        }
      }

      alert('Devocional atualizada com sucesso! 🙏')
      navigate('/admin/devocionais')
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar. Verifique o console.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/devocionais')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Editar devocional</h1>
          <p className="text-gray-500 text-sm mt-0.5">Altere os campos e salve</p>
        </div>
      </div>

      <Card padding="md" className="space-y-4">
        <h2 className="font-semibold text-gray-800">Conteúdo</h2>
        {[
          { key: 'title', label: 'Título *', placeholder: 'Ex: Confiança em Deus para um novo dia', type: 'text' },
          { key: 'bible_reference', label: 'Versículo base *', placeholder: 'Ex: Salmo 37:5', type: 'text' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form] as string}
              onChange={e => updateForm(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"
            />
          </div>
        ))}
        {[
          { key: 'bible_text', label: 'Texto bíblico', rows: 3, placeholder: 'Cole aqui o texto do versículo...' },
          { key: 'devotional_text', label: 'Mensagem da devocional *', rows: 6, placeholder: 'Escreva a mensagem pastoral...' },
          { key: 'final_prayer', label: 'Oração final', rows: 3, placeholder: 'Oração para encerrar...' },
        ].map(({ key, label, rows, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea
              value={form[key as keyof typeof form] as string}
              onChange={e => updateForm(key, e.target.value)}
              rows={rows}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 resize-none"
            />
          </div>
        ))}
      </Card>

      <Card padding="md" className="space-y-4">
        <h2 className="font-semibold text-gray-800">Publicação</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={e => updateForm('status', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicada</option>
            <option value="scheduled">Agendada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>

        {form.status === 'scheduled' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data e hora</label>
            <input
              type="datetime-local"
              value={form.publish_date}
              onChange={e => updateForm('publish_date', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"
            />
          </div>
        )}

        {form.status === 'published' && (
          <label className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={form.send_notification}
              onChange={e => updateForm('send_notification', e.target.checked)}
              className="w-4 h-4 accent-primary-700"
            />
            <div>
              <p className="font-medium text-primary-800 text-sm">Enviar notificação push</p>
              <p className="text-primary-600 text-xs">Notifica todos os inscritos ao salvar</p>
            </div>
          </label>
        )}

        <Button
          variant="gold"
          size="lg"
          fullWidth
          loading={saving}
          icon={<Save size={16} />}
          onClick={handleSave}
        >
          Salvar alterações
        </Button>
      </Card>
    </div>
  )
}
