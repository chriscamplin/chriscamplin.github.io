import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import * as THREE from 'three'
import { motion, useTransform } from 'framer-motion'
import { useFrame, useThree } from '@react-three/fiber'
import { Leva } from 'leva'

import {
  GlobalCanvas,
  ScrollScene,
  UseCanvas,
  SmoothScrollbar,
  useTracker,
} from '@14islands/r3f-scroll-rig'

import Title from './title'
import CircularText from './components/CircularText'
import { siteData } from './data/siteData'
import useTrackerMotionValue from './hooks/useTrackerMotionValue'

import { RaymarchingPlane } from './components/RaymarchingPlane'
import { RaymarchingPlaneTriangles } from './components/RaymarchingPlaneTriangles'
import { Particles } from './components/Particles'
import { WarpedPlane } from './components/WarpedPlane'
import { VideoPlane } from './components/VideoPlane'
import { BackPlate } from './components/BackPlate'
import { StudioMarquee } from './components/StudioMarquee'
import { Header } from './components/Header'
import './styles/main.css'
import { StickyRaymarching } from './components/StickyMarching'

/**
 * REUSABLE HELPERS
 */

// We use a specific type for the track ref to satisfy the ScrollScene requirements
interface SceneProps {
  children?: React.ReactNode
  canvas: (props: any) => React.ReactNode
  className?: string
  onClick?: () => void
}

export const Scene = ({
  children,
  canvas,
  className = 'Placeholder ScrollScene',
  onClick,
}: SceneProps) => {
  const el = useRef<HTMLDivElement>(null)
  return (
    <>
      <div ref={el} className={className} onClick={onClick}>
        {children}
      </div>
      <UseCanvas>
        <ScrollScene track={el as React.RefObject<HTMLElement>}>
          {(props) => canvas(props)}
        </ScrollScene>
      </UseCanvas>
    </>
  )
}

/**
 * SUB-COMPONENTS
 */

const HorizontalMarquee = ({ children }: { children: React.ReactNode }) => {
  const el = useRef<HTMLDivElement>(null)
  const tracker = useTracker(el as React.MutableRefObject<HTMLElement>)
  const progress = useTrackerMotionValue(tracker)
  const x = useTransform(progress, [0, 1], ['50vw', '-50vw'])

  return (
    <div ref={el} style={{ position: 'relative', left: '33vw', width: 'max-content' }}>
      <motion.div style={{ x }}>
        <h1>{children}</h1>
      </motion.div>
    </div>
  )
}

const VerticalParallax = ({ children }: { children: React.ReactNode }) => {
  const el = useRef<HTMLElement>(null)
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
        <Footer />
      </motion.div>
    </section>
  )
}

const ParticlesWebGL = () => {
  const groupRef = useRef<THREE.Group>(null)
  const scaleRef = useRef(0.01)
  useFrame(() => {
    if (groupRef.current) {
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 5, 0.0125)
      groupRef.current.scale.setScalar(scaleRef.current)
    }
  })

  // const { gl } = useThree()

  // useEffect(() => {
  //   gl.debug.checkShaderErrors = true

  //   gl.debug.onShaderError = (ctx, program, vertexShader, fragmentShader) => {
  //     console.group('Shader compile/link failure')

  //     console.log('PROGRAM LOG:')
  //     console.log(ctx.getProgramInfoLog(program))

  //     console.log('VERTEX LOG:')
  //     console.log(ctx.getShaderInfoLog(vertexShader))

  //     console.log('FRAGMENT LOG:')
  //     console.log(ctx.getShaderInfoLog(fragmentShader))

  //     console.groupCollapsed('VERTEX SOURCE')
  //     console.log(ctx.getShaderSource(vertexShader))
  //     console.groupEnd()

  //     console.groupCollapsed('FRAGMENT SOURCE')
  //     console.log(ctx.getShaderSource(fragmentShader))
  //     console.groupEnd()

  //     console.groupEnd()
  //   }
  // }, [gl])

  return (
    <group rotation={[Math.PI * 0.5, 0, 0]} ref={groupRef}>
      <Particles />
    </group>
  )
}

