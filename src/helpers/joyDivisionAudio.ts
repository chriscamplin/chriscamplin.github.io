export type LoadedWaveSource = {
  title: string
  sourceType: 'audio' | 'waveform-json' | 'waveform-image'
  samples: number[]
  sourceUrl?: string
  playbackUrl?: string
  attributionUrl?: string
  provider?: string
  note?: string
}

type WaveSourceMeta = {
  title?: string
  sourceUrl?: string
  playbackUrl?: string
  attributionUrl?: string
  provider?: string
  note?: string
}

type SoundCloudResolverPayload = {
  title?: string
  audioUrl?: string
  waveformUrl?: string
  playbackUrl?: string
  attributionUrl?: string
  provider?: string
  note?: string
}

const TARGET_SAMPLE_COUNT = 2048

const AUDIO_EXTENSION_RE =
  /\.(aac|aif|aiff|flac|m4a|mp2|mp3|oga|ogg|opus|wav|weba|webm|mp4)(?:$|[?#])/i
const IMAGE_EXTENSION_RE = /\.(avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i
const JSON_EXTENSION_RE = /\.(json)(?:$|[?#])/i
const SOUNDCLOUD_HOST_RE = /(^|\.)soundcloud\.com$/i
const SOUNDCLOUD_SHORT_HOST_RE = /(^|\.)on\.soundcloud\.com$/i
const DEFAULT_SOUNDCLOUD_RESOLVER_PATH = '/api/soundcloud-resolve'

export async function loadWaveSourceFromFile(
  file: File,
  audioContext: AudioContext
): Promise<LoadedWaveSource> {
  const arrayBuffer = await file.arrayBuffer()
  const audioBuffer = await decodeAudio(arrayBuffer, audioContext)

  return {
    title: file.name,
    sourceType: 'audio',
    samples: extractWaveformSamplesFromAudioBuffer(audioBuffer),
    playbackUrl: URL.createObjectURL(file),
    note: 'Loaded from a local file.',
  }
}

export async function resolveWaveSource(
  rawValue: string,
  audioContext: AudioContext
): Promise<LoadedWaveSource> {
  const inputUrl = toInputUrl(rawValue)

  if (isSoundCloudTrackUrl(inputUrl)) {
    return resolveSoundCloudTrack(inputUrl, audioContext)
  }

  return loadWaveSourceAsset(inputUrl, audioContext, {
    title: titleFromUrl(inputUrl),
    sourceUrl: inputUrl.toString(),
    playbackUrl: inputUrl.toString(),
    attributionUrl: inputUrl.toString(),
  })
}

function toInputUrl(rawValue: string) {
  const trimmed = rawValue.trim()

  if (!trimmed) {
    throw new Error('Enter a URL for an audio file, waveform asset, or SoundCloud track.')
  }

  try {
    const parsed = new URL(trimmed, window.location.href)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error()
    }

    return parsed
  } catch {
    throw new Error('Enter a valid HTTP or HTTPS URL.')
  }
}

async function resolveSoundCloudTrack(
  inputUrl: URL,
  audioContext: AudioContext
): Promise<LoadedWaveSource> {
  const resolverBase =
    import.meta.env.VITE_SOUNDCLOUD_RESOLVER_URL?.trim() ||
    DEFAULT_SOUNDCLOUD_RESOLVER_PATH

  if (resolverBase) {
    const resolverUrl = new URL(resolverBase, window.location.origin)
    resolverUrl.searchParams.set('url', inputUrl.toString())

    let payload: SoundCloudResolverPayload

    try {
      payload = (await fetchJson(resolverUrl.toString())) as SoundCloudResolverPayload
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('404') &&
        resolverBase === DEFAULT_SOUNDCLOUD_RESOLVER_PATH
      ) {
        throw new Error(
          'No SoundCloud resolver is deployed at `/api/soundcloud-resolve` on this host. GitHub Pages cannot run it. Deploy this repo somewhere with serverless support, or point `VITE_SOUNDCLOUD_RESOLVER_URL` at a deployed resolver.'
        )
      }

      throw error
    }

    if (payload.waveformUrl) {
      const loaded = await loadWaveSourceAsset(
        new URL(payload.waveformUrl, resolverUrl),
        audioContext,
        {
          title: payload.title ?? titleFromUrl(inputUrl),
          sourceUrl: inputUrl.toString(),
          playbackUrl: payload.playbackUrl,
          attributionUrl: payload.attributionUrl ?? inputUrl.toString(),
          provider: payload.provider ?? 'SoundCloud',
          note: payload.note,
        }
      )

      return {
        ...loaded,
        title: payload.title ?? loaded.title,
        playbackUrl: payload.playbackUrl ?? loaded.playbackUrl,
      }
    }

    if (payload.audioUrl) {
      const loaded = await loadWaveSourceAsset(
        new URL(payload.audioUrl, resolverUrl),
        audioContext,
        {
          title: payload.title ?? titleFromUrl(inputUrl),
          sourceUrl: inputUrl.toString(),
          playbackUrl: payload.playbackUrl ?? payload.audioUrl,
          attributionUrl: payload.attributionUrl ?? inputUrl.toString(),
          provider: payload.provider ?? 'SoundCloud',
          note: payload.note,
        }
      )

      return {
        ...loaded,
        title: payload.title ?? loaded.title,
        playbackUrl: payload.playbackUrl ?? payload.audioUrl,
      }
    }

    throw new Error(
      'The SoundCloud resolver responded, but it did not provide an `audioUrl` or `waveformUrl`.'
    )
  }

  const embed = await getSoundCloudEmbed(inputUrl.toString())
  const trackTitle = embed?.title ? `"${embed.title}"` : 'that SoundCloud track'

  throw new Error(
    `SoundCloud still supports embeds for ${trackTitle}, but this static page cannot turn a track page URL into raw audio or waveform data on its own. Add a server-side resolver via VITE_SOUNDCLOUD_RESOLVER_URL, or use a direct audio or waveform asset URL instead.`
  )
}

async function getSoundCloudEmbed(sourceUrl: string) {
  try {
    const oEmbedUrl = new URL('https://soundcloud.com/oembed')
    oEmbedUrl.searchParams.set('format', 'json')
    oEmbedUrl.searchParams.set('url', sourceUrl)

    return (await fetchJson(oEmbedUrl.toString())) as { title?: string } | null
  } catch {
    return null
  }
}

async function loadWaveSourceAsset(
  assetUrl: URL,
  audioContext: AudioContext,
  meta: WaveSourceMeta
): Promise<LoadedWaveSource> {
  const response = await fetch(assetUrl.toString(), { mode: 'cors' })

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} for ${assetUrl.hostname}.`)
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  const pathname = assetUrl.pathname.toLowerCase()
  const normalizedMeta: WaveSourceMeta = {
    title: meta.title ?? titleFromUrl(assetUrl),
    sourceUrl: meta.sourceUrl ?? assetUrl.toString(),
    playbackUrl: meta.playbackUrl,
    attributionUrl: meta.attributionUrl ?? assetUrl.toString(),
    provider: meta.provider,
    note: meta.note,
  }

  if (contentType.includes('mpegurl') || pathname.endsWith('.m3u8')) {
    throw new Error(
      'HLS playlist URLs are not decoded directly in this page. Use a waveform asset, a directly fetchable audio file, or a server resolver that returns one.'
    )
  }

  if (
    contentType.includes('json') ||
    JSON_EXTENSION_RE.test(pathname)
  ) {
    const payload = await response.json()

    return {
      title: normalizedMeta.title ?? titleFromUrl(assetUrl),
      sourceType: 'waveform-json',
      samples: extractWaveformSamplesFromJson(payload),
      sourceUrl: normalizedMeta.sourceUrl,
      playbackUrl: normalizedMeta.playbackUrl,
      attributionUrl: normalizedMeta.attributionUrl,
      provider: normalizedMeta.provider,
      note: normalizedMeta.note ?? 'Loaded from precomputed waveform data.',
    }
  }

  if (contentType.startsWith('image/') || IMAGE_EXTENSION_RE.test(pathname)) {
    const blob = await response.blob()

    return {
      title: normalizedMeta.title ?? titleFromUrl(assetUrl),
      sourceType: 'waveform-image',
      samples: await extractWaveformSamplesFromImageBlob(blob),
      sourceUrl: normalizedMeta.sourceUrl,
      playbackUrl: normalizedMeta.playbackUrl,
      attributionUrl: normalizedMeta.attributionUrl,
      provider: normalizedMeta.provider,
      note: normalizedMeta.note ?? 'Loaded from a waveform image asset.',
    }
  }

  if (
    contentType.startsWith('audio/') ||
    contentType.startsWith('video/') ||
    contentType.includes('octet-stream') ||
    AUDIO_EXTENSION_RE.test(pathname)
  ) {
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await decodeAudio(arrayBuffer, audioContext)

    return {
      title: normalizedMeta.title ?? titleFromUrl(assetUrl),
      sourceType: 'audio',
      samples: extractWaveformSamplesFromAudioBuffer(audioBuffer),
      sourceUrl: normalizedMeta.sourceUrl,
      playbackUrl: normalizedMeta.playbackUrl ?? assetUrl.toString(),
      attributionUrl: normalizedMeta.attributionUrl,
      provider: normalizedMeta.provider,
      note: normalizedMeta.note ?? 'Loaded from decoded audio data.',
    }
  }

  throw new Error(
    `Unsupported asset type "${contentType || 'unknown'}". Use audio, waveform JSON, or waveform images.`
  )
}

async function fetchJson(url: string) {
  const response = await fetch(url, { mode: 'cors' })

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}.`)
  }

  return response.json()
}

