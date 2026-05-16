import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Check, Send } from 'lucide-react'
import { devotionalsApi, storageApi } from '@/lib/supabase'
import { sendPushNotification } from '@/lib/pushNotifications'
import { v4 as uuidv4 } from 'uuid'
import AudioRecorder from '@/components/admin/AudioRecorder'
import MusicMixer from '@/components/admin/MusicMixer'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const STEPS = ['Conteúdo', 'Áudio', 'Fundo Musical', 'Mixagem', 'Publicação']

const useMock = !import.meta.env.VITE_SUPABASE_URL

export default function NewDevotionalPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    bible_reference: '',
    bible_text: '',
    devotional_text: '',
    final_prayer: '',
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    publish_date: new Date().toISOString().slice(0, 16),
    send_notification: false,
  })

  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [mixedBlob, setMixedBlob] = useState<Blob | null>(null)
  const [audioReady, setAudioReady] = useState(false)
  const [mixReady, setMixReady] = useState(false)

  const updateForm = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const canNext = () => {
    if (step === 0) return form.title.trim() && form.bible_reference.trim() && form.devotional_text.trim()
    if (step === 1) return audioReady
    return true
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let originalAudioUrl: string | null = null
      let mixedAudioUrl: string | null = null

      if (!useMock) {
        const id = uuidv4()
        if (voiceBlob) {
          originalAudioUrl = await storageApi.uploadAudio(voiceBlob, `${id}/original.webm`)
        }
        if (mixedBlob) {
          mixedAudioUrl = await storageApi.uploadAudio(mixedBlob, `${id}/mixed.wav`)
        }
        const { data, error } = await devotionalsApi.create({
          ...form,
          id,
          publish_date: new Date(form.publish_date).toISOString(),
          original_audio_url: originalAudioUrl,
          mixed_audio_url: mixedAudioUrl,
        })
        if (error) throw error
        if (form.send_notification && form.status === 'published' && data) {
          await sendPushNotification(data.id, form.title)
        }
      }

      alert('Devocional salva com sucesso! 🙏')
      navigate('/admin/devocionais')
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar. Verifique o console.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nova devocional</h1>
        <p className="text-gray-500 text-sm mt-0.5">Etapa {step + 1} de {STEPS.length}: <strong>{STEPS[step]}</strong></p>
      </div>

      {/* Step progress */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary-700' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Step content */}
      {step === 0 && (
        <Card padding="md" className="space-y-4">
          <h2 className="font-semibold text-gray-800">Conteúdo da devocional</h2>
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
      )}

      {step === 1 && (
        <Card padding="md">
          <h2 className="font-semibold text-gray-800 mb-4">Gravação de áudio</h2>
          <AudioRecorder onAudioReady={(blob) => { setVoiceBlob(blob); setAudioReady(true) }} />
          {audioReady && (
            <div className="mt-3 bg-mint-50 border border-mint-200 rounded-xl p-3 text-center">
              <p className="text-mint-700 font-medium text-sm">✅ Áudio pronto para mixagem</p>
            </div>
          )}
        </Card>
      )}

      {step === 2 && (
        <Card padding="md">
          <h2 className="font-semibold text-gray-800 mb-4">Fundo musical</h2>
          {!voiceBlob && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-700">
              ⚠️ Nenhum áudio gravado. Você pode pular esta etapa e publicar apenas o texto.
            </div>
          )}
          <MusicMixer
            voiceBlob={voiceBlob}
            onMixReady={(blob) => { setMixedBlob(blob); setMixReady(true) }}
          />
        </Card>
      )}

      {step === 3 && (
        <Card padding="md">
          <h2 className="font-semibold text-gray-800 mb-4">Prévia da mixagem</h2>
          {mixReady ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎵</div>
              <p className="text-gray-700 font-semibold">Mixagem concluída!</p>
              <p className="text-gray-500 text-sm mt-1">Seu áudio está pronto para publicação.</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">⏭️</div>
              <p className="text-gray-500 text-sm">Nenhuma mixagem realizada.</p>
              <p className="text-gray-400 text-xs mt-1">A devocional será publicada com o áudio original.</p>
            </div>
          )}
        </Card>
      )}

      {step === 4 && (
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
              <option value="published">Publicar agora</option>
              <option value="scheduled">Agendar publicação</option>
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

          <label className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={form.send_notification}
              onChange={e => updateForm('send_notification', e.target.checked)}
              className="w-4 h-4 accent-primary-700"
            />
            <div>
              <p className="font-medium text-primary-800 text-sm">Enviar notificação push</p>
              <p className="text-primary-600 text-xs">Notifica todos os inscritos ao publicar</p>
            </div>
          </label>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1 text-gray-600">
            <p><strong>Título:</strong> {form.title || '—'}</p>
            <p><strong>Versículo:</strong> {form.bible_reference || '—'}</p>
            <p><strong>Áudio:</strong> {audioReady ? '✅ Gravado' : '❌ Sem áudio'}</p>
            <p><strong>Mixagem:</strong> {mixReady ? '✅ Mixado' : '—'}</p>
          </div>

          <Button
            variant="gold"
            size="lg"
            fullWidth
            loading={saving}
            icon={<Send size={16} />}
            onClick={handleSave}
          >
            {form.status === 'published' ? 'Publicar devocional' :
             form.status === 'scheduled' ? 'Agendar publicação' : 'Salvar rascunho'}
          </Button>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="ghost" size="md" icon={<ChevronLeft size={16} />} onClick={() => setStep(s => s - 1)} className="border border-gray-200">
            Voltar
          </Button>
        )}
        {step < STEPS.length - 1 && (
          <Button
            variant="primary"
            size="md"
            fullWidth
            icon={<ChevronRight size={16} />}
            disabled={!canNext()}
            onClick={() => setStep(s => s + 1)}
          >
            {step === 1 && !audioReady ? 'Pular áudio' : 'Próxima etapa'}
          </Button>
        )}
      </div>
    </div>
  )
}
