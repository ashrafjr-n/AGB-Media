import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

import { subscribeToScrollPosition } from './useScrollPosition'

/*
  THE HERO -> STORY SCROLL-COMPLETION ASSIST, and nowhere else on the site.

  The problem it answers: a visitor who scrolls almost all the way through the hero
  and stops — say at 95% of one viewport, a hair short of the Story section taking the
  screen — is left on an in-between frame that is not really either section, for no
  reason connected to anything they were trying to do. This nudges the last stretch
  closed on its own once it is clear the visitor has actually stopped there, rather
  than mid-scroll.

  THE PROGRESS IT WATCHES IS `viewportProgress` FROM useScrollPosition, NOT A NEW
  CALCULATION. `viewportProgress` is `scrollY / viewportHeight`, clamped to 0-1 — and
  because the hero is exactly 100svh, that is already "how far through the hero" by
  construction, not an approximation of it. It is also not a value invented for this
  file: it is the exact quantity `isPastFirstViewport` (`viewportProgress >= 1`)
  already thresholds to pause the hero's video and to gate the Story section's own
  video and playback intent (HeroBackdrop.jsx, Hero.jsx, About.jsx). This hook reads
  the same feed those do, through `subscribeToScrollPosition` — the shared listener
  every `useScrollPosition` consumer already shares — rather than adding a second
  `scroll` listener or a second formula that could quietly drift from theirs.

  WHY A DEDICATED HOOK RATHER THAN A FEW LINES IN HeroBackdrop.jsx. The state machine
  below — arm on real input, extend through momentum, fire once idle, cancel
  immediately on the next input, never resubscribe mid-flight — is exactly the kind of
  self-contained scroll behaviour this codebase already isolates into its own file
  (useSectionReveal.js, useExclusiveVideo.js). Keeping it here means HeroBackdrop.jsx,
  which already carries the video-pause effect and the unmute-on-gesture effect, does
  not also have to reason about idle timers and a manual scroll animation.

  ============================================================================
  WHY THIS NEVER FIRES ON MOUNT, ON A ROUTE CHANGE, OR ON RESIZE
  ============================================================================
  No timer of any kind starts merely because this hook has mounted. The ONLY thing
  that arms `idleTimer` is a genuine `wheel`, `touchstart`, `touchmove`, or
  scroll-relevant `keydown` event (see `handleUserInput`) — so a visitor who never
  touches a scroll input, including one who lands on the page already scrolled past
  93% via the browser's own scroll restoration, sees nothing happen. Resize is
  likewise inert here: the shared position feed's `notify` fires on resize too (it
  recomputes `viewportProgress`, since `viewportHeight` moved), but the position
  subscriber below only ever treats a `scrollY` change as "the page is still moving"
  (see the momentum note below) — a resize with the page held still changes
  `viewportProgress` without changing `scrollY`, and is not that.

  ============================================================================
  WHY A PLAIN "RESET THE TIMER ON WHEEL/TOUCH" WOULD BREAK ON MOBILE
  ============================================================================
  A touch-drag scroll does not stop moving when the finger lifts — momentum carries
  it on for a while with no further `touchmove` events at all. If idleness were judged
  purely by the last INPUT event, the debounce could elapse (and this could fire)
  while the page is still gliding from inertia, fighting the browser's own physics
  with a second, independent motion on top of it — a highly visible version of
  exactly the "never fight the user's input" rule this feature has to keep.

  So idleness is judged by the page ACTUALLY BEING STILL, not merely by the absence of
  a discrete input event: the position subscriber below re-arms `idleTimer` on every
  `scrollY` change for as long as one is already running, which keeps it alive through
  momentum the same way a fresh `touchmove` would. It only does this once a timer is
  already armed (`idleTimer !== null`) — a `scrollY` change with no timer running does
  not start one, which is what keeps a route-restoration `scrollTo(0, 0)` or any other
  scroll this hook did not itself provoke from ever arming anything on its own.

  ============================================================================
  WHY THE SAME HANDLER BOTH CANCELS AND RE-ARMS
  ============================================================================
  `handleUserInput` does two things in one place, every time: cancel whatever
  animation is currently running (`stopAnimation`, a no-op if none is), and (re)start
  the idle timer. That is deliberate rather than two feature branches wired up
  separately. There is exactly one thing that can be true when the visitor next
  scrolls — "I am providing input again, right now" — whether or not this hook
  happened to be mid-animation when it arrived, and both consequences follow from
  it. This is also the whole answer to "never queue a second auto-scroll after a
  cancel": a cancel does not remember anything to resume later, it simply returns to
  ordinary idle-watching, armed by the very input that caused it — a future trigger
  only ever comes from a future idle stop, on its own terms, same as any other.

  ============================================================================
  WHY THE ANIMATION IS A MANUAL rAF LOOP RATHER THAN `scrollTo({ behavior: 'smooth' })`
  ============================================================================
  Native smooth scrolling has no guaranteed duration or easing curve — both vary by
  engine and are not something this call site can pin to the 300-500ms, ease-out
  target asked for. A manual loop (`animateScrollTo` below) gets an exact duration and
  an explicit `easeOutCubic`, and — just as important — an exact, synchronous cancel:
  `stopAnimation` sets a flag the next scheduled frame checks before writing anything,
  so a cancel takes effect on the very next frame rather than depending on a browser's
  own (unspecified) interrupt behaviour for a native smooth scroll.

  Every step calls `window.scrollTo({ …, behavior: 'auto' })` rather than the bare
  two-argument form, so each jump is instant regardless of any `scroll-behavior` this
  page might carry — there is none today (global.css only sets `scroll-behavior: auto
  !important` under `prefers-reduced-motion`, which this hook already branches around
  on its own), but the explicit `behavior` makes that true by construction rather than
  by the current absence of a rule this file does not own.

  ============================================================================
  WHY THIS DOES NOT TOUCH VIDEO PLAYBACK, useExclusiveVideo, OR THE REVEAL LADDER
  ============================================================================
  It does not import any of them, and does not need to. The only thing this hook ever
  does is call `window.scrollTo`. Every one of those systems already reacts to
  `scrollY` on its own (HeroBackdrop's and Hero's pause effects, About's playback
  intent, the reveal ladder's `whileInView`) — moving the scroll position the last
  short distance is indistinguishable, to all of them, from the visitor having
  scrolled it there by hand. This is additive by construction, not by any special
  casing that has to be kept in sync with those files.
*/

