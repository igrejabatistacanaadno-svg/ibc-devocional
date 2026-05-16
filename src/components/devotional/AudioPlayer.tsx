import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  title?: string
  compact?: boolean
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ src, title, compact }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onDuration = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)
    const onWaiting = () => setLoading(true)
    const onCanPlay = () => setLoading(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onCanPlay)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('canplay', onCanPlay)
    }
  }, [])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      await audio.play()
      setPlaying(true)
    }
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play()
    setPlaying(true)
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-primary-50 rounded-2xl p-3">
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full bg-primary-800 text-white flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition-transform"
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
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-2xl p-5 text-white shadow-card">
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && <p className="text-sm font-medium text-primary-200 mb-1 truncate">Devocional de hoje</p>}
      <p className="font-semibold text-white mb-4 truncate">{title ?? 'Ouça a devocional'}</p>

      {/* Progress bar */}
      <div
        className="w-full h-2 bg-primary-700 rounded-full mb-3 cursor-pointer overflow-hidden"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          if (audioRef.current) audioRef.current.currentTime = ratio * duration
        }}
      >
        <div
          className="h-full bg-gold-400 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-primary-300 mb-5">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button onClick={restart} className="text-primary-300 hover:text-white transition-colors">
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
    </div>
  )
}
