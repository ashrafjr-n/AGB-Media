import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/*
  THE FIRST-VISIT LOADER'S WHOLE DECISION, in one place: whether the overlay is shown at
  all, and when it is allowed to leave.

  It lives here rather than inside components/Loader/Loader.jsx for the reason every other
  hook in this directory does — the component is then only markup and classes, and the
  timing is testable and readable on its own. It is also what keeps `Loader` a single
  component in a single file: the "should this render at all" answer has to exist before
  the overlay mounts, and a hook can hold it without a second component wrapping the first.

  IT HAS NOTHING TO DO WITH THE PAGE TRANSITION (App.jsx) AND MUST NOT GROW A LINK TO IT.
  The two features run in the same app and are deliberately independent: this one fires at
  most once per browser session, before any navigation has happened; the other fires on
  every route change and never on first paint (`initial={false}` on its AnimatePresence).
  Neither reads the other's state, and neither may start doing so — a loader that knew
  about routing would reappear mid-session, and a transition that knew about the loader
  would animate the first paint the loader exists to cover.

  It is likewise unrelated to the home page's two sticky pairings (Hero->Story,
  WhyAgb->Team). Nothing here touches scroll position, and nothing here mounts, unmounts
  or re-renders any section — the overlay is a sibling of the router, painting over the
  page while it is up and gone entirely afterwards.
*/

/*
  sessionStorage, not localStorage, and the difference is the whole spec: the loader is a
  once-per-session first impression, not a once-per-visitor one. A session ends with the
  tab, so a new tab or window gets it again while a refresh or an in-session navigation
  does not.
*/
const SESSION_KEY = 'agb-loaded'

/*
  THE TWO BOUNDS, and the loader's exit is the earlier of the two paths they define.

  The minimum exists because a loader that vanishes in 200ms reads as a flash of something
  broken rather than as an entrance — it has to be on screen long enough for the eye to
  register the logo and to see the bar move. The maximum exists because the visitor must
  never be held on a splash screen by an asset that is slow, cached badly, or simply
  refusing to load: past this point the page is revealed regardless of what is ready.
*/
const LOADER_MIN_MS = 900
export const LOADER_MAX_MS = 3500

/*
  THE ONE SELECTOR THAT CROSSES A COMPONENT BOUNDARY, and it is an attribute rather than a
  ref chain on purpose.

  The loader is a sibling of the router and must not know which route is mounted, let alone
  hold a ref into it. `data-hero-asset` is the opt-in: any route may mark the one element
  that is its own first screen (today only HeroBackdrop's <video> does), and this hook waits
  on whichever one happens to be in the document. A route with none — every page but the
  home page today — simply resolves this leg immediately and is gated by the fonts alone,
  which is correct: on those routes there is no large media file standing between the
  visitor and a readable page.

  The DOM is fully committed before any passive effect runs, so by the time this is called
  the element is present if the mounted route has one.
*/
const HERO_ASSET_SELECTOR = '[data-hero-asset]'

/**
 * Whether this is the first paint of a new browser session.
 *
 * Wrapped because sessionStorage throws outright in some privacy configurations rather
 * than merely returning null. When it is unavailable the loader is SHOWN: it is the
 * designed first impression, and the failure mode of showing it on every full page load
 * is far better than never showing it at all. Nothing else in the app reads this key.
 */
function isFirstVisitOfSession() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === null
  } catch {
    return true
  }
}

function markSessionLoaded() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* Storage unavailable — see isFirstVisitOfSession. Nothing to recover from. */
  }
}

/**
 * Resolves once the site's typeface has settled.
 *
 * `document.fonts.ready` alone is not quite enough: it resolves whenever there is nothing
 * *pending*, which on a very early call can be before the @import in global.css has
 * kicked off a single request. Asking for the face by name first is what guarantees a
 * request exists to wait on. Both legs swallow their own rejection — a font that fails to
 * load must not hold the page behind a splash screen.
 */
function whenFontsReady() {
  if (!document.fonts) return Promise.resolve()

  return Promise.all([
    document.fonts.load('1rem "Manrope"').catch(() => {}),
    document.fonts.ready,
  ]).then(
    () => {},
    () => {},
  )
}

