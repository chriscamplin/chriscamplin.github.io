import { useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, useInView } from 'framer-motion'
import { useScrollbar, useTracker } from '@14islands/r3f-scroll-rig'
import { TypingEffect } from './TypingEffect'

export default function Title({ text = 'Chris Camplin | Creative developer' }) {
  const el = useRef<HTMLDivElement>(null)
  const { onScroll } = useScrollbar()
  const { scrollState } = useTracker(el as React.MutableRefObject<HTMLElement>)
  const progress = useMotionValue(0)

  useEffect(() => {
    return onScroll(() => progress.set(scrollState.visibility))
  }, [onScroll, progress, scrollState])

  const y = useTransform(progress, [0, 1], ['-100%', '0%'])
  const opacity = useTransform(progress, [0, 1], [0, 1])
  const scale = useTransform(progress, [0, 1], [0.9, 1])
  const ref = useRef(null)
  const isInView = useInView(ref)

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
        style={{ y, opacity, scale, width: '100%' }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : ''}
      >
        <h1
          style={{
            fontSize: '8vw',
            color: 'white',
            textTransform: 'uppercase',
            textShadow: '0 0 3px #000',
          }}
        >
          <TypingEffect text={text} />
        </h1>
      </motion.div>
    </div>
  )
}
