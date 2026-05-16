/**
 * Audio Mixer usando Web Audio API
 * Mixagem de voz + fundo musical com fade-in/out e loop automático.
 *
 * Para produção mais robusta, substituir pelo backend FFmpeg
 * implementando a mesma interface MixerEngine.
 */

import type { MixerSettings } from '@/types'

export interface MixerEngine {
  mix(voiceBlob: Blob, musicUrl: string, settings: MixerSettings): Promise<Blob>
  preview(voiceBlob: Blob, musicUrl: string, settings: MixerSettings): Promise<void>
  stopPreview(): void
}

// --- Web Audio Mixer ----------------------------------------------------------
export class WebAudioMixer implements MixerEngine {
  private previewSource: AudioBufferSourceNode | null = null
  private previewContext: AudioContext | null = null

  private async loadAudioBuffer(ctx: AudioContext, source: Blob | string): Promise<AudioBuffer> {
    let arrayBuffer: ArrayBuffer
    if (source instanceof Blob) {
      arrayBuffer = await source.arrayBuffer()
    } else {
      const res = await fetch(source)
      arrayBuffer = await res.arrayBuffer()
    }
    return ctx.decodeAudioData(arrayBuffer)
  }

  private buildGraph(
    ctx: AudioContext,
    voiceBuffer: AudioBuffer,
    musicBuffer: AudioBuffer,
    settings: MixerSettings,
  ): { destination: AudioNode; start: () => void; stop: () => void } {
    const { voiceVolume, musicVolume, fadeInSeconds, fadeOutSeconds, loopBackground } = settings

    const voiceGain = ctx.createGain()
    voiceGain.gain.setValueAtTime(voiceVolume, ctx.currentTime)

    const musicGain = ctx.createGain()
    const totalDuration = voiceBuffer.duration

    // Fade-in
    musicGain.gain.setValueAtTime(0, ctx.currentTime)
    musicGain.gain.linearRampToValueAtTime(musicVolume, ctx.currentTime + fadeInSeconds)
    // Fade-out
    musicGain.gain.setValueAtTime(musicVolume, ctx.currentTime + totalDuration - fadeOutSeconds)
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + totalDuration)

    const voiceSource = ctx.createBufferSource()
    voiceSource.buffer = voiceBuffer
    voiceSource.connect(voiceGain)
    voiceGain.connect(ctx.destination)

    const musicSource = ctx.createBufferSource()
    musicSource.buffer = musicBuffer
    musicSource.loop = loopBackground
    musicSource.connect(musicGain)
    musicGain.connect(ctx.destination)

    return {
      destination: ctx.destination,
      start: () => {
        voiceSource.start(0)
        musicSource.start(0)
      },
      stop: () => {
        try { voiceSource.stop() } catch (_) { /* noop */ }
        try { musicSource.stop() } catch (_) { /* noop */ }
      },
    }
  }

  async mix(voiceBlob: Blob, musicUrl: string, settings: MixerSettings): Promise<Blob> {
    const ctx = new OfflineAudioContext(2, 44100 * 1800, 44100) // max 30 min

    const [voiceBuffer, musicBuffer] = await Promise.all([
      this.loadAudioBuffer(ctx, voiceBlob),
      this.loadAudioBuffer(ctx, musicUrl),
    ])

    const actualDuration = voiceBuffer.duration
    const sampleRate = 44100
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(actualDuration * sampleRate), sampleRate)

    const [vB, mB] = await Promise.all([
      offlineCtx.decodeAudioData(await voiceBlob.arrayBuffer()),
      (async () => {
        const res = await fetch(musicUrl)
        return offlineCtx.decodeAudioData(await res.arrayBuffer())
      })(),
    ])

    const graph = this.buildGraph(offlineCtx as unknown as AudioContext, vB, mB, settings)
    graph.start()

    const renderedBuffer = await offlineCtx.startRendering()

    // Convert AudioBuffer > WAV Blob
    return audioBufferToWavBlob(renderedBuffer)
  }

  async preview(voiceBlob: Blob, musicUrl: string, settings: MixerSettings): Promise<void> {
    this.stopPreview()
    const ctx = new AudioContext()
    this.previewContext = ctx

    const [voiceBuffer, musicBuffer] = await Promise.all([
      this.loadAudioBuffer(ctx, voiceBlob),
      this.loadAudioBuffer(ctx, musicUrl),
    ])

    const graph = this.buildGraph(ctx, voiceBuffer, musicBuffer, settings)

    const voiceGain = ctx.createGain()
    voiceGain.gain.setValueAtTime(settings.voiceVolume, ctx.currentTime)
    const vSource = ctx.createBufferSource()
    vSource.buffer = voiceBuffer
    vSource.connect(voiceGain)
    voiceGain.connect(ctx.destination)

    const musicGain = ctx.createGain()
    const totalDuration = voiceBuffer.duration
    musicGain.gain.setValueAtTime(0, ctx.currentTime)
    musicGain.gain.linearRampToValueAtTime(settings.musicVolume, ctx.currentTime + settings.fadeInSeconds)
    musicGain.gain.setValueAtTime(settings.musicVolume, ctx.currentTime + totalDuration - settings.fadeOutSeconds)
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + totalDuration)

    const mSource = ctx.createBufferSource()
    mSource.buffer = musicBuffer
    mSource.loop = settings.loopBackground
    mSource.connect(musicGain)
    musicGain.connect(ctx.destination)

    this.previewSource = vSource

    vSource.start(0)
    mSource.start(0)

    graph.start()
  }

  stopPreview(): void {
    try { this.previewSource?.stop() } catch (_) { /* noop */ }
    try { this.previewContext?.close() } catch (_) { /* noop */ }
    this.previewSource = null
    this.previewContext = null
  }
}

// --- Helpers -----------------------------------------------------------------
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length * numChannels * 2 + 44
  const arrayBuffer = new ArrayBuffer(length)
  const view = new DataView(arrayBuffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + buffer.length * numChannels * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true)
  view.setUint16(32, numChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, buffer.length * numChannels * 2, true)

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

export const audioMixer = new WebAudioMixer()

export const DEFAULT_MIXER_SETTINGS: MixerSettings = {
  voiceVolume: 1.0,
  musicVolume: 0.15,
  fadeInSeconds: 2,
  fadeOutSeconds: 3,
  loopBackground: true,
}
