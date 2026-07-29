import { useEffect, useState } from 'react'

/**
 * Tracks the window's vertical scroll offset alongside the current viewport
 * height.
 *
 * The viewport height rides along deliberately: every consumer so far compares
 * scroll against a viewport-relative threshold (the header docks once the
 * 100svh hero is behind you), and reading `window.innerHeight` at render time
 * instead would go stale on resize and orientation change.
 *
 * Scroll fires at a very high rate, so reads are coalesced into one
 * requestAnimationFrame per frame and the listener is registered as passive so
 * it never blocks scrolling.
 *
 * @returns {{ scrollY: number, viewportHeight: number }}
 */
function useScrollPosition() {
  const [position, setPosition] = useState(() => ({
    scrollY: typeof window === 'undefined' ? 0 : window.scrollY,
    viewportHeight: typeof window === 'undefined' ? 0 : window.innerHeight,
  }))

  useEffect(() => {
    let frameId = null

    const read = () => {
      frameId = null
      setPosition((previous) => {
        const next = {
          scrollY: window.scrollY,
          viewportHeight: window.innerHeight,
        }
        // Bail out of the re-render when nothing actually moved.
        return previous.scrollY === next.scrollY &&
          previous.viewportHeight === next.viewportHeight
          ? previous
          : next
      })
    }

    const schedule = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(read)
      }
    }

    // Sync once on mount: the page may already be scrolled on a reload.
    read()

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return position
}

export default useScrollPosition
