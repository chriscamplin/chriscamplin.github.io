import React, { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import styled from 'styled-components'

const CircularTextWrapper = styled(motion.div)`
  position: fixed;
  left: 0;
  bottom: 0;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const SVGWrapper = styled.svg`
  position: absolute;
  width: 100%;
  height: 100%;
`

interface CircularTextProps {
  children?: React.ReactNode
}

const CircularText: React.FC<CircularTextProps> = ({ children }) => {
  const { scrollYProgress } = useScroll()

  // Map scroll progress to rotation
  const rotation = useTransform(scrollYProgress, [0, 1], [0, 360])

  // Animate the component out of the viewport when reaching the bottom
  const translateY = useTransform(scrollYProgress, [0.9, 1], [0, 200]) // Move out vertically

  const [isIdle, setIsIdle] = useState(false)

  useEffect(() => {
    let timeout: number

    const handleScroll = () => {
      setIsIdle(false)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setIsIdle(true)
      }, 4000) // 4 seconds idle time
    }

    document.addEventListener('scroll', handleScroll)

    return () => {
      document.removeEventListener('scroll', handleScroll)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <CircularTextWrapper
      initial={{ opacity: 0 }}
      animate={{
        opacity: isIdle ? 1 : 0,
        translateY: isIdle ? translateY.get() : 200,
      }}
      transition={{ duration: 0.5 }}
    >
      <SVGWrapper viewBox='0 0 150 150'>
        {/* Define a circular path */}
        <defs>
          <path
            id='circlePath'
            d='M 75, 75 m -50, 0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0'
          />
        </defs>

        {/* Circle */}
        <circle cx='75' cy='75' r='40' stroke='white' strokeWidth='2' fill='none' />
        <circle cx='75' cy='75' r='30' stroke='white' strokeWidth='2' fill='none' />

        {/* Animated text that follows the circular path */}
        <motion.text
          style={{
            rotate: rotation,
            originX: '75px', // Center for rotation
            originY: '75px',
            fill: 'white',
          }}
        >
          <textPath href='#circlePath' startOffset='10%' fill='white'>
            {children}
          </textPath>
        </motion.text>
      </SVGWrapper>
    </CircularTextWrapper>
  )
}

export default CircularText
