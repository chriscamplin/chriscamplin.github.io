import { useEffect } from 'react'
import { useScrollbar } from '@14islands/r3f-scroll-rig'
import { useMotionValue } from 'framer-motion'
import { Tracker } from '@14islands/r3f-scroll-rig/dist/src/hooks/useTrackerTypes'

/**
 * Return a Framer Motion value bound to a tracker scrollState
 * @param {Tracker} tracker scroll-rig tracker instance
 * @param {string} prop scrollState prop to bind
 */

type ScrollStateProp = 'progress' | string

export default function useTrackerMotionValue(tracker: Tracker, prop: ScrollStateProp = 'progress') {
    const progress = useMotionValue(0)
    const { onScroll } = useScrollbar()
    const { scrollState, rect } = tracker

    useEffect(() => {
        // update progress on scroll
        return onScroll(() => {
            const value = scrollState[prop as keyof typeof scrollState];
            if (typeof value === 'number') {
                progress.set(value);
            }
        })
    }, [progress, scrollState, prop, onScroll, rect])

    return progress
}
