import React, { useRef, useLayoutEffect } from 'react'
import { motion, useTransform } from 'framer-motion'
import {
  useTracker,
  ScrollScene,
  UseCanvas,
  useScrollRig,
} from '@14islands/r3f-scroll-rig'
import useTrackerMotionValue from '../hooks/useTrackerMotionValue'
import { RaymarchingPlane } from './RaymarchingPlane'

export const StickyRaymarching = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Track the tall container (the "scroll tracks")
  const tracker = useTracker(containerRef as React.MutableRefObject<HTMLElement>)
  const progress = useTrackerMotionValue(tracker)

  /**
   * 2. CALCULATE THE PIN
   * We want the element to stay at the top of the viewport (y: 0)
   * while we scroll through the 300vh container.
   *
   * Container is 300vh. Viewport is 100vh.
   * Total scrollable distance inside container = 200vh.
   */
  const y = useTransform(progress, [0, 1], ['0vh', '200vh'])

  // Visual polish: fade and scale
  const opacity = useTransform(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
  const scale = useTransform(progress, [0, 0.1, 0.9, 1], [0.8, 1, 1, 0.8])

  return (
    <section
      ref={containerRef}
      style={{
        height: '300vh', // How long it stays stuck
        position: 'relative',
        outline: 'none',
      }}
    >
      {/* 
        This motion.div acts as our "Sticky" element. 
        It moves down as the user scrolls, staying in the viewport.
      */}
      <motion.div
        style={{
          y,
          height: '100vh',
          width: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <motion.div style={{ scale, opacity, width: '100%', height: '100%' }}>
          <UseCanvas>
            {/* 
              We track the motion.div. Because we are manually 
              moving it with 'y', the WebGL Scene follows it perfectly. 
            */}
            <ScrollScene track={containerRef as React.RefObject<HTMLElement>}>
              {(props) => <RaymarchingPlane {...props} />}
            </ScrollScene>
          </UseCanvas>
        </motion.div>
      </motion.div>
    </section>
  )
}
