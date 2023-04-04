import { useState } from 'react'

import useStore from '../../helpers/store'
/* 
    import useStore from '@/helpers/store'
const Cone = dynamic(() => import('@/components/canvas/Cone'), {
  ssr: false,
})

const Page = () => {
  useStore.setState({ title: 'Pyramid points ' })

  */
const layouts = [
  'grid2D',
  'random',
  'spiral',
  'phyllotaxis',
  'lorenz',
  'dadras',
  'sphere',
  'parametric',
  'aizawa',
  'torus',
  'dequan',
  'model',
]
const LayoutControls = () => {
  const currLayout = useStore((state) => state.layout)
  const [hovered, setHovered] = useState('')

  return (
    <div style={{ position: 'fixed', bottom: 0 }}>
      {layouts.map((layout) => (
        <button
          key={Math.random()}
          className={`z-20 p-2 m-2 ${
            currLayout === layout || hovered === layout
              ? 'text-white'
              : 'text-red-300'
          } focus:outline-none focus:ring`}
          onPointerDown={() =>
            useStore.setState({
              layout,
            })
          }
          onPointerOver={() => setHovered(layout)}
          onPointerOut={() => setHovered('')}
        >
          {layout}
        </button>
      ))}
    </div>
  )
}

export default LayoutControls
