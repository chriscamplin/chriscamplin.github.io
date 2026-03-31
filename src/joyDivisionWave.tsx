import ReactDOM from 'react-dom/client'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three/webgpu'

import {
  LoadedWaveSource,
  loadWaveSourceFromFile,
  resolveWaveSource,
} from './helpers/joyDivisionAudio'
import './styles/joyDivisionWave.css'

const EMPTY_WAVEFORM = new Array(2048).fill(0)

function smoothSeries(samples: number[], radius: number) {
  if (radius <= 1) {
    return [...samples]
  }

  const prefix = new Array(samples.length + 1).fill(0)

  for (let index = 0; index < samples.length; index++) {
    prefix[index + 1] = prefix[index] + samples[index]
  }

  return samples.map((_, index) => {
    const start = Math.max(0, index - radius)
    const end = Math.min(samples.length, index + radius + 1)
    return (prefix[end] - prefix[start]) / Math.max(1, end - start)
  })
}

function sampleSeries(samples: number[], t: number) {
  const position = THREE.MathUtils.clamp(t, 0, 1) * Math.max(0, samples.length - 1)
  const left = Math.floor(position)
  const right = Math.min(samples.length - 1, Math.ceil(position))
  const alpha = position - left

  return samples[left] * (1 - alpha) + samples[right] * alpha
}

function WaveTerrain({
  staticWaveform,
  liveWaveformRef,
  playbackProgressRef,
  usePlaybackWindow,
  isRealtimeActive,
  rows = 72,
  samples = 180,
  width = 36,
  depth = 20,
  radius = 0.018,
}: {
  staticWaveform: number[]
  liveWaveformRef: React.RefObject<number[]>
  playbackProgressRef: React.RefObject<number>
  usePlaybackWindow: boolean
  isRealtimeActive: boolean
  rows?: number
  samples?: number
  width?: number
  depth?: number
  radius?: number
}) {
  const material = useMemo(() => {
    const nextMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
    return nextMaterial
  }, [])

  const geometries = useMemo(() => {
    return Array.from({ length: rows }, () => {
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(samples * 3)
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      return geometry
    })
  }, [rows, samples])

  const lines = useMemo(() => {
    return geometries.map((geometry) => {
      const line = new THREE.Line(geometry, material)
      line.frustumCulled = false
      return line
    })
  }, [geometries, material])

  const rowProfiles = useMemo(() => {
    const waveformSamples = staticWaveform.length ? staticWaveform : EMPTY_WAVEFORM
    const cache = new Map<number, number[]>()

    const getSmoothed = (radius: number) => {
      const rounded = Math.max(1, Math.round(radius))
      const cached = cache.get(rounded)

      if (cached) {
        return cached
      }

      const next = smoothSeries(waveformSamples, rounded)
      cache.set(rounded, next)
      return next
    }

    return Array.from({ length: rows }, (_, row) => {
      const v = row / (rows - 1)
      const rowEnvelope = Math.pow(Math.sin(v * Math.PI), 0.9)
      const depthOffset = THREE.MathUtils.lerp(-depth / 2, depth / 2, v)
      const broadRadius = THREE.MathUtils.lerp(62, 16, rowEnvelope)
      const detailRadius = Math.max(2, broadRadius * 0.22)
      return {
        depthOffset,
        rowEnvelope,
        broadSeries: getSmoothed(broadRadius),
        detailSeries: getSmoothed(detailRadius),
        shift: (v - 0.5) * 0.08,
      }
    })
  }, [depth, rows, staticWaveform])

  const updateWaveLines = () => {
    const liveWaveform = liveWaveformRef.current?.length
      ? liveWaveformRef.current
      : EMPTY_WAVEFORM
    const playbackProgress = THREE.MathUtils.clamp(playbackProgressRef.current ?? 0, 0, 1)

    for (let row = 0; row < rows; row++) {
      const geometry = geometries[row]
      const profile = rowProfiles[row]
      const positions = geometry.attributes.position.array as Float32Array

      for (let col = 0; col < samples; col++) {
        const u = col / (samples - 1)
        const x = THREE.MathUtils.lerp(-width / 2, width / 2, u)
        const xEnvelope = Math.pow(Math.max(0, 1 - Math.abs(x) / (width * 0.48)), 1.65)
        const staticSampleT = THREE.MathUtils.clamp(
          u + profile.shift * (1 - profile.rowEnvelope * 0.35),
          0,
          1
        )
        const playbackWindow = THREE.MathUtils.lerp(0.95, 0.58, profile.rowEnvelope)
        const animatedSampleT = THREE.MathUtils.clamp(
          playbackProgress + (u - 0.5) * playbackWindow + profile.shift * 0.26,
          0,
          1
        )
        const sampleT = usePlaybackWindow ? animatedSampleT : staticSampleT
        const broadSample = sampleSeries(profile.broadSeries, sampleT)
        const detailSample = sampleSeries(profile.detailSeries, sampleT)
        const lift = Math.pow(broadSample, 1.28)
        const crest = Math.max(0, detailSample - broadSample * 0.8)
        const rowGain = 0.15 + profile.rowEnvelope * 1.2
        const liveSample = sampleSeries(
          liveWaveform,
          THREE.MathUtils.clamp(u + profile.shift * 0.34, 0, 1)
        )
        const liveLift = isRealtimeActive
          ? Math.pow(liveSample, 1.42) * (0.32 + profile.rowEnvelope * 1.12)
          : 0
        const y = ((lift * 3.2 + crest * 6.8) + liveLift * 4.4) * xEnvelope * rowGain
        const offset = col * 3

        positions[offset] = x
        positions[offset + 1] = y
        positions[offset + 2] = profile.depthOffset
      }

      geometry.attributes.position.needsUpdate = true
    }
  }

  useFrame(() => {
    if (isRealtimeActive) {
      updateWaveLines()
    }
  })

  useEffect(() => {
    updateWaveLines()
  }, [geometries, isRealtimeActive, rowProfiles, samples, usePlaybackWindow, width])

  useEffect(() => {
    return () => {
      for (const geometry of geometries) geometry.dispose()
    }
  }, [geometries])

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  return (
    <group rotation={[0, 0.82, 0]}>
      {lines.map((line, index) => (
        <primitive
          key={index}
          object={line}
        />
      ))}
    </group>
  )
}

