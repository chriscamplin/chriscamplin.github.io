import type { ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import ClimateSpiral from './components/DataViz/ClimateSpiral'
import SeaIceSpiral from './components/DataViz/SeaIceSpiral'
import './styles/dataViz.css'

type PageKey = 'nasa' | 'climate' | 'sea-ice'

const pages = {
  nasa: {
    title: 'NASA Data Visualisations',
    eyebrow: 'DataViz side projects',
    description:
      'Two full-screen spiral visualisations rebuilt from the migrated components and wired to the latest climate and sea-ice datasets in this repo.',
  },
  climate: {
    title: 'Climate Spiral',
    eyebrow: 'NASA GISTEMP',
    description:
      'Global land-ocean temperature anomalies rendered from the latest `GLB.Ts+dSST.csv` dataset bundled with the site.',
    source:
      'Source data: NASA GISTEMP global temperature anomaly series (`GLB.Ts+dSST.csv`).',
  },
  'sea-ice': {
    title: 'Sea Ice Spiral',
    eyebrow: 'Sea Ice Index',
    description:
      'Monthly Arctic sea-ice extent rendered from the `data/sea-ice-index` CSV series bundled with the site.',
    source:
      'Source data: monthly sea-ice extent CSVs in `src/data/sea-ice-index`.',
  },
} as const

function getPageKey(): PageKey {
  const bodyPage = document.body.dataset.page as PageKey | undefined

  if (bodyPage && bodyPage in pages) {
    return bodyPage
  }

  const path = window.location.pathname

  if (path.includes('climate-spiral.html')) {
    return 'climate'
  }

  if (path.includes('sea-ice-spiral.html')) {
    return 'sea-ice'
  }

  return 'nasa'
}

const pageKey = getPageKey()

const links = [
  {
    href: '/climate-spiral.html',
    title: 'Climate Spiral',
    eyebrow: 'NASA GISTEMP',
    copy: 'Full-screen 3D spiral driven by the latest global land-ocean anomaly dataset.',
  },
  {
    href: '/sea-ice-spiral.html',
    title: 'Sea Ice Spiral',
    eyebrow: 'Sea Ice Index',
    copy: 'Full-screen 3D spiral driven by monthly Arctic sea-ice extent records.',
  },
]

function LandingPage() {
  return (
    <main className='DataVizLanding'>
      <div className='DataVizLandingGlow DataVizLandingGlowLeft' />
      <div className='DataVizLandingGlow DataVizLandingGlowRight' />

      <header className='DataVizHeaderBar'>
        <a className='DataVizBackLink' href='/'>
          Back to portfolio
        </a>
      </header>

      <section className='DataVizLandingCopy'>
        <p className='DataVizEyebrow'>{pages.nasa.eyebrow}</p>
        <h1>{pages.nasa.title}</h1>
        <p>{pages.nasa.description}</p>
      </section>

      <section className='DataVizCards'>
        {links.map((link) => (
          <a key={link.href} className='DataVizCard' href={link.href}>
            <p className='DataVizEyebrow'>{link.eyebrow}</p>
            <h2>{link.title}</h2>
            <p>{link.copy}</p>
            <span>Open visualisation</span>
          </a>
        ))}
      </section>
    </main>
  )
}

function ScenePage({
  title,
  eyebrow,
  description,
  source,
  children,
}: {
  title: string
  eyebrow: string
  description: string
  source?: string
  children: ReactNode
}) {
  return (
    <main className='DataVizScenePage'>
      <div className='DataVizSceneFrame'>
        <Canvas camera={{ position: [0, 0, 24], fov: 34 }} dpr={[1, 1.5]}>
          <color attach='background' args={['#031019']} />
          <fog attach='fog' args={['#031019', 18, 40]} />
          {children}
          <OrbitControls
            enablePan={false}
            minDistance={12}
            maxDistance={48}
            minPolarAngle={Math.PI * 0.35}
            maxPolarAngle={Math.PI * 0.65}
          />
        </Canvas>
      </div>

      <header className='DataVizHeaderBar DataVizSceneOverlay'>
        <a className='DataVizBackLink' href='/nasa.html'>
          Back to NASA page
        </a>
        <a className='DataVizBackLink' href='/'>
          Portfolio
        </a>
      </header>

      <section className='DataVizSceneOverlay DataVizSceneCopy'>
        <p className='DataVizEyebrow'>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {source && <p className='DataVizSource'>{source}</p>}
      </section>
    </main>
  )
}

function App() {
  if (pageKey === 'nasa') {
    return <LandingPage />
  }

  if (pageKey === 'climate') {
    return (
      <ScenePage {...pages.climate}>
        <ClimateSpiral />
      </ScenePage>
    )
  }

  return (
    <ScenePage {...pages['sea-ice']}>
      <SeaIceSpiral />
    </ScenePage>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing root element for DataViz app.')
}

ReactDOM.createRoot(rootElement).render(<App />)
