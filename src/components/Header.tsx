import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

export const Header = () => {
  // 1. Track the global vertical scroll progress (0 to 1)
  const { scrollYProgress } = useScroll()

  // 2. Map the last 5% of the scroll (0.95 to 1.0) to a Y offset (0 to -100%)
  // This means as you hit the bottom, the header slides up and out.
  const y = useTransform(scrollYProgress, [0, 0.95, 1], ['0%', '0%', '-100%'])

  // Optional: Add a spring for smoother movement
  const springY = useSpring(y, { stiffness: 300, damping: 30 })

  return (
    <motion.header
      style={{
        y: springY,
        position: 'fixed', // Ensure it stays visible during scroll
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
      }}
    >
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
    </motion.header>
  )
}
