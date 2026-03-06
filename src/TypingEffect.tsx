'use client'

import * as React from 'react'
import { motion, useInView, MotionValue, useTransform } from 'framer-motion'

export function TypingEffect({
  text = 'Typing Effect',
  scrollProgress,
  ...props
}: {
  text: string
  scrollProgress: MotionValue<number>
}) {
  const ref = React.useRef(null)

  return (
    <div ref={ref} style={{ display: 'inline-block' }}>
      {text.split('').map((letter, index) => (
        <ExplodingLetter
          key={index}
          letter={letter}
          index={index}
          progress={scrollProgress}
          {...props}
        />
      ))}
    </div>
  )
}

function ExplodingLetter({
  letter,
  index,
  progress,
  ...props
}: {
  letter: string
  index: number
  progress: MotionValue<number>
}) {
  // Generate random explosion targets once per letter
  const randomX = React.useMemo(() => (Math.random() - 0.5) * 1000, [])
  const randomY = React.useMemo(() => (Math.random() - 0.5) * 1000, [])
  const randomRotate = React.useMemo(() => (Math.random() - 0.5) * 360, [])

  // Progress now strictly fires 0 -> 1 ONLY when leaving the top of the screen
  const x = useTransform(progress, [0, 1], [0, randomX])
  const y = useTransform(progress, [0, 1], [0, randomY])
  const rotate = useTransform(progress, [0, 1], [0, randomRotate])

  // Fade out as it explodes
  const scrollOpacity = useTransform(progress, [0.5, 1], [1, 0])

  // Preserve width for space characters
  if (letter === ' ') {
    return <span style={{ display: 'inline-block', width: '0.25em' }}>&nbsp;</span>
  }

  return (
    <motion.span
      style={{
        display: 'inline-block', // CRITICAL: spans must be inline-block to accept transforms
        x,
        y,
        rotate,
        opacity: scrollOpacity,
      }}
    >
      <motion.span
        initial={{ x: -50, opacity: 0, filter: 'blur(20px)' }}
        animate={{ x: 0, filter: 'blur(0px)', opacity: 1, y: 0 }}
        transition={{ duration: 0.1, delay: index * 0.05 }}
        style={{ display: 'inline-block' }}
        {...props}
      >
        {letter}
      </motion.span>
    </motion.span>
  )
}
