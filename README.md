# Vite React Three Fiber (R3F) + TypeScript Template

<img width="600" alt="Screenshot 2023-03-08 at 1 07 17 PM" src="https://user-images.githubusercontent.com/3608140/223794572-c4b4020f-a855-43c5-937b-bef6ef85e03c.png">

## 🔋 Includes

- [x] OrbitControls (Drei)
- [x] PivotControls Gizmo (Drei)
- [x] Debug UI with Leva
- [x] Performance monitoring with R3F-perf
- [x] Directional and Ambient Lights
- [x] Shadows

## 🕹️ Commands

`npm i`

`npm run dev`

`npm run build`

`npm run preview`

## SoundCloud Resolver

`JoyDivisionWave.html` can now generate terrain from:

- local audio uploads
- direct audio URLs
- waveform JSON or waveform images
- SoundCloud track URLs, if a resolver endpoint is available

This repo now includes a minimal Vercel-style serverless function at `api/soundcloud-resolve.js`.
Its contract is:

`GET /api/soundcloud-resolve?url=https://soundcloud.com/...`

Response:

```json
{
  "title": "Track title",
  "waveformUrl": "https://...",
  "attributionUrl": "https://soundcloud.com/...",
  "provider": "SoundCloud",
  "note": "Resolved through the SoundCloud API."
}
```

Required environment variables:

- `SOUNDCLOUD_CLIENT_ID`
- `SOUNDCLOUD_CLIENT_SECRET`

Optional environment variable:

- `VITE_SOUNDCLOUD_RESOLVER_URL`
  Use this only if the resolver is hosted on a different origin. Otherwise the page now defaults to `/api/soundcloud-resolve`.

`.env.example` includes the expected keys.

Important:

- GitHub Pages can host the static site, but it cannot run the resolver.
- To make SoundCloud URLs work end-to-end, deploy this repo on a platform with serverless support such as Vercel.
- The minimal resolver returns waveform data for terrain generation. It does not proxy or persist SoundCloud audio streams.
