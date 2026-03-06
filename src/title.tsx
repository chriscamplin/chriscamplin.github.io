import { useRef, useEffect } from 'react'
import { motion, useInView, useMotionValue } from 'framer-motion'
import { useScrollbar } from '@14islands/r3f-scroll-rig'
import { TypingEffect } from './TypingEffect'

export default function Title({ text = 'Chris Camplin' }) {
  const el = useRef<HTMLDivElement>(null)
  const ref = useRef(null)
  const isInView = useInView(ref)

  const { onScroll } = useScrollbar()
  const explodeProgress = useMotionValue(0)

  useEffect(() => {
    return onScroll(() => {
      if (!el.current) return

      // Get the element's precise position relative to the viewport
      const rect = el.current.getBoundingClientRect()

      // If the top of the element is below the top of the screen, keep it at 0 (unexploded)
      if (rect.top > 0) {
        explodeProgress.set(0)
      } else {
        // Once it crosses the top edge, calculate how far out it is (0 to 1)
        const maxScroll = rect.height
        const currentScroll = Math.abs(rect.top)
        const ratio = Math.min(currentScroll / maxScroll, 1)

        explodeProgress.set(ratio)
      }
    })
  }, [onScroll, explodeProgress])

  return (
    <div
      ref={el}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '22vw',
        paddingBottom: '14vw',
      }}
    >
      <motion.div
        ref={ref}
        style={{ width: '100%' }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : ''}
      >
        <h1
          style={{
            fontSize: '12vw',
            color: 'white',
            textTransform: 'uppercase',
            textShadow: '0 0 3px #000',
            textAlign: 'center',
          }}
        >
          {/* Pass our custom explosion progress down */}
          <TypingEffect text={text} scrollProgress={explodeProgress} />
        </h1>
      </motion.div>
    </div>
  )
}