function isSoundCloudTrackUrl(url: URL) {
  return (
    (SOUNDCLOUD_HOST_RE.test(url.hostname) || SOUNDCLOUD_SHORT_HOST_RE.test(url.hostname)) &&
    !url.pathname.startsWith('/oembed')
  )
}

function titleFromUrl(url: URL) {
  const leaf = url.pathname.split('/').filter(Boolean).pop()

  if (!leaf) {
    return url.hostname
  }

  return decodeURIComponent(leaf)
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
}

async function decodeAudio(arrayBuffer: ArrayBuffer, audioContext: AudioContext) {
  try {
    return await audioContext.decodeAudioData(arrayBuffer.slice(0))
  } catch {
    throw new Error(
      'The source could not be decoded as audio. If this is a remote URL, check that it points to a real audio file and allows cross-origin requests.'
    )
  }
}

function extractWaveformSamplesFromAudioBuffer(audioBuffer: AudioBuffer) {
  const { length, numberOfChannels } = audioBuffer
  const channels = Array.from({ length: numberOfChannels }, (_, index) =>
    audioBuffer.getChannelData(index)
  )

  const bucketSamples = Array.from({ length: TARGET_SAMPLE_COUNT }, (_, index) => {
    const start = Math.floor((index / TARGET_SAMPLE_COUNT) * length)
    const end = Math.max(start + 1, Math.floor(((index + 1) / TARGET_SAMPLE_COUNT) * length))

    let peak = 0
    let sumSquares = 0
    let count = 0

    for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
      let mono = 0

      for (const channel of channels) {
        mono += channel[sampleIndex] ?? 0
      }

      mono /= numberOfChannels

      const absolute = Math.abs(mono)
      peak = Math.max(peak, absolute)
      sumSquares += mono * mono
      count++
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, count))
    return peak * 0.65 + rms * 0.35
  })

  return normalizeSamples(bucketSamples.map((value) => Math.pow(value, 0.82)))
}

