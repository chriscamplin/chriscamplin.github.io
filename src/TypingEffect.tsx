'use client'

import * as React from 'react'
import { motion, useInView } from 'framer-motion'

export function TypingEffect({ text = 'Typing Effect' }: { text: string }, ...props: any) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true })
  return (
    <div ref={ref}>
      {text.split('').map((letter, index) => (
        <motion.span
          key={index}
          initial={{ x: -50, opacity: 0, filter: 'blur(20px)' }}
          animate={{ x: 0, filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.1, delay: index * 0.1 }}
          {...props}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  )
}
