import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { HiOutlineArrowNarrowRight } from 'react-icons/hi'

import useMediaQuery from '../../hooks/useMediaQuery'
import useScrollPosition, {
  isPastFirstViewport,
} from '../../hooks/useScrollPosition'
import storyVideo from '../../assets/videos/story.webm'
import CssLens from '../shared/CssLens'
import buttonStyles from '../shared/Button.module.css'
import styles from './About.module.css'

/* Lets the CTA animate without wrapping the Link in an extra layout box. */
const MotionLink = motion.create(Link)

/*
  The short home-page blurb — one paragraph, where it was two. The long-form version
  lives on /about; keep this to a single paragraph so the section holds its
  single-screen height beside a circle that is now most of the row.

  A bare string rather than the array it used to be: with one entry, mapping was
  ceremony around a single <p>. Restoring the array is the move if a second paragraph
  ever comes back.

  Copy lives here as data so it can move to /src/data or a CMS later without
  touching the layout.
*/
const storyParagraph =
  'AGB Media is a Doha-based production house crafting stories across theatre, film, television, and digital media. Combining artistic leadership with modern production, we deliver work that reflects the culture of Qatar and the Gulf with international quality.'

/*
  The width at which the lens is allowed to mount, matching the breakpoint where this
  section becomes two columns in About.module.css. Below it the circle is ~300px, where
  a pointer-tracking lens has almost nowhere to travel and there is usually no pointer
  to track.

  A JS gate rather than a CSS one because this decides whether to *mount*: hiding the
  disc at a breakpoint would still pay for its backdrop-filter and its ResizeObserver.
*/
const LENS_MIN_WIDTH = '(min-width: 48rem)'

/*
  How much of the section has to be on screen before the story video is allowed to run.
  A fifth, so playback starts as the section arrives rather than once it is committed to
  the screen — and stops again only when it has clearly left.
*/
const PLAYBACK_AMOUNT = 0.2

