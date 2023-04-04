import { useRef } from 'react'
import { useSpring } from '@react-spring/three'

import { useSourceTargetLayout } from './useSourceTargetLayout'

function interpolateSourceTarget(data, progress) {
  // console.log(data, progress)
  for (let i = 0; i < data.length; i += 1) {
    data[i].x = (1 - progress) * data[i].sourceX + progress * data[i].targetX
    data[i].y = (1 - progress) * data[i].sourceY + progress * data[i].targetY
    data[i].z = (1 - progress) * data[i].sourceZ + progress * data[i].targetZ
  }
}

/* 

useAnimatedLayout hook that will use a spring to interpolate between source and target positions when the layout changes. 

*/

export function useAnimatedLayout({ data, layout, onFrame }) {
  // compute initial layout remembering initial position as source and end position as target
  useSourceTargetLayout({ data, layout })
  // do the actual animation when layout changed

  // The useSpring hook animates animationProgress from 0 to 1.
  // We use a ref to keep track of the previously seen layout value so we can compare it with the
  // current value and “reset” the spring animation when it changes, forcing it to re-run interpolating animationProgress from 0 to 1.
  const prevLayout = useRef(layout)
  /*
    This relies on react-spring v8, @TODO find what the breaking change was
  */
  const animProps = useSpring({
    config: {
      mass: 5,
      tension: 280,
      friction: 120,
      precision: 0.00001,
      // clamp: true,
      // frequency: 1,
      // damping: 1,
      // velocity: 1,
      // decay: true,
    },

    animationProgress: 1,
    from: { animationProgress: 0 },
    reset: layout !== prevLayout.current,
    onChange: (props, spring) => {
      const { animationProgress } = spring.get()
      // console.log({ spring: animationProgress })
      // interpolate based on progress
      interpolateSourceTarget(data, animationProgress)
      // callback to indicate data has updated
      onFrame({ animationProgress })
    },
  })
  // assign old Layout to Ref
  prevLayout.current = layout
  return animProps
}