/*
  ~120-150ms of stillness reads as "stopped" rather than "between wheel ticks" — most
  trackpads and mouse wheels fire discrete events tens of milliseconds apart while
  actively scrolling, so a shorter window would fire between ticks of an ongoing
  scroll; a longer one would make the assist feel laggy once the visitor has
  genuinely stopped. 140ms sits in the middle of the asked-for range.
*/
const IDLE_MS = 140

/*
  0.93 — 7% of one viewport or less remaining. Measured against `viewportProgress`
  (see the top-of-file note for why that is the correct quantity), which is `scrollY /
  viewportHeight` — the Hero-pinned region's own scroll distance, not the page's total
  height and not a raw pixel count. `< 1` alongside it excludes the (harmless but
  pointless) case of the boundary already being exactly crossed, where there is
  nothing left to complete.
*/
const COMPLETE_THRESHOLD = 0.93

/* 380ms sits inside the requested 300-500ms window. */
const DURATION_MS = 380

/*
  Real scroll-moving keys only — not every keydown. A keypress unrelated to scrolling
  (typing in a focused input, a keyboard shortcut) must not cancel an in-flight
  assist or arm a timer that then fires for no visible reason.
*/
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
])

/* A long flat-tailed decelerating curve in spirit, matching the site's one other
   easing note (useSectionReveal's REVEAL_EASE) without needing that file's bezier
   evaluator for a plain scrollTo loop — this is the standard cubic form of the same
   "most of the travel early, then settle" shape. */
function easeOutCubic(t) {
  const inverse = 1 - t
  return 1 - inverse * inverse * inverse
}

/**
 * Animates `window.scrollTo` from `startY` to `targetY` over `duration` ms.
 *
 * @returns {() => void} Cancels the animation. Safe to call after it has already
 *   finished (`rafId` is `null` by then, so there is nothing left to cancel) and safe
 *   to call twice.
 */
function animateScrollTo(startY, targetY, duration, onDone) {
  const distance = targetY - startY
  const startX = window.scrollX

  if (distance === 0) {
    onDone()
    return () => {}
  }

  let cancelled = false
  let rafId = null
  const startTime = performance.now()

  function tick(now) {
    if (cancelled) return

    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)

    window.scrollTo({
      top: startY + distance * easeOutCubic(t),
      left: startX,
      behavior: 'auto',
    })

    if (t < 1) {
      rafId = window.requestAnimationFrame(tick)
    } else {
      rafId = null
      onDone()
    }
  }

  rafId = window.requestAnimationFrame(tick)

  return () => {
    cancelled = true
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId)
      rafId = null
    }
  }
}

