import { StrictMode, useEffect, useRef } from 'react'
import { OrbitControls, Preload, Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

// import RecordCanvas from '@/components/dom/RecordCanvas'
import useStore from '@/helpers/store'

const LControl = () => {
  const dom = useStore((state) => state.dom)
  const control = useRef(null)

  useEffect(() => {
    if (control.current) {
      const domElement = dom.current
      const originalTouchAction = domElement.style['touch-action']
      domElement.style['touch-action'] = 'none'

      return () => {
        domElement.style['touch-action'] = originalTouchAction
      }
    }
  }, [dom, control])
  return <OrbitControls ref={control} domElement={dom.current} />
}

const LCanvas = ({ children, orthographic = false }) => {
  const canvasRef = useRef()
  console.log(canvasRef)
  const dom = useStore((state) => state.dom)

  return (
    <StrictMode>
      {/* <RecordCanvas canvRef={canvasRef} /> */}
      <Canvas
        orthographic={orthographic}
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
        }}
        onCreated={({ events, gl }) => {
          console.log(gl)
          events.connect(dom.current)
        }}
        shadows
        gl={{
          antialias: false,
        }}
        // dpr={1}
        camera={{ position: [0, 0, 10], zoom: orthographic ? 32 : 1 }}
      >
        <Stats />
        <LControl />
        <Preload all />
        {children}
      </Canvas>
    </StrictMode>
  )
}

export default LCanvas