function extractWaveformSamplesFromJson(payload: unknown) {
  if (Array.isArray(payload)) {
    return normalizeSamples(payload.filter(isFiniteNumber))
  }

  if (!isRecord(payload)) {
    throw new Error('Waveform JSON must be an array or an object containing sample data.')
  }

  if (Array.isArray(payload.samples)) {
    const numericSamples = payload.samples.filter(isFiniteNumber)
    const height = isFiniteNumber(payload.height)
      ? Math.max(1, payload.height)
      : Math.max(1, ...numericSamples)

    return normalizeSamples(numericSamples.map((value) => value / height))
  }

  if (Array.isArray(payload.data)) {
    return normalizeSamples(payload.data.filter(isFiniteNumber))
  }

  throw new Error(
    'Waveform JSON did not include a supported sample array. Expected `samples` or `data`.'
  )
}

async function extractWaveformSamplesFromImageBlob(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas 2D is unavailable in this browser.')
    }

    context.drawImage(image, 0, 0)

    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)
    const columns = new Array(width).fill(0)

    for (let x = 0; x < width; x++) {
      let top = height
      let bottom = -1

      for (let y = 0; y < height; y++) {
        const alpha = data[(y * width + x) * 4 + 3]

        if (alpha > 24) {
          top = Math.min(top, y)
          bottom = Math.max(bottom, y)
        }
      }

      if (bottom >= top) {
        columns[x] = (bottom - top + 1) / height
      }
    }

    return normalizeSamples(resampleLinear(columns, TARGET_SAMPLE_COUNT))
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('The waveform image could not be decoded.'))
    image.src = source
  })
}

function normalizeSamples(samples: number[]) {
  if (!samples.length) {
    return new Array(TARGET_SAMPLE_COUNT).fill(0)
  }

  const clipped = samples.map((sample) => Math.max(0, sample))
  const maxValue = Math.max(...clipped)

  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return new Array(TARGET_SAMPLE_COUNT).fill(0)
  }

  return resampleLinear(clipped.map((sample) => sample / maxValue), TARGET_SAMPLE_COUNT)
}

function resampleLinear(samples: number[], targetCount: number) {
  if (!samples.length) {
    return new Array(targetCount).fill(0)
  }

  if (samples.length === targetCount) {
    return [...samples]
  }

  return Array.from({ length: targetCount }, (_, index) => {
    const position = (index / Math.max(1, targetCount - 1)) * Math.max(0, samples.length - 1)
    const left = Math.floor(position)
    const right = Math.min(samples.length - 1, Math.ceil(position))
    const alpha = position - left

    return samples[left] * (1 - alpha) + samples[right] * alpha
  })
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