function About() {
  /*
    The global prefers-reduced-motion rule in global.css only governs CSS
    animations; Framer Motion drives these inline, so the preference has to be
    honoured in JS. When reduced, the section simply renders in place.
  */
  const shouldReduceMotion = useReducedMotion()
  const isWideEnoughForLens = useMediaQuery(LENS_MIN_WIDTH)

  /*
    The lens is pointer-driven motion that cannot be expressed as a CSS transition, so
    reduced motion drops it entirely rather than slowing it down. Both paths show the
    same footage in the same circle; only the glass goes.
  */
  const showLens = isWideEnoughForLens && !shouldReduceMotion

  /*
    The lens reads the pointer from the *whole section*, not from the circle.

    Hovering a 432px circle is a small target on a two-column layout, so a listener scoped
    to the disc itself would leave it frozen for most of the time the reader spends here,
    with the cursor on the copy. This covers the section, and CssLens clamps whatever it
    gets to the circle's interior, so the glass leans toward the cursor without ever
    escaping the frame.

    A ref rather than state on purpose: mousemove fires above the display's refresh rate
    and nothing in the render output depends on the value — storing it in state would
    re-render the section and everything in it on every mouse event to feed a number only
    the follow loop ever reads.
  */
  const circleRef = useRef(null)
  const pointer = useRef({ x: 0, y: 0 })

  /*
    A handle on CssLens's follow loop, filled in by CssLens.

    That loop stops the moment the disc arrives at the pointer, which is the whole point
    of it — a lens resting under a still cursor should cost nothing. Something therefore
    has to restart it, and the only thing that knows the target has moved is the listener
    that moved it, which is here.

    A ref rather than a prop or state, for the same reason `pointer` is one: it is called
    from a mousemove handler and must not re-render anything.
  */
  const lensWake = useRef(null)

  /*
    The circle's box, cached — this was a forced synchronous layout on every single
    mousemove event.

    `getBoundingClientRect()` has to flush any pending layout before it can answer, and a
    high-polling mouse fires well above the display's refresh rate, so it was happening
    several times per frame while the pointer moved. Nothing but scrolling or a resize can
    move this box, so the cache is marked stale from those two events and re-read lazily
    on the next pointer move — one layout read per frame while scrolling, and none at all
    for a pointer moving over a still page, which is what a reader is actually doing here.
  */
  const circleRect = useRef(null)
  const circleRectStale = useRef(true)

  useEffect(() => {
    if (!showLens) return undefined

    const markStale = () => {
      circleRectStale.current = true
    }

    /* Passive: this only ever sets a boolean, and must never delay a scroll. */
    window.addEventListener('scroll', markStale, { passive: true })
    window.addEventListener('resize', markStale)

    return () => {
      window.removeEventListener('scroll', markStale)
      window.removeEventListener('resize', markStale)
    }
  }, [showLens])

  const handlePointerMove = useCallback((event) => {
    const circle = circleRef.current
    if (!circle) return

    if (circleRectStale.current || !circleRect.current) {
      circleRect.current = circle.getBoundingClientRect()
      circleRectStale.current = false
    }

    const rect = circleRect.current
    if (!rect.width || !rect.height) return

    /*
      Normalised against the circle's own radius, so ±1 is its rim and anything beyond
      is the cursor outside it — the magnitude is meaningful, and CssLens uses it to
      decide direction before clamping. Y is negated so +y is up, which is the convention
      the clamp arithmetic there is written in.
    */
    const radiusX = rect.width / 2
    const radiusY = rect.height / 2

    pointer.current.x = (event.clientX - (rect.left + radiusX)) / radiusX
    pointer.current.y = -(event.clientY - (rect.top + radiusY)) / radiusY

    /* Restarts the follow loop — see the note on lensWake. */
    lensWake.current?.()
  }, [])

  /* --- Playback ----------------------------------------------------------- */

  const aboutRef = useRef(null)
  const videoRef = useRef(null)

  /*
    Whether the hero has finished — and therefore whether the hero's own video has been
    paused. It is the same `isPastFirstViewport` selector Hero.jsx gates its playback on,
    so the two are two halves of one switch rather than two thresholds that happen to
    agree.

    THE RULE: exactly one of the two videos decodes at a time. story.webm used to start
    the moment About mounted, which is during first paint, which is while the visitor is
    still on the hero watching hero.webm — two simultaneous decodes for the whole first
    screen, on top of the hero's fixed backdrop, the section's viewport-wide
    backdrop-filter, the ticker's SVG displacement and the blended grain layer. It
    reverses cleanly too: scrolling back up resumes the hero and pauses this one.

    THE ONE COST, stated plainly: About's circle is on screen from roughly a third of
    the way down the hero, but the hero's video does not pause until a full viewport has
    been scrolled. Between those points the circle shows a still frame rather than moving
    footage. There is no way to close that window without either two decodes or a frozen
    hero, and a frozen hero is far more visible.
  */
  const heroCovered = useScrollPosition(isPastFirstViewport)

  /* The second gate: nothing decodes while the section is off screen. */
  const inView = useInView(aboutRef, { amount: PLAYBACK_AMOUNT })

  /*
    Both gates read through a ref so `syncPlayback` can stay a stable callback — it is
    handed to CssLens as a `ref` prop, and an identity that changed with the scroll would
    detach and reattach the element for no reason.
  */
  const shouldPlay = heroCovered && inView
  const shouldPlayRef = useRef(shouldPlay)
  shouldPlayRef.current = shouldPlay

  /*
    The single place playback is decided.

    Both gates in one expression, because they are one question — "should the story video
    be running right now?" — and splitting them across two effects is how the two ends
    drift apart.

    play() returns a promise that rejects if the element is torn down or interrupted
    mid-call; it is caught and dropped because there is nothing useful to do about it and
    an unhandled rejection is noise.
  */
  const syncPlayback = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (!shouldPlayRef.current) {
      if (!video.paused) video.pause()
      return
    }

    if (video.paused) {
      const played = video.play()
      if (played) played.catch(() => {})
    }
  }, [])

  /* Follows both gates in both directions, so scrolling back up reverses cleanly. */
  useEffect(() => {
    syncPlayback()
  }, [shouldPlay, syncPlayback])

  /*
    The one video element, handed up by CssLens.

    CssLens renders it without `autoPlay`, so this is the only thing that ever starts it —
    and it will not, until the hero's own video has stopped. Syncing on arrival is what
    covers the element turning up when the page is already past both gates.
  */
  const handleVideo = useCallback(
    (element) => {
      videoRef.current = element
      if (element) syncPlayback()
    },
    [syncPlayback],
  )

  const reveal = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  /* Stagger by delaying each block against the same base transition. */
  const revealAt = (delay) =>
    shouldReduceMotion
      ? {}
      : { ...reveal, transition: { ...reveal.transition, delay } }

  return (
    <section
      className={styles.about}
      id="about"
      ref={aboutRef}
      /* Only attached when there is a lens to drive — nothing listens on the plain path. */
      onMouseMove={showLens ? handlePointerMove : undefined}
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          {/*
            Two-part opening: a tiny tracked label, then the section title at the top of
            the type scale. Neither carries the accent — the only gold on this side is
            the dot before the label and the hairline down the paragraph.
          */}
          <motion.p className={styles.eyebrow} {...reveal}>
            Who We Are
          </motion.p>

          {/*
            "Our Story" as one unbroken string. It used to wrap "Story" in a span to
            paint it gold; with the accent gone the span had nothing to do, so the
            heading is plain text and .title-accent is deleted rather than left as a
            class that only sets the colour it already inherits.
          */}
          <motion.h2 className={styles.title} {...revealAt(0.08)}>
            Our Story
          </motion.h2>

          {/*
            Still a wrapper around a single <p> rather than a styled paragraph: .body
            owns the measure, the inline-start inset and the gold hairline that runs
            down it, and it is also the reveal step in the stagger ladder.
          */}
          <motion.div className={styles.body} {...revealAt(0.16)}>
            <p>{storyParagraph}</p>
          </motion.div>

          {/*
            /about is not routed yet — the link is wired ahead of the page.
            Shared button visuals + a local class carrying only its spacing.
          */}
          <MotionLink
            to="/about"
            className={`${buttonStyles.button} ${buttonStyles['button-glass']} ${styles.cta}`}
            {...revealAt(0.24)}
          >
            <span>Discover Our Story</span>
            <HiOutlineArrowNarrowRight size={20} aria-hidden="true" />
          </MotionLink>
        </div>

        {/*
          The visual column: a circular window onto looping footage, with a glass lens
          sitting on it under the pointer. It replaced the large logo that used to
          anchor this side — the mark is already in both headers, and a third instance
          at this size was the loudest thing in the section.

          Last in the reveal ladder so the copy lands first. It is also last in source
          order, which keeps the reading and tab order copy-first; the stacked layout
          puts the circle on top with `order` instead — see About.module.css.
        */}
        <motion.div className={styles.visual} {...revealAt(0.32)}>
          {/*
            The circle itself: the round clip, the rim, the fill and the shadow, with
            CssLens filling it absolutely. It is also the frame of reference the
            section's pointer coordinates are measured against.
          */}
          <div className={styles.circle} ref={circleRef}>
            <CssLens
              videoSrc={storyVideo}
              onVideo={handleVideo}
              pointer={pointer}
              showLens={showLens}
              wakeRef={lensWake}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