function App() {
  const initialSource = new URLSearchParams(window.location.search).get('source') ?? ''
  const [inputValue, setInputValue] = useState(initialSource)
  const [waveform, setWaveform] = useState<number[]>([])
  const [source, setSource] = useState<LoadedWaveSource | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [isRealtimeActive, setIsRealtimeActive] = useState(false)
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false)
  const [statusMessage, setStatusMessage] = useState(
    'Load a local file, a direct audio URL, a waveform JSON/image URL, or a SoundCloud track URL via a resolver.'
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioElementRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const analysisFrameRef = useRef<number | null>(null)
  const playbackUrlRef = useRef<string | null>(null)
  const liveWaveformRef = useRef<number[]>([...EMPTY_WAVEFORM])
  const playbackProgressRef = useRef(0)

  useEffect(() => {
    return () => {
      stopRealtimeAnalysis(true)

      if (audioContextRef.current) {
        void audioContextRef.current.close()
      }

      if (playbackUrlRef.current) {
        URL.revokeObjectURL(playbackUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    stopRealtimeAnalysis(true)
    setHasStartedPlayback(false)
    playbackProgressRef.current = 0
    liveWaveformRef.current = [...EMPTY_WAVEFORM]
  }, [source?.playbackUrl])

  useEffect(() => {
    if (!initialSource) {
      return
    }

    void handleUrlLoad(initialSource)
  }, [])

  async function getAudioContext() {
    if (audioContextRef.current) {
      return audioContextRef.current
    }

    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext

    if (!AudioContextConstructor) {
      throw new Error('Web Audio is unavailable in this browser.')
    }

    audioContextRef.current = new AudioContextConstructor()
    return audioContextRef.current
  }

  async function ensureLiveAnalyser() {
    const audioElement = audioElementRef.current

    if (!audioElement) {
      throw new Error('Missing audio element for live analysis.')
    }

    const audioContext = await getAudioContext()

    if (!analyserRef.current) {
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.78
      analyserRef.current = analyser
    }

    if (!mediaSourceRef.current) {
      const mediaSource = audioContext.createMediaElementSource(audioElement)
      mediaSource.connect(analyserRef.current)
      analyserRef.current.connect(audioContext.destination)
      mediaSourceRef.current = mediaSource
    }

    return { analyser: analyserRef.current, audioContext, audioElement }
  }

  function createLiveWaveform(samples: Uint8Array) {
    const normalized = Array.from(samples, (value) => value / 255)

    return smoothSeries(normalized, 8)
  }

  function stopRealtimeAnalysis(resetLiveWaveform = false) {
    if (analysisFrameRef.current !== null) {
      cancelAnimationFrame(analysisFrameRef.current)
      analysisFrameRef.current = null
    }

    setIsRealtimeActive(false)

    if (resetLiveWaveform) {
      liveWaveformRef.current = [...EMPTY_WAVEFORM]
    }
  }

  async function handleAudioPlay() {
    if (source?.sourceType !== 'audio') {
      return
    }

    try {
      const { analyser, audioContext, audioElement } = await ensureLiveAnalyser()
      await audioContext.resume()

      if (analysisFrameRef.current !== null) {
        return
      }

      const frequencyData = new Uint8Array(analyser.frequencyBinCount)
      setHasStartedPlayback(true)
      setIsRealtimeActive(true)

      const tick = () => {
        analyser.getByteFrequencyData(frequencyData)
        liveWaveformRef.current = createLiveWaveform(frequencyData)
        playbackProgressRef.current = audioElement.duration
          ? audioElement.currentTime / audioElement.duration
          : 0
        analysisFrameRef.current = requestAnimationFrame(tick)
      }

      tick()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Realtime analysis could not start.'

      setStatus('error')
      setStatusMessage(message)
    }
  }

  function handleAudioPause() {
    const audioElement = audioElementRef.current

    if (audioElement?.duration) {
      playbackProgressRef.current = audioElement.currentTime / audioElement.duration
    }

    stopRealtimeAnalysis(true)
  }

  function formatLoadedMessage(loaded: LoadedWaveSource) {
    const baseMessage = loaded.note ?? `Loaded ${loaded.title}.`

    if (loaded.sourceType === 'audio' && loaded.playbackUrl) {
      return `${baseMessage} Press play below to drive the live analyser.`
    }

    return baseMessage
  }

  function releasePlaybackObjectUrl() {
    if (!playbackUrlRef.current) {
      return
    }

    URL.revokeObjectURL(playbackUrlRef.current)
    playbackUrlRef.current = null
  }

  function rememberPlaybackObjectUrl(nextPlaybackUrl?: string) {
    releasePlaybackObjectUrl()

    if (nextPlaybackUrl?.startsWith('blob:')) {
      playbackUrlRef.current = nextPlaybackUrl
    }
  }

  function updateSourceQuery(nextValue: string | null) {
    const url = new URL(window.location.href)

    if (nextValue) {
      url.searchParams.set('source', nextValue)
    } else {
      url.searchParams.delete('source')
    }

    window.history.replaceState({}, '', url)
  }

  async function handleUrlLoad(rawValue = inputValue) {
    setStatus('loading')
    setStatusMessage('Fetching and analyzing source data...')

    try {
      const audioContext = await getAudioContext()
      const loaded = await resolveWaveSource(rawValue, audioContext)

      rememberPlaybackObjectUrl(loaded.playbackUrl)
      setWaveform(loaded.samples)
      setSource(loaded)
      setStatus('ready')
      setStatusMessage(formatLoadedMessage(loaded))
      setInputValue(rawValue)
      updateSourceQuery(rawValue)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The source could not be analyzed.'

      setStatus('error')
      setStatusMessage(message)
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setStatus('loading')
    setStatusMessage(`Analyzing ${file.name}...`)

    try {
      const audioContext = await getAudioContext()
      const loaded = await loadWaveSourceFromFile(file, audioContext)

      rememberPlaybackObjectUrl(loaded.playbackUrl)
      setWaveform(loaded.samples)
      setSource(loaded)
      setStatus('ready')
      setStatusMessage(formatLoadedMessage(loaded))
      setInputValue(file.name)
      updateSourceQuery(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The local file could not be analyzed.'

      setStatus('error')
      setStatusMessage(message)
    } finally {
      event.target.value = ''
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void handleUrlLoad()
  }

  return (
    <main className='JoyDivisionWavePage'>
      <header className='JoyDivisionWaveHeader'>
        <a className='JoyDivisionWaveLink' href='/'>
          Back to portfolio
        </a>
        <h1>Joy Division Wave</h1>
        <p>
          Load a direct audio file, local upload, or precomputed waveform asset and the
          lines are rebuilt from that source instead of the old random peak generator.
        </p>
      </header>

      <section className='JoyDivisionWaveControls'>
        <form className='JoyDivisionWaveForm' onSubmit={handleSubmit}>
          <label className='JoyDivisionWaveField'>
            <span>Audio or waveform source</span>
            <input
              type='text'
              inputMode='url'
              autoCapitalize='off'
              autoCorrect='off'
              spellCheck={false}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder='https://example.com/track.mp3 or https://soundcloud.com/...'
            />
          </label>

          <div className='JoyDivisionWaveActions'>
            <button type='submit' disabled={status === 'loading'}>
              {status === 'loading' ? 'Analyzing...' : 'Load URL'}
            </button>

            <button
              type='button'
              className='JoyDivisionWaveSecondaryButton'
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </button>
          </div>

          <input
            ref={fileInputRef}
            className='JoyDivisionWaveHiddenInput'
            type='file'
            accept='audio/*,application/json,image/*,.json'
            onChange={handleFileChange}
          />
        </form>

        <aside className='JoyDivisionWaveStatusCard'>
          <p className='JoyDivisionWaveStatusEyebrow'>Status</p>
          <p className={`JoyDivisionWaveStatusCopy JoyDivisionWaveStatusCopy${status}`}>
            {statusMessage}
          </p>

          <p className='JoyDivisionWaveHint'>
            Direct audio URLs need CORS. SoundCloud page URLs are wired for a resolver
            path, while SoundCloud-style waveform assets can load directly if they are
            fetchable.
          </p>

          {source && (
            <div className='JoyDivisionWaveSourceMeta'>
              <p className='JoyDivisionWaveSourceTitle'>{source.title}</p>
              <p className='JoyDivisionWaveHint'>
                {source.provider ? `${source.provider} · ` : ''}
                {source.sourceType}
              </p>

              {source.attributionUrl && (
                <a
                  className='JoyDivisionWaveMetaLink'
                  href={source.attributionUrl}
                  target='_blank'
                  rel='noreferrer'
                >
                  Open source link
                </a>
              )}

              {source.playbackUrl && (
                <audio
                  ref={audioElementRef}
                  className='JoyDivisionWaveAudio'
                  controls
                  preload='metadata'
                  crossOrigin='anonymous'
                  src={source.playbackUrl}
                  onPlay={() => void handleAudioPlay()}
                  onPause={handleAudioPause}
                  onEnded={handleAudioPause}
                  onSeeked={() => {
                    const audioElement = audioElementRef.current

                    if (audioElement?.duration) {
                      playbackProgressRef.current =
                        audioElement.currentTime / audioElement.duration
                    }
                  }}
                />
              )}
            </div>
          )}
        </aside>
      </section>

      <section className='JoyDivisionWaveCanvasShell'>
        <Canvas
          frameloop={isRealtimeActive ? 'always' : 'demand'}
          camera={{ position: [0, 10, 24], fov: 30 }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 1.5, 0)
          }}
          gl={async (props) => {
            const renderer = new THREE.WebGPURenderer({
              ...(props as ConstructorParameters<typeof THREE.WebGPURenderer>[0]),
              antialias: true,
            })

            await renderer.init()
            return renderer
          }}
        >
          <color attach='background' args={['black']} />
          <WaveTerrain
            staticWaveform={waveform}
            liveWaveformRef={liveWaveformRef}
            playbackProgressRef={playbackProgressRef}
            usePlaybackWindow={source?.sourceType === 'audio' && hasStartedPlayback}
            isRealtimeActive={isRealtimeActive}
          />
          <OrbitControls enablePan={false} />
        </Canvas>
      </section>
    </main>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing root element for Joy Division Wave page.')
}

ReactDOM.createRoot(rootElement).render(<App />)
