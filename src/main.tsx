import * as THREE from 'three'
import { motion, useTransform } from 'framer-motion'

import { useFrame } from '@react-three/fiber'
import { Leva } from 'leva'
import React from 'react'
import ReactDOM from 'react-dom/client'
import Title from './title'
import './styles/main.css'
import {
  GlobalCanvas,
  ScrollScene,
  UseCanvas,
  SmoothScrollbar,
  useTracker,
} from '@14islands/r3f-scroll-rig'
/* @ts-ignore */
import { RaymarchingPlane } from './components/RaymarchingPlane'
import { RaymarchingPlaneLinks } from './components/RaymarchingPlaneLinks'
import { RaymarchingPlaneTriangles } from './components/RaymarchingPlaneTriangles'
import { Particles } from './components/Particles'
import { WarpedPlane } from './components/WarpedPlane'
import { VideoPlane } from './components/VideoPlane'

import CircularText from './components/CircularText'
import { siteData } from './data/siteData'
import useTrackerMotionValue from './hooks/useTrackerMotionValue'

function Header() {
  return (
    <header>
      <a href='https://github.com/chriscamplin' target='_blank'>
        Github
      </a>
      <a href='https://www.shadertoy.com/user/Chriscamplin' target='_blank'>
        Shadertoy
      </a>
      <a href='https://compute.toys/profile/chriscamplin' target='_blank'>
        WGSL
      </a>
      <a href='https://uk.linkedin.com/in/christophercamplin' target='_blank'>
        LinkedIn
      </a>
      <a href='/CV_CURRENT.pdf' target='_blank'>
        CV
      </a>
    </header>
  )
}

function Main() {
  const [isTouch, setTouch] = React.useState(false)
  React.useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    // || navigator.msMaxTouchPoints > 0
    setTouch(isTouch)
  }, [])

  return (
    <>
      <Leva
        collapsed={false}
        oneLineLabels={false}
        flat={true}
        theme={{
          sizes: {
            titleBarHeight: '28px',
          },
          fontSizes: {
            root: '10px',
          },
        }}
      />
      <GlobalCanvas style={{ pointerEvents: 'none' }} shadows linear>
        <ambientLight intensity={1.25} />
        <directionalLight position={[0, 5, 5]} intensity={0.5} />
      </GlobalCanvas>
      <HorizontalMarquee>| Projects</HorizontalMarquee>
      <CircularText> Keep Scrolling... </CircularText>
      <SmoothScrollbar>
        {(bind) => (
          <>
            <article {...bind}>
              <Header />
              <section>
                <Title />
              </section>
              <section className='Grid'>
                {siteData.map((props) => (
                  <Image {...props} />
                ))}
                <ParticlesSection />
              </section>
              <section></section>
            </article>
            <section>
              <RayMarchLinksSection />
            </section>
            <section>
              <VideoPlaneSection />
            </section>
            <section>
              <VideoPlaneSection
                vidSrc='/video/CogVideoX_1_5_I2V_00029.mp4'
                vidSrc2='/video/CogVideoX_1_5_I2V_00038.mp4'
              />
            </section>
            <section>
              <RayMarchBlobsSection />
            </section>
            <section>
              <VideoPlaneSection
                vidSrc='/video/CogVideoX_1_5_I2V_00030.mp4'
                vidSrc2='/video/CogVideoX_1_5_I2V_00030.mp4'
              />
            </section>
            <section>
              <VideoPlaneSection
                vidSrc='/video/CogVideoX_1_5_I2V_00043.mp4'
                vidSrc2='/video/CogVideoX_1_5_I2V_00043.mp4'
              />
            </section>
            <section>
              <VideoPlaneSection
                vidSrc='/video/CogVideoX_1_5_I2V_00036.mp4'
                vidSrc2='/video/CogVideoX_1_5_I2V_00036.mp4'
              />
            </section>
            <section style={{ marginBottom: '0' }}>
              <RayMarchTrianglesSection />
            </section>
            <VerticalParallax>| Contact</VerticalParallax>
          </>
        )}
      </SmoothScrollbar>
    </>
  )
}

function VerticalParallax({ children }: { children: React.ReactNode }) {
  const el = React.useRef<HTMLElement>(null)
  const tracker = useTracker(el as React.MutableRefObject<HTMLElement>)
  const progress = useTrackerMotionValue(tracker)

  const textY = useTransform(progress, [0, 1], ['25%', '-25%'])
  const imageY = useTransform(progress, [0, 1], ['-25vh', '25vh'])

  return (
    <section ref={el} className='VerticalParallax'>
      <motion.div className='VerticalParallaxMotion' style={{ y: textY }}>
        <h2>{children}</h2>
      </motion.div>
      <motion.div className='Image' style={{ y: imageY }}>
        <Header />
      </motion.div>
    </section>
  )
}

