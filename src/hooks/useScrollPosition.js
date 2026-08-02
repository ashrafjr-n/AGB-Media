import { useEffect, useRef, useState } from 'react'

/**
 * The one measurement, taken fresh. Kept out of the hook so the mount-time
 * reading and the per-frame reading cannot drift apart.
 *
 * `viewportProgress` is derived rather than stored: it is a pure function of the
 * other two, so keeping it separately would only add a way for them to disagree.
 */
function readViewport() {
  const scrollY = typeof window === 'undefined' ? 0 : window.scrollY
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight

  return {
    scrollY,
    viewportHeight,
    viewportProgress:
      viewportHeight > 0
        ? Math.min(Math.max(scrollY / viewportHeight, 0), 1)
        : 0,
  }
}

/* --- One listener, one read per frame, however many consumers -------------- */

/*
  Module scope on purpose. Three components read scroll position — Hero and About
  gating video playback, HomePage deciding when the site header is due — and a
  listener per consumer meant three `window.scrollY` reads per frame instead of one.

  Two consumers have left since: the site header, when its cue moved onto the Story
  section's own box (Header.jsx), and Founder, when its background stopped being a
  video. Nothing here changed with either — this file was already shared, and a
  consumer leaving costs the others nothing.

  That is not just three property accesses. Reading `scrollY` can force the
  browser to flush pending layout before it can answer, so each read lands after
  whatever style invalidation the frame has accumulated. One shared read per frame
  means at most one such flush, and a fourth consumer now costs nothing at all.

  The listeners exist only while something is subscribed, so nothing is left
  attached to the window after the last consumer unmounts.
*/
const subscribers = new Set()
let frameId = null
let listening = false

function notify() {
  frameId = null

  /* Read once, hand the same object to everyone. */
  const position = readViewport()
  for (const subscriber of subscribers) subscriber(position)
}

/* Scroll fires far above the display's refresh rate; coalesce to one frame. */
function schedule() {
  if (frameId === null) frameId = window.requestAnimationFrame(notify)
}

function subscribe(subscriber) {
  subscribers.add(subscriber)

  if (!listening) {
    /* Passive so it can never delay a scroll — this only ever reads. */
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    listening = true
  }

  return () => {
    subscribers.delete(subscriber)
    if (subscribers.size > 0) return

    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    listening = false

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId)
      frameId = null
    }
  }
}

/**
 * The same shared per-frame reading, for a caller that is not a component and must
 * not go through React state to get it.
 *
 * `useScrollPosition` below exists to turn this feed into render-safe state — it
 * narrows continuous per-frame values down to whatever a component's OWN output
 * actually depends on, via `select`, so React can bail out between real changes.
 * That narrowing is the wrong shape for a caller that reads the raw position
 * imperatively from inside an event handler or a `setTimeout` callback and never
 * renders anything from it (`useHeroStoryScrollAssist.js` is the one so far): routing
 * a continuously-changing number through `useState` there would re-render a
 * component that produces no visual output every scroll frame, for a value nothing
 * ever reads during render.
 *
 * It is still exactly ONE listener underneath, shared with every `useScrollPosition`
 * consumer on the page — this calls the same module-scoped `subscribe` they do, not
 * a second one. That is the whole reason this is exported from here rather than a
 * caller adding its own `window.addEventListener('scroll', …)`: a second listener
 * would be a second per-frame `scrollY` read (and the layout flush that can force),
 * duplicating exactly the cost this file's shared-listener design exists to avoid.
 *
 * @param {(position: { scrollY: number, viewportHeight: number, viewportProgress: number }) => void} callback
 *   Called with the fresh reading on every rAF-coalesced scroll/resize frame.
 * @returns {() => void} Unsubscribes. Call it in the caller's own cleanup.
 */
export const subscribeToScrollPosition = subscribe

/**
 * The threshold the page's video handoff shares: the hero is covered.
 *
 * Exported as one function rather than written out at each call site because the
 * comparisons have to be identical — the hero's video pausing and the story video
 * being allowed to start are one event seen from two files, and two copies of
 * `>= 1` are two chances for them to stop being. The hero is exactly 100svh, so
 * one scrolled viewport is the end of it. (Founder folded this in as well until
 * its background stopped being a video.)
 *
 * The site header used to reveal on this too. It does not any more: its cue is the
 * Story section's own midpoint, measured against that section's box rather than
 * against the viewport (Header.jsx, About.jsx). This is now purely the video
 * threshold, and a consumer that wants a *section's* geometry should observe that
 * section instead of adding a viewport multiple here.
 *
 * @param {{ viewportProgress: number }} position
 * @returns {boolean}
 */
export const isPastFirstViewport = ({ viewportProgress }) =>
  viewportProgress >= 1

/**
 * Tracks the window's vertical scroll offset alongside the current viewport
 * height, plus a normalized 0→1 progress value over that first viewport.
 *
 * The viewport height rides along deliberately: every consumer so far compares
 * scroll against a viewport-relative threshold, and reading `window.innerHeight`
 * at render time instead would go stale on resize and orientation change.
 *
 * `viewportProgress` is that same measurement expressed continuously — 0 at the
 * top of the page, 1 once a full viewport has been scrolled. Because the hero is
 * exactly 100svh, it doubles as "how far through the hero are we".
 *
 * `select` is what keeps that rate off the render path, and it is why all three
 * current consumers pass one. Scroll position changes every frame, so a hook
 * returning it re-rendered its consumer every frame too — and all three only ever
 * wanted a boolean out of it. Hero re-rendered its 4K <video>, the hero header and
 * the whole metadata ticker sixty times a second; Header re-rendered two navs and
 * an SVG filter. Neither produced different output on any of those frames. With a
 * selector the state holds the *projected* value and React's own bail-out does the
 * rest: two renders per scroll pass instead of one per frame. This narrows what is
 * stored, not what is measured.
 *
 * @template T
 * @param {(position: { scrollY: number, viewportHeight: number, viewportProgress: number }) => T} [select]
 *   Narrows the measurement to the part the caller actually renders from.
 *   Omitted, the full measurement is returned and the consumer re-renders on
 *   every scroll frame — correct, but rarely what is wanted.
 * @returns {T | { scrollY: number, viewportHeight: number, viewportProgress: number }}
 */
function useScrollPosition(select) {
  /*
    Held on a ref so an inline arrow at a call site does not resubscribe on every
    render. The projection is applied at measurement time, to the latest reading.
  */
  const selectRef = useRef(select)
  selectRef.current = select

  const [value, setValue] = useState(() =>
    select ? select(readViewport()) : readViewport(),
  )

  useEffect(() => {
    const handle = (position) => {
      setValue((previous) => {
        const next = selectRef.current
          ? selectRef.current(position)
          : position

        if (Object.is(previous, next)) return previous

        /*
          Without a selector the projection is a fresh object every frame, so
          identity can never bail out on its own — compare the two readings it is
          built from instead. This is the pre-selector behaviour, kept intact.
        */
        if (
          !selectRef.current &&
          previous.scrollY === next.scrollY &&
          previous.viewportHeight === next.viewportHeight
        ) {
          return previous
        }

        return next
      })
    }

    // Sync once on mount: the page may already be scrolled on a reload.
    handle(readViewport())

    return subscribe(handle)
  }, [])

  return value
}

export default useScrollPosition
