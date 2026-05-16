import { useRef, useState, useCallback } from 'react'
import { Mic, Square, Pause, Play, RotateCcw, Upload, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

interface AudioRecorderProps {
  onAudioReady: (blob: Blob) => void
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function AudioRecorder({ onAudioReady }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const startTimer = () => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setState('stopped')
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start(250)
      setState('recording')
      setSeconds(0)
      startTimer()
    } catch (err) {
      alert('Não foi possível acessar o microfone. Verifique as permissões.')
    }
  }, [])

  const pause = () => {
    mediaRef.current?.pause()
    stopTimer()
    setState('paused')
  }

  const resume = () => {
    mediaRef.current?.resume()
    startTimer()
    setState('recording')
  }

  const stop = () => {
    mediaRef.current?.stop()
    stopTimer()
  }

  const reset = () => {
    setAudioUrl(null)
    setAudioBlob(null)
    setState('idle')
    setSeconds(0)
  }

  const confirm = () => {
    if (audioBlob) onAudioReady(audioBlob)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAudioBlob(file)
    setAudioUrl(url)
    setState('stopped')
  }

  const isRecording = state === 'recording' || state === 'paused'

  return (
    <div className="space-y-4">
      {/* Waveform / indicator */}
      <div className={`rounded-2xl p-6 flex flex-col items-center gap-3 transition-colors ${
        state === 'recording' ? 'bg-red-50 border-2 border-red-300' :
        state === 'paused'    ? 'bg-yellow-50 border-2 border-yellow-300' :
        state === 'stopped'   ? 'bg-mint-50 border-2 border-mint-300' :
        'bg-gray-50 border-2 border-dashed border-gray-300'
      }`}>
        {state === 'idle' && <Mic size={36} className="text-gray-400" />}
        {state === 'recording' && (
          <div className="flex items-center gap-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-red-500 rounded-full animate-pulse"
                style={{
                  height: `${12 + Math.random() * 20}px`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: `${600 + i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}
        {state === 'paused' && <Pause size={36} className="text-yellow-500" />}
        {state === 'stopped' && <Check size={36} className="text-mint-600" />}

        <p className="text-2xl font-mono font-bold text-gray-700">{formatTime(seconds)}</p>
        <p className="text-sm text-gray-500">
          {state === 'idle' ? 'Pronto para gravar' :
           state === 'recording' ? '● Gravando...' :
           state === 'paused' ? 'Pausado' :
           ' Gravação concluída'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {state === 'idle' && (
          <>
            <Button variant="danger" size="lg" fullWidth icon={<Mic size={18} />} onClick={start}>
              Gravar áudio
            </Button>
            <Button variant="secondary" size="lg" icon={<Upload size={18} />} onClick={() => fileRef.current?.click()}>
              Upload
            </Button>
          </>
        )}

        {isRecording && (
          <>
            {state === 'recording' ? (
              <Button variant="ghost" size="lg" icon={<Pause size={18} />} onClick={pause} className="flex-1 border border-yellow-300 text-yellow-700">
                Pausar
              </Button>
            ) : (
              <Button variant="ghost" size="lg" icon={<Play size={18} />} onClick={resume} className="flex-1 border border-mint-300 text-mint-700">
                Retomar
              </Button>
            )}
            <Button variant="danger" size="lg" icon={<Square size={18} />} onClick={stop} className="flex-1">
              Parar
            </Button>
          </>
        )}

        {state === 'stopped' && (
          <>
            <Button variant="ghost" size="lg" icon={<RotateCcw size={16} />} onClick={reset} className="border border-gray-200">
              Regravar
            </Button>
            <Button variant="primary" size="lg" fullWidth icon={<Check size={16} />} onClick={confirm}>
              Usar este áudio
            </Button>
          </>
        )}
      </div>

      {/* Preview */}
      {audioUrl && state === 'stopped' && (
        <audio controls src={audioUrl} className="w-full rounded-xl" />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  )
}
