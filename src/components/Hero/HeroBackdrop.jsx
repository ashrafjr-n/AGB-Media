import { useEffect, useRef } from 'react'

import useScrollPosition, {
  isPastFirstViewport,
} from '../../hooks/useScrollPosition'
import styles from './HeroBackdrop.module.css'

/*
  A literal path into public/, not a Vite import, and it is deliberately the only asset
  on the site treated this way.

  index.html carries `<link rel="preload" as="video" fetchpriority="high">` for exactly
  this URL, which is what starts the fetch during HTML parse instead of after the JS
  bundle has downloaded, parsed and mounted React. That preload cannot name a bundled
  asset, because a bundled asset's URL is a content hash that does not exist until the
  build has run — so the file has to be served from a stable path for the hint to be
  writable at all. Keep the two in step by hand; there is no import to fail loudly if
  they drift.

  story.webm stays a Vite import. It is not on the first screen, it must not compete for
  the first screen's bandwidth, and it therefore wants the opposite treatment (see the
  preload note in CssLens.jsx).
*/
const HERO_VIDEO = '/assets/videos/hero.webm'

/**
 * The footage behind the hero AND behind the Story section — a `position: sticky` layer
 * scoped to the two of them.
 *
 * IT IS NOT PART OF <Hero>, AND THAT IS THE ARCHITECTURE RATHER THAN A FILING DECISION.
 * This has to be a child of the Hero+Story group in HomePage.jsx, because a sticky box is
 * constrained by its own containing block: left inside `.hero` it would be constrained to
 * the hero's box and would stop sticking where the hero ends, and `.hero` carries
 * `overflow: hidden`, which is a scroll container and would defeat stickiness outright.
 * The pinning it has to perform spans two sections, so it belongs to the box that holds
 * both. It lives in `Hero/` because the footage is the hero's — same reasoning as
 * HeroHeader.jsx, which also has no life outside this part of the page.
 *
 * WHAT REPLACED WHAT. This element was `position: fixed`, and it therefore existed over
 * the whole document whether or not anything could see it. Two mechanisms grew to hide it
 * again: a `display: none` gate driven by a `data-hidden` attribute, and an
 * IntersectionObserver in About.jsx reporting its own box up through HomePage so the hero
 * knew whether its footage was still being sampled. Both are gone. A sticky box cannot
 * leave its containing block, so the group's bottom edge IS the boundary — there is no
 * threshold to get wrong and no scroll position at which this can paint over the Founder.
 *
 * What survives is the PLAYBACK gate, which answers a different question. Sticky stops
 * this element being seen; it does not stop the browser decoding 4K frames into a
 * compositor layer nobody is looking at. That is still worth switching off, and it is
 * still `isPastFirstViewport` — one scrolled viewport is the end of a 100svh hero.
 */
function HeroBackdrop() {
  const videoRef = useRef(null)

  /*
    Subscribed as a boolean rather than as the raw position: this component holds a 4K
    <video> and must not re-render on every frame of every scroll to produce identical
    output. Selecting the threshold lets React bail out — two renders per scroll pass,
    one entering and one leaving.
  */
  const isHeroCovered = useScrollPosition(isPastFirstViewport)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isHeroCovered) {
      video.pause()
      return
    }

    /*
      play() returns a promise that rejects if the element is torn down or the call is
      interrupted. It no longer rejects for the reason it used to — this video starts
      muted now, so the browser permits it — but the catch stays, because an unhandled
      rejection here would be noise.
    */
    video.play()?.catch(() => {})
  }, [isHeroCovered])

  /*
    Sound, on the first real interaction — which is what makes starting muted a delay
    rather than a loss.

    Autoplay policies gate *unmuted* playback on user activation, not playback itself, so
    the fix for a frozen first frame is to start muted and unmute once the visitor has
    given the page a gesture. Nothing needs restarting: changing `muted` on an element
    that is already playing simply turns the audio on.

    `once` on each listener, plus an explicit removal in the cleanup, because only one of
    the three will fire and the other two have to come off with it. Scroll is deliberately
    not among them — a wheel or trackpad scroll is not user activation in Chrome, so
    unmuting on it would be refused and would burn the one shot.
  */
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'touchstart']

    const unmute = () => {
      const video = videoRef.current
      if (video) video.muted = false

      events.forEach((event) => window.removeEventListener(event, unmute))
    }

    events.forEach((event) =>
      window.addEventListener(event, unmute, { passive: true, once: true }),
    )

    return () => {
      events.forEach((event) => window.removeEventListener(event, unmute))
    }
  }, [])

  return (
    <div className={styles.backdrop} aria-hidden="true">
      {/*
        `preload="auto"` states outright what the browser is otherwise left to guess. It
        is the default for a <video> with a src on desktop, but not on every mobile
        engine, and it is the one hint that says "fetch the whole thing" rather than
        "fetch enough to know what it is" — which for the section that IS the first screen
        is what we mean. It pairs with the preload link in index.html: the link starts the
        request early, this keeps it going.

        NO `autoPlay`, and its absence is deliberate. The effect above is what starts this
        video, on mount and on every crossing after it. On a reload part-way down the page
        `isHeroCovered` is already true at first render (useScrollPosition reads the real
        offset in its lazy initialiser), so the effect's first act is to pause; `autoPlay`
        would beat it to the element and spend a decode on a 4K frame nobody can see.

        IT STARTS MUTED, AND THAT IS NOT OPTIONAL. An unmuted autoplay without prior user
        activation is REFUSED outright — the play() promise rejects and the video sits on
        its first frame. Sound is restored on the first real interaction instead, by the
        second effect above.
      */}
      <video
        ref={videoRef}
        className={styles['backdrop-video']}
        src={HERO_VIDEO}
        loop
        muted
        playsInline
        preload="auto"
      />
      <div className={styles['backdrop-overlay']} />
    </div>
  )
}

export default HeroBackdrop