function HorizontalMarquee({ children }: { children: React.ReactNode }) {
  const el = React.useRef<HTMLDivElement>(null)
  const tracker = useTracker(el as React.MutableRefObject<HTMLElement>)
  const progress = useTrackerMotionValue(tracker)

  const x = useTransform(progress, [0, 1], ['0vw', '-35vw'])

  return (
    <div ref={el} style={{ position: 'absolute', top: '40vw', left: '20vw' }}>
      <motion.div style={{ x }}>
        <h1>{children}</h1>
      </motion.div>
    </div>
  )
}

function Image(
  { name, imgPath, url } = { name: '', imgPath: '', url: '' } // Default values
) {
  const el = React.useRef<HTMLDivElement>(null)

  if (!el) return null

  return (
    <>
      <div
        ref={el}
        className='Placeholder ScrollScene'
        onClick={() => url && window.open(url, '_blank')}
      >
        <span>{name}</span>
        <img src={imgPath} alt={name} />
      </div>
      <UseCanvas>
        {/* @ts-ignore */}
        <ScrollScene track={el}>
          {(props) => (
            <WarpedPlane
              {...props}
              scale={new THREE.Vector3(props.scale.x, props.scale.y, props.scale.z)}
            />
          )}
        </ScrollScene>
      </UseCanvas>
    </>
  )
}

function VideoPlaneSection({
  vidSrc = '/video/CogVideoX_1_5_I2V_00040.mp4',
  vidSrc2 = '/video/CogVideoX_1_5_I2V_00030.mp4',
}) {
  const el = React.useRef<HTMLDivElement>(null)

  if (!el) return null

  return (
    <>
      <div
        ref={el}
        className='Placeholder ScrollScene'
        onClick={() => console.log(`animate to modal view`)}
      >
        <video id='vid1' src={vidSrc} autoPlay muted loop playsInline></video>
        <video id='vid2' src={vidSrc2} autoPlay muted loop playsInline></video>
        <div className='VerticalText'>Generative video - ComfyUI</div>
      </div>
      <UseCanvas>
        {/* @ts-ignore */}
        <ScrollScene track={el}>{(props) => <VideoPlane {...props} />}</ScrollScene>
      </UseCanvas>
    </>
  )
}

function ParticlesWebGL({ scale, scrollState }: { scale: any; scrollState: any }) {
  const groupRef = React.useRef<THREE.Group>(null)
  useFrame(() => {
    if (!groupRef.current) return
    //groupRef.current.rotation.y = scrollState.progress * Math.PI
  })

  return (
    <group
      scale={6}
      rotation={[Math.PI * 0.5, 0, 0]}
      ref={groupRef}
      position={[0, 0, -300]}
    >
      <Particles />
    </group>
  )
}

function ParticlesSection() {
  const el = React.useRef<HTMLDivElement>(null)
  return (
    <>
      <div ref={el} className='ParticlesEl'></div>
      <UseCanvas>
        {/* @ts-ignore */}
        <ParticlesWebGL />
      </UseCanvas>
    </>
  )
}

function RayMarchBlobsSection() {
  const el = React.useRef<HTMLDivElement>(null)

  return (
    <>
      <div ref={el} className='Placeholder ScrollScene FragShader'></div>
      <UseCanvas>
        {/* @ts-ignore */}
        <ScrollScene track={el}>{(props) => <RaymarchingPlane {...props} />}</ScrollScene>
      </UseCanvas>
    </>
  )
}

function RayMarchLinksSection() {
  const el = React.useRef<HTMLDivElement>(null)

  return (
    <>
      <div ref={el} className='Placeholder ScrollScene FragShader'></div>
      <UseCanvas>
        {/* @ts-ignore */}
        <ScrollScene track={el}>
          {(props) => <RaymarchingPlaneLinks {...props} />}
        </ScrollScene>
      </UseCanvas>
    </>
  )
}
function RayMarchTrianglesSection() {
  const el = React.useRef<HTMLDivElement>(null)

  return (
    <>
      <div ref={el} className='Placeholder ScrollScene FragShader'></div>
      <UseCanvas>
        {/* @ts-ignore */}
        <ScrollScene track={el}>
          {(props) => <RaymarchingPlaneTriangles {...props} />}
        </ScrollScene>
      </UseCanvas>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
)
