import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, ExternalLink, AlertCircle } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  title?: string
  compact?: boolean
}

function formatTime(s: number) {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const MIME_BY_EXT: Record<string, string> = {
  wav:  'audio/wav',
  mp3:  'audio/mpeg',
  m4a:  'audio/mp4',
  aac:  'audio/aac',
  ogg:  'audio/ogg',
  webm: 'audio/webm',
}

/**
 * Recuperacao iOS: faz fetch do audio e cria Blob URL com MIME type correto.
 * Resolve bug de arquivos .wav/.mp3 armazenados no Supabase como audio/webm.
 */
async function createBlobUrl(url: string): Promise<string | null> {
  try {
    const cleanPath = url.split('?')[0]
    const ext = cleanPath.split('.').pop()?.toLowerCase() ?? ''
    const forcedMime = MIME_BY_EXT[ext]
    if (!forcedMime || forcedMime === 'audio/webm') return null
    const response = await fetch(url)
    if (!response.ok) return null
    const bytes = await response.arrayBuffer()
    const blob = new Blob([bytes], { type: forcedMime })
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

export default function AudioPlayer({ src, title, compact }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const recoveryAttemptedRef = useRef(false)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    recoveryAttemptedRef.current = false

    const onTime      = () => setCurrentTime(audio.currentTime)
    const onDuration  = () => setDuration(isFinite(audio.duration) ? audio.duration : 0)
    const onEnded     = () => setPlaying(false)
    const onWaiting   = () => setLoading(true)
    const onCanPlay   = () => { setLoading(false); setAudioError(null) }
    const onStalled   = () => setLoading(true)

    const onError = () => {
      const err = audio.error
      setLoading(false)
      setPlaying(false)

      if (!err) {
        setAudioError('Nao foi possivel carregar o audio. Tente novamente.')
        return
      }

      if (err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        if (!recoveryAttemptedRef.current) {
          recoveryAttemptedRef.current = true
          setLoading(true)
          createBlobUrl(src).then(blobUrl => {
            if (blobUrl && audioRef.current) {
              if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
              blobUrlRef.current = blobUrl
              audioRef.current.src = blobUrl
              audioRef.current.load()
              setLoading(false)
              setAudioError(null)
            } else {
              setLoading(false)
              setAudioError('Formato de audio nao compativel com iPhone/iOS. Use o botao abaixo para ouvir externamente.')
            }
          })
        } else {
          setAudioError('Formato de audio nao compativel com iPhone/iOS. Use o botao abaixo para ouvir externamente.')
        }
        return
      }

      if (err.code === MediaError.MEDIA_ERR_NETWORK) {
        setAudioError('Erro de conexao ao carregar o audio. Verifique sua internet e tente novamente.')
      } else {
        setAudioError('Nao foi possivel carregar o audio. Tente novamente.')
      }
    }

    audio.addEventListener('timeupdate',     onTime)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('ended',          onEnded)
    audio.addEventListener('waiting',        onWaiting)
    audio.addEventListener('canplay',        onCanPlay)
    audio.addEventListener('stalled',        onStalled)
    audio.addEventListener('error',          onError)

    return () => {
      audio.removeEventListener('timeupdate',     onTime)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('ended',          onEnded)
      audio.removeEventListener('waiting',        onWaiting)
      audio.removeEventListener('canplay',        onCanPlay)
      audio.removeEventListener('stalled',        onStalled)
      audio.removeEventListener('error',          onError)
    }
  }, [src])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }

    setAudioError(null)
    setLoading(true)

    try {
      await audio.play()
      setPlaying(true)
      setLoading(false)
    } catch (err) {
      console.error('[AudioPlayer] play() falhou:', err)
      setLoading(false)
      setPlaying(false)

      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setAudioError('O navegador bloqueou a reproducao. Toque novamente para ouvir.')
      } else if (err instanceof DOMException && err.name === 'NotSupportedError') {
        setAudioError('Formato de audio nao suportado neste dispositivo.')
      } else {
        setAudioError('Nao foi possivel reproduzir o audio. Tente novamente.')
      }
    }
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio || audioError) return
    audio.currentTime = 0
    audio.play().then(() => setPlaying(true)).catch(() => {})
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  const FallbackLink = () => (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs underline opacity-80 mt-2"
    >
      <ExternalLink size={12} />
      Abrir audio em nova janela
    </a>
  )

  if (compact) {
    return (
      <div className="bg-primary-50 rounded-2xl p-3">
        <audio ref={audioRef} src={src} preload="none" playsInline crossOrigin="anonymous" />
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            disabled={!!audioError}
            className="w-10 h-10 rounded-full bg-primary-800 text-white flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            {title && <p className="text-xs font-medium text-primary-800 truncate mb-1">{title}</p>}
            <div className="w-full h-1.5 bg-primary-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-700 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-primary-600 mt-1">{formatTime(currentTime)} / {formatTime(duration)}</p>
          </div>
        </div>
        {audioError && (
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-start gap-1.5 text-xs text-red-600">
              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
              <span>{audioError}</span>
            </div>
            <FallbackLink />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-2xl p-5 text-white shadow-card">
      <audio ref={audioRef} src={src} preload="none" playsInline crossOrigin="anonymous" />
      {title && <p className="text-sm font-medium text-primary-200 mb-1 truncate">Devocional de hoje</p>}
      <p className="font-semibold text-white mb-4 truncate">{title ?? 'Ouca a devocional'}</p>
      <div
        className="w-full h-2 bg-primary-700 rounded-full mb-3 cursor-pointer overflow-hidden"
        onClick={(e) => {
          if (!audioRef.current || audioError) return
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          audioRef.current.currentTime = ratio * duration
        }}
      >
        <div className="h-full bg-gold-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-primary-300 mb-5">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={restart}
          disabled={!!audioError}
          className="text-primary-300 hover:text-white transition-colors disabled:opacity-40"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={toggle}
          className="w-14 h-14 rounded-full bg-gold-500 text-primary-900 flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:bg-gold-400"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
          ) : playing ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
        </button>
        <div className="w-8" />
      </div>
      {audioError && (
        <div className="mt-4 bg-white/10 rounded-xl p-3">
          <div className="flex items-start gap-2 text-sm text-white/90">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-gold-400" />
            <span>{audioError}</span>
          </div>
          <div className="mt-2">
            <FallbackLink />
          </div>
        </div>
      )}
    </div>
  )
}