/**
 * Mount this once, from the component that owns the Hero-pinned region
 * (HeroBackdrop.jsx) — see the top-of-file note for the full argument. Renders
 * nothing and returns nothing; it is a side effect for its own sake.
 */
function useHeroStoryScrollAssist() {
  /*
    Read into a ref rather than branched on inline, the same pattern
    useScrollPosition's own `selectRef` and HeroHeader's entrance flag use: the
    mount-scoped effect below subscribes exactly once (empty dependency array,
    intentionally — resubscribing on every render of a preference that rarely
    changes would tear down and rebuild the listeners for no reason), so its
    closures need a way to read the LATEST preference without being recreated
    whenever it changes.
  */
  const shouldReduceMotion = useReducedMotion()
  const shouldReduceMotionRef = useRef(shouldReduceMotion)
  shouldReduceMotionRef.current = shouldReduceMotion

  useEffect(() => {
    /*
      Plain closure variables, not `useRef` — everything here lives and dies with
      this one effect run (mount to unmount; the dependency array is empty, so it
      never re-runs), so there is nothing that needs to survive a re-render the way
      a `useRef` value does. A closure is simpler and says exactly that.

      `latest`'s initial value is COMPUTED, not assumed to be progress 0 — a reload
      or a back/forward navigation can restore a scroll position before this effect
      ever runs, and the first `subscribeToScrollPosition` callback is not
      guaranteed to land before the first idle check could (a wheel/touch event
      firing in the same frame this mounts is unlikely but not impossible). Matches
      `readViewport`'s own formula in useScrollPosition.js exactly, for the reason
      the top-of-file note gives for reading that module's feed at all: one
      formula, not two that could disagree.
    */
    const initialViewportHeight = window.innerHeight
    let latest = {
      scrollY: window.scrollY,
      viewportHeight: initialViewportHeight,
      viewportProgress:
        initialViewportHeight > 0
          ? Math.min(Math.max(window.scrollY / initialViewportHeight, 0), 1)
          : 0,
    }
    let idleTimer = null
    let cancelAnimation = null

    function stopAnimation() {
      if (!cancelAnimation) return
      cancelAnimation()
      cancelAnimation = null
    }

    function armIdleTimer() {
      if (idleTimer !== null) clearTimeout(idleTimer)
      idleTimer = setTimeout(handleIdle, IDLE_MS)
    }

    /*
      Fires once the page has been still — no input, no scrollY movement — for
      IDLE_MS. This is the one place the threshold is actually checked; everything
      above it only ever decides WHEN to check, never what to do with the answer.
    */
    function handleIdle() {
      idleTimer = null

      const { viewportProgress, viewportHeight, scrollY } = latest
      if (viewportProgress < COMPLETE_THRESHOLD || viewportProgress >= 1) return

      const targetY = viewportHeight

      if (shouldReduceMotionRef.current) {
        window.scrollTo({ top: targetY, left: window.scrollX, behavior: 'auto' })
        return
      }

      cancelAnimation = animateScrollTo(scrollY, targetY, DURATION_MS, () => {
        cancelAnimation = null
      })
    }

    /*
      THE ONE HANDLER FOR EVERY FORM OF "the visitor is scrolling right now" — wheel,
      touch, and scroll-relevant keys. See the top-of-file note for why cancelling
      and re-arming belong in the same function rather than two.
    */
    function handleUserInput() {
      stopAnimation()
      armIdleTimer()
    }

    function handleKeyDown(event) {
      if (SCROLL_KEYS.has(event.key)) handleUserInput()
    }

    /*
      The position feed — the SAME shared listener every useScrollPosition consumer
      on the page reads, not a second one (see subscribeToScrollPosition's own note).
      Its only two jobs here: keep `latest` current for handleIdle to read, and keep
      an already-armed timer alive through momentum scrolling that fires no further
      wheel/touch events of its own (see the top-of-file note on mobile momentum).
    */
    const unsubscribe = subscribeToScrollPosition((position) => {
      const scrollYChanged = position.scrollY !== latest.scrollY
      latest = position

      if (scrollYChanged && idleTimer !== null) armIdleTimer()
    })

    const pointerInputEvents = ['wheel', 'touchstart', 'touchmove']
    pointerInputEvents.forEach((type) =>
      window.addEventListener(type, handleUserInput, { passive: true }),
    )
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      pointerInputEvents.forEach((type) =>
        window.removeEventListener(type, handleUserInput),
      )
      window.removeEventListener('keydown', handleKeyDown)

      unsubscribe()
      stopAnimation()
      if (idleTimer !== null) {
        clearTimeout(idleTimer)
        idleTimer = null
      }
    }
  }, [])
}

export default useHeroStoryScrollAssist
