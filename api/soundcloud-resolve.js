const TOKEN_ENDPOINT = 'https://secure.soundcloud.com/oauth/token'
const API_BASE = 'https://api.soundcloud.com'
const SOUNDCLOUD_HOST_RE = /(^|\.)soundcloud\.com$/i
const SOUNDCLOUD_SHORT_HOST_RE = /(^|\.)on\.soundcloud\.com$/i

let cachedToken = null
let cachedRefreshToken = null
let cachedTokenExpiresAt = 0

export default async function handler(req, res) {
  applyCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    respondJson(res, 405, { error: 'Method not allowed. Use GET.' })
    return
  }

  const rawUrl = getRequestUrl(req)

  if (!rawUrl) {
    respondJson(res, 400, { error: 'Missing required `url` query parameter.' })
    return
  }

  let trackUrl

  try {
    trackUrl = new URL(rawUrl)
  } catch {
    respondJson(res, 400, { error: 'The `url` query parameter must be a valid URL.' })
    return
  }

  if (!isSoundCloudUrl(trackUrl)) {
    respondJson(res, 400, {
      error: 'Only SoundCloud track URLs are supported by this resolver.',
    })
    return
  }

  if (!process.env.SOUNDCLOUD_CLIENT_ID || !process.env.SOUNDCLOUD_CLIENT_SECRET) {
    respondJson(res, 500, {
      error:
        'Resolver is missing SOUNDCLOUD_CLIENT_ID or SOUNDCLOUD_CLIENT_SECRET.',
    })
    return
  }

  try {
    const accessToken = await getAccessToken()
    const track = await resolveTrack(trackUrl.toString(), accessToken)

    if (track.kind !== 'track') {
      respondJson(res, 400, {
        error: `Resolved resource kind "${track.kind}" is not supported. Use a track URL.`,
      })
      return
    }

    if (!track.waveform_url) {
      respondJson(res, 422, {
        error: 'The resolved track did not expose a waveform_url.',
      })
      return
    }

    respondJson(res, 200, {
      title: track.title,
      waveformUrl: track.waveform_url,
      attributionUrl: track.permalink_url || trackUrl.toString(),
      provider: 'SoundCloud',
      note:
        'Resolved through the SoundCloud API. This minimal resolver returns waveform data for terrain generation.',
    })
  } catch (error) {
    const status = error?.statusCode ?? 502
    const message =
      error instanceof Error ? error.message : 'Unexpected SoundCloud resolver failure.'

    respondJson(res, status, { error: message })
  }
}

function applyCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
}

function respondJson(res, statusCode, body) {
  res.status(statusCode).json(body)
}

function getRequestUrl(req) {
  if (typeof req.query?.url === 'string') {
    return req.query.url
  }

  if (Array.isArray(req.query?.url)) {
    return req.query.url[0]
  }

  if (typeof req.url !== 'string') {
    return null
  }

  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers.host || 'localhost'
  return new URL(req.url, `${protocol}://${host}`).searchParams.get('url')
}

function isSoundCloudUrl(url) {
  return SOUNDCLOUD_HOST_RE.test(url.hostname) || SOUNDCLOUD_SHORT_HOST_RE.test(url.hostname)
}

async function getAccessToken() {
  const now = Date.now()

  if (cachedToken && cachedTokenExpiresAt - now > 60_000) {
    return cachedToken
  }

  if (cachedRefreshToken && cachedTokenExpiresAt - now <= 60_000) {
    try {
      await refreshAccessToken(cachedRefreshToken)
      if (cachedToken) {
        return cachedToken
      }
    } catch {
      cachedRefreshToken = null
    }
  }

  const basicAuth = Buffer.from(
    `${process.env.SOUNDCLOUD_CLIENT_ID}:${process.env.SOUNDCLOUD_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json; charset=utf-8',
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  })

  if (!response.ok) {
    throw createHttpError(
      502,
      `SoundCloud token exchange failed with ${response.status}.`
    )
  }

  const payload = await response.json()
  storeTokenPayload(payload)

  if (!cachedToken) {
    throw createHttpError(502, 'SoundCloud token exchange did not return an access token.')
  }

  return cachedToken
}

async function refreshAccessToken(refreshToken) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json; charset=utf-8',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.SOUNDCLOUD_CLIENT_ID,
      client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw createHttpError(502, `SoundCloud token refresh failed with ${response.status}.`)
  }

  const payload = await response.json()
  storeTokenPayload(payload)
}

function storeTokenPayload(payload) {
  cachedToken = typeof payload.access_token === 'string' ? payload.access_token : null
  cachedRefreshToken =
    typeof payload.refresh_token === 'string' ? payload.refresh_token : null
  cachedTokenExpiresAt = Date.now() + Math.max(0, Number(payload.expires_in || 0)) * 1000
}

async function resolveTrack(trackUrl, accessToken) {
  const url = new URL(`${API_BASE}/resolve`)
  url.searchParams.set('url', trackUrl)

  const response = await fetch(url, {
    headers: {
      accept: 'application/json; charset=utf-8',
      authorization: `OAuth ${accessToken}`,
    },
  })

  if (response.status === 401) {
    cachedToken = null
    cachedTokenExpiresAt = 0
    throw createHttpError(502, 'SoundCloud rejected the resolver token.')
  }

  if (response.status === 404) {
    throw createHttpError(404, 'SoundCloud could not resolve that track URL.')
  }

  if (!response.ok) {
    throw createHttpError(
      502,
      `SoundCloud resolve request failed with ${response.status}.`
    )
  }

  return response.json()
}

function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