/**
 * Resolves once the mounted route's first-screen media can play (or has failed).
 *
 * `error` is in the listener list for the same reason the font promise swallows its
 * rejection: a broken asset is a reason to reveal the page, not a reason to sit on a
 * loader until the maximum expires.
 *
 * The promise deliberately has no timeout of its own. It is always raced against the
 * maximum in the caller, so a media element that never fires anything is already handled
 * — and the AbortController takes the listeners off if the loader unmounts first.
 */
function whenHeroAssetReady(signal) {
  const media = document.querySelector(HERO_ASSET_SELECTOR)
  if (!media) return Promise.resolve()

  /* HAVE_CURRENT_DATA or better — the first frame is decoded and there is something to reveal. */
  if (media.readyState >= 2) return Promise.resolve()

  return new Promise((resolve) => {
    const options = { once: true, signal }

    ;['loadeddata', 'canplay', 'error'].forEach((event) =>
      media.addEventListener(event, () => resolve(), options),
    )
  })
}

/**
 * Drives the first-visit loader.
 *
 * @returns {{ visible: boolean, phase: 'static' | 'start' | 'running' | 'complete' }}
 *   `visible` is false from the very first render on every visit after the first, so the
 *   overlay never mounts at all rather than mounting and hiding — there is no frame in
 *   which a returning visitor sees it. `phase` drives the progress bar only.
 */
function useFirstVisitLoader() {
  const reduceMotion = useReducedMotion()

  /*
    Read in a lazy initialiser rather than in an effect: the answer has to be known on the
    FIRST render or the overlay flashes in a frame late, over a hero that has already
    painted — which is precisely the flash it exists to prevent.
  */
  const [visible, setVisible] = useState(isFirstVisitOfSession)
  const [barPhase, setBarPhase] = useState('start')

  /*
    Latched on mount, not on exit. A visitor who navigates away while the loader is still
    up has had their first impression; showing it again when they come back inside the
    same session would be the bug this key exists to prevent.

    StrictMode's deliberate mount/unmount/remount cannot reach this: `visible` was resolved
    by the lazy initialiser above, which React preserves across that remount, so the write
    can never race the read.
  */
  useEffect(() => {
    if (visible) markSessionLoaded()
  }, [visible])

  useEffect(() => {
    if (!visible) return undefined

    const start = performance.now()
    const controller = new AbortController()
    const timers = []
    let cancelled = false

    const waitUntil = (deadline) =>
      new Promise((resolve) => {
        timers.push(
          window.setTimeout(resolve, Math.max(0, deadline - performance.now())),
        )
      })

    /*
      Two frames, not one. A passive effect can run before the browser has painted the
      element, and a transition that starts on the same frame the element first paints is
      not a transition — the bar would jump straight to its target. The first frame
      guarantees paint at scaleX(0); the second starts the travel.
    */
    let secondFrame = 0
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (!cancelled) setBarPhase('running')
      })
    })

    /*
      THE EXIT CONDITION, exactly as specified: whichever of these two comes first.

        a) everything the first screen needs is ready AND the minimum has elapsed
        b) the maximum has elapsed, ready or not

      Written as a race rather than as a pair of timers with flags between them because
      that is what it is — and because the ready path composes: adding a third asset is
      another entry in the Promise.all, with no change to the timing at all.
    */
    const contentReady = Promise.all([
      whenFontsReady(),
      whenHeroAssetReady(controller.signal),
    ])

    Promise.race([
      contentReady.then(() => waitUntil(start + LOADER_MIN_MS)),
      waitUntil(start + LOADER_MAX_MS),
    ]).then(() => {
      if (cancelled) return

      /*
        Order matters, and only by one render: the bar is told to finish in the same
        commit that starts the fade, so it visibly completes DURING the fade-out rather
        than snapping after it. AnimatePresence keeps the overlay mounted for its exit,
        which is what gives the bar somewhere to finish.
      */
      setBarPhase('complete')
      setVisible(false)
    })

    return () => {
      cancelled = true
      controller.abort()
      timers.forEach((timer) => window.clearTimeout(timer))
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  }, [visible])

  return {
    visible,
    /*
      Reduced motion keeps every bit of the timing above and drops only the travel: the
      bar renders full and still. The preference is about movement, not about how long the
      page takes to be ready, so shortening the loader for it would be the wrong reading.
    */
    phase: reduceMotion ? 'static' : barPhase,
  }
}

export default useFirstVisitLoader
