import { useState, useRef } from 'react'
import { Music, Upload, Play, Square, Loader, Check, Volume2 } from 'lucide-react'
import { audioMixer, DEFAULT_MIXER_SETTINGS } from '@/lib/audioMixer'
import type { MixerSettings } from '@/types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface MusicMixerProps {
  voiceBlob: Blob | null
  onMixReady: (mixedBlob: Blob) => void
}

const PRESET_MUSIC = [
  { label: 'Suave Instrumental', url: '' },
  { label: 'Piano Cristão',      url: '' },
  { label: 'Violão Suave',       url: '' },
]

export default function MusicMixer({ voiceBlob, onMixReady }: MusicMixerProps) {
  const [settings, setSettings] = useState<MixerSettings>(DEFAULT_MIXER_SETTINGS)
  const [musicFile, setMusicFile] = useState<File | null>(null)
  const [musicUrl, setMusicUrl] = useState<string>('')
  const [previewing, setPreviewing] = useState(false)
  const [mixing, setMixing] = useState(false)
  const [mixedUrl, setMixedUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMusicFile(file)
    setMusicUrl(URL.createObjectURL(file))
    setMixedUrl(null)
  }

  const handlePreview = async () => {
    if (!voiceBlob || !musicUrl) return
    if (previewing) {
      audioMixer.stopPreview()
      setPreviewing(false)
      return
    }
    setPreviewing(true)
    try {
      await audioMixer.preview(voiceBlob, musicUrl, settings)
    } finally {
      setPreviewing(false)
    }
  }

  const handleMix = async () => {
    if (!voiceBlob || !musicUrl) return
    setMixing(true)
    try {
      const blob = await audioMixer.mix(voiceBlob, musicUrl, settings)
      const url = URL.createObjectURL(blob)
      setMixedUrl(url)
      onMixReady(blob)
    } catch (err) {
      alert('Erro na mixagem. Tente novamente.')
      console.error(err)
    } finally {
      setMixing(false)
    }
  }

  const SliderField = ({
    label, value, onChange, min, max, step, format,
  }: {
    label: string; value: number; onChange: (v: number) => void
    min: number; max: number; step: number; format: (v: number) => string
  }) => (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span><span className="font-medium text-gray-700">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary-700"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Music selection */}
      <Card padding="md">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Music size={16} className="text-primary-700" /> Fundo musical
        </h4>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {PRESET_MUSIC.map(p => (
            <button
              key={p.label}
              disabled={!p.url}
              onClick={() => setMusicUrl(p.url)}
              className={`p-2 rounded-xl border text-xs font-medium text-center transition-colors ${
                musicUrl === p.url ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'
              } disabled:opacity-40`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          fullWidth
          icon={<Upload size={14} />}
          onClick={() => fileRef.current?.click()}
        >
          {musicFile ? musicFile.name : 'Upload de música'}
        </Button>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
      </Card>

      {/* Mixer controls */}
      <Card padding="md">
        <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Volume2 size={16} className="text-primary-700" /> Ajustes de mixagem
        </h4>
        <div className="space-y-4">
          <SliderField
            label="Volume da voz"
            value={settings.voiceVolume}
            onChange={v => setSettings(s => ({ ...s, voiceVolume: v }))}
            min={0} max={1} step={0.05}
            format={v => `${Math.round(v * 100)}%`}
          />
          <SliderField
            label="Volume do fundo"
            value={settings.musicVolume}
            onChange={v => setSettings(s => ({ ...s, musicVolume: v }))}
            min={0} max={0.5} step={0.01}
            format={v => `${Math.round(v * 100)}%`}
          />
          <SliderField
            label="Fade-in (segundos)"
            value={settings.fadeInSeconds}
            onChange={v => setSettings(s => ({ ...s, fadeInSeconds: v }))}
            min={0} max={10} step={0.5}
            format={v => `${v}s`}
          />
          <SliderField
            label="Fade-out (segundos)"
            value={settings.fadeOutSeconds}
            onChange={v => setSettings(s => ({ ...s, fadeOutSeconds: v }))}
            min={0} max={10} step={0.5}
            format={v => `${v}s`}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.loopBackground}
              onChange={e => setSettings(s => ({ ...s, loopBackground: e.target.checked }))}
              className="w-4 h-4 accent-primary-700"
            />
            Repetir fundo musical até o fim da fala
          </label>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="md"
          icon={previewing ? <Square size={15} /> : <Play size={15} />}
          disabled={!voiceBlob || !musicUrl}
          onClick={handlePreview}
          className="flex-1"
        >
          {previewing ? 'Parar prévia' : 'Pré-ouvir'}
        </Button>
        <Button
          variant="gold"
          size="md"
          loading={mixing}
          icon={mixing ? <Loader size={15} className="animate-spin" /> : <Check size={15} />}
          disabled={!voiceBlob || !musicUrl || mixing}
          onClick={handleMix}
          className="flex-1"
        >
          {mixing ? 'Mixando...' : 'Mixar áudio'}
        </Button>
      </div>

      {/* Result */}
      {mixedUrl && (
        <div className="bg-mint-50 border border-mint-200 rounded-2xl p-3">
          <p className="text-mint-700 font-semibold text-sm mb-2">✅ Mixagem concluída!</p>
          <audio controls src={mixedUrl} className="w-full" />
          <a
            href={mixedUrl}
            download="devocional-mixada.wav"
            className="mt-2 block text-center text-xs text-mint-700 underline"
          >
            Baixar áudio mixado
          </a>
        </div>
      )}
    </div>
  )
}