const Footer = () => (
  <header>
    <a href='https://github.com/chriscamplin' target='_blank' rel='noreferrer'>
      Github
    </a>
    <a
      href='https://compute.toys/userid/ca837ec1-31b0-45ac-8e36-20f5065d43e9'
      target='_blank'
      rel='noreferrer'
    >
      Compute.toys
    </a>
    <a
      href='https://www.shadertoy.com/user/Chriscamplin'
      target='_blank'
      rel='noreferrer'
    >
      Shadertoy
    </a>
    <a
      href='https://uk.linkedin.com/in/christophercamplin'
      target='_blank'
      rel='noreferrer'
    >
      LinkedIn
    </a>
    <a href='/CV_CURRENT.pdf' target='_blank' rel='noreferrer'>
      CV
    </a>
  </header>
)

const videoFiles = [
  '/video/CogVideoX_1_5_I2V_00040.mp4',
  '/video/CogVideoX_1_5_I2V_00029.mp4',
  '/video/CogVideoX_1_5_I2V_00030.mp4',
  '/video/CogVideoX_1_5_I2V_00043.mp4',
  '/video/CogVideoX_1_5_I2V_00036.mp4',
]

/**
 * MAIN APP
 */
function Main() {
  return (
    <>
      <Leva
        collapsed
        oneLineLabels={false}
        flat
        theme={{ sizes: { titleBarHeight: '28px' }, fontSizes: { root: '10px' } }}
      />

      <GlobalCanvas style={{ pointerEvents: 'none', width: '100%' }} linear />
      <CircularText> Keep Scrolling... </CircularText>

      <SmoothScrollbar>
        {(bind) => (
          <>
            <UseCanvas>
              <BackPlate />
            </UseCanvas>

            <article {...bind}>
              <Header />

              <section>
                <Title />
                <Title text={'UI ENGINEER'} />
                <StudioMarquee>Projects</StudioMarquee>
              </section>

              <section className='Grid'>
                {siteData.map((item) => (
                  <Scene
                    key={item.name}
                    onClick={() => item.url && window.open(item.url, '_blank')}
                    canvas={(props) => <WarpedPlane {...props} />}
                  >
                    <span>{item.name}</span>
                    <img src={item.imgPath} alt={item.name} crossOrigin='anonymous' />
                  </Scene>
                ))}

                <div className='ParticlesEl'>
                  <UseCanvas>
                    <ParticlesWebGL />
                  </UseCanvas>
                </div>
              </section>

              {/* Raymarching Blobs */}
              {/* <Scene
                  className='Placeholder ScrollScene FragShader'
                  canvas={(props) => <RaymarchingPlane {...props} />}
                  /> */}

              <StickyRaymarching />
              <StudioMarquee>Generative video</StudioMarquee>
              {/* Video Sections */}
              {videoFiles.map((src, idx) => (
                <section key={idx}>
                  <Scene canvas={(props) => <VideoPlane {...props} />}>
                    {/* RESTORED IDs: VideoPlane likely looks for 'vid1' and 'vid2' inside the track element */}
                    <video id='vid1' src={src} autoPlay muted loop playsInline />
                    <video id='vid2' src={src} autoPlay muted loop playsInline />
                    <div className='VerticalText'>
                      Generative video - Flux AI Model & LTX video
                    </div>
                  </Scene>
                </section>
              ))}

              <section style={{ marginBottom: '0' }}>
                <Scene
                  className='Placeholder ScrollScene FragShader'
                  canvas={(props) => <RaymarchingPlaneTriangles {...props} />}
                />
              </section>

              <VerticalParallax>| Contact</VerticalParallax>
            </article>
          </>
        )}
      </SmoothScrollbar>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
)
