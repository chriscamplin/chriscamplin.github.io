import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useVelocity } from 'framer-motion'

export const StudioMarquee = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    damping: 20,
    stiffness: 100,
    mass: 0.5,
  })

  const x = useTransform(smoothProgress, [0, 1], ['0%', '-50%']) // Changed to 0% so it's flush

  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 300,
  })
  const skewX = useTransform(smoothVelocity, [-1000, 1000], [3, -3])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        overflow: 'hidden',
        padding: '4rem 0',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <motion.div
        style={{
          x,
          skewX,
          display: 'flex',
          gap: '3rem',
          whiteSpace: 'nowrap',
          width: 'max-content', // ADDED: Critical so the duplicated text stretches out
          willChange: 'transform',
        }}
      >
        <MarqueeText>{children}</MarqueeText>
        <MarqueeText>{children}</MarqueeText>
        <MarqueeText>{children}</MarqueeText>
        <MarqueeText>{children}</MarqueeText>
      </motion.div>
    </div>
  )
}

const MarqueeText = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 'clamp(4rem, 10vw, 12rem)',
      fontWeight: 900,
      textTransform: 'uppercase',
      lineHeight: 0.9,
      letterSpacing: '-0.02em',
      margin: 0,

      // FIXED CSS TRAP:
      color: 'inherit', // Keeps the inherited color (black/white) for the stroke
      WebkitTextFillColor: 'transparent', // Makes just the inside transparent
      WebkitTextStroke: '2px currentColor',

      // Fallback just in case your parent has no color set:
      // WebkitTextStroke: "2px #000", <-- uncomment this if it's STILL invisible
    }}
  >
    {children}
  </h1>
)
