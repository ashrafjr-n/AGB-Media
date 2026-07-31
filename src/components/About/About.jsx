import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { HiOutlineArrowNarrowRight } from 'react-icons/hi'

import useMediaQuery from '../../hooks/useMediaQuery'
import useScrollPosition, {
  isPastFirstViewport,
} from '../../hooks/useScrollPosition'
import useExclusiveVideo, {
  PLAYBACK_PRIORITY,
} from '../../hooks/useExclusiveVideo'
import useSectionReveal from '../../hooks/useSectionReveal'
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

/*
  How far outside the viewport this section still counts as "showing the hero's
  footage through my glass", as an IntersectionObserver root margin.

  This is the one thing keeping Hero's fixed backdrop alive below the hero, so the
  margin is deliberately generous in both directions: it brings the backdrop back
  well before any of this section's glass can show it, and holds it a little past
  the section's bottom edge on the way down. The alternative — reporting on the
  section's exact edges — would put a re-created compositor layer and the glass that
  samples it on the same frame.

  400px, the same lead the Founder's video preload uses, for the same reason: it is
  roughly half a laptop viewport, which is a comfortable fraction of a second of
  scrolling rather than the quarter-second 200px buys.
*/
const GLASS_REACH_MARGIN = '400px 0px'

/**
 * @param {object} props
 * @param {(visible: boolean) => void} [props.onGlassVisibilityChange]
 *   Reports whether this section's frosted ground is near enough to the viewport to
 *   be showing the hero's fixed footage through it. This section is the only thing
 *   on the page that samples that backdrop, so the answer is what decides whether
 *   Hero renders it at all — see HomePage.jsx, which is where the two are wired
 *   together, and the gate in Hero.jsx.
 */
function About({ onGlassVisibilityChange }) {
  /*
    Read here for the LENS alone — the reveal ladder carries its own copy of this
    check inside useSectionReveal.

    The global prefers-reduced-motion rule in global.css only governs CSS animations,
    and neither of these is one: the ladder is driven inline by Framer, and the lens is
    a rAF loop writing a transform. Both have to honour the preference in JS.
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

  /*
    Whether the hero has finished — and therefore whether the hero's own video has been
    paused. It is the same `isPastFirstViewport` selector Hero.jsx gates its playback on,
    so the two are two halves of one switch rather than two thresholds that happen to
    agree.

    THE RULE: exactly one video on the page decodes at a time. story.webm used to start
    the moment About mounted, which is during first paint, which is while the visitor is
    still on the hero watching hero.webm — two simultaneous decodes for the whole first
    screen, on top of the hero's fixed backdrop, the section's viewport-wide
    backdrop-filter, the ticker's SVG displacement and the blended grain layer. It
    reverses cleanly too: scrolling back up resumes the hero and pauses this one.

    Folding it into `wants` below is also what keeps the hero exclusive without the hero
    being arbitrated: this section will not ask for playback until the hero has stopped.
    See the note on `wants` in useExclusiveVideo.js.

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
    Both gates in one expression, because they are one question — "would this section
    like its video running right now?" — and splitting them is how the two ends drift
    apart.

    It is an *intent*, not a decision. The Founder section asks the same question about
    its own background, and the two windows overlap at the boundary; useExclusiveVideo
    arbitrates and guarantees only one of them is ever actually decoding. This section
    holds the higher priority — the argument is at PLAYBACK_PRIORITY.

    CssLens renders its `<video>` without `autoPlay`, so `attachVideo` is the only thing
    that ever starts it, and it will not until the hero's own video has stopped.
  */
  const { attachVideo } = useExclusiveVideo({
    priority: PLAYBACK_PRIORITY.story,
    wants: heroCovered && inView,
  })

  /* --- The hero's backdrop, seen through this section's glass -------------- */

  /*
    A third observation of the same box, at a third distance, and each answers a
    question the other two cannot: `inView` is "may my video decode" at a fifth of
    the section, and this is "is the hero's footage still being looked at" from
    400px out.

    The distances are the reason these are not one observation. Playback wants the
    section committed to the screen; the glass starts sampling the footage at the
    section's very first visible pixel, and the layer it samples has to already
    exist by then — so this one is the default `amount: 0` with a margin either
    side, which is as early and as late as either edge can be answered.

    Reported through an effect rather than during render because it is a parent's
    state being written: HomePage owns the flag, since it is the only component that
    knows this section and the hero are on the same page. The callback is a setState
    function and therefore stable, so this fires on the two crossings and nothing
    else.
  */
  const glassInReach = useInView(aboutRef, { margin: GLASS_REACH_MARGIN })

  useEffect(() => {
    onGlassVisibilityChange?.(glassInReach)
  }, [glassInReach, onGlassVisibilityChange])

  /*
    The reveal ladder, one rung per block: label, heading, body, button, then the
    circle. The steps are indices rather than delays — the timing, the travel, the
    easing and the once-only viewport all live in useSectionReveal, which the Founder
    reveals from too so the two sections read as one gesture. It carries its own
    reduced-motion branch, so there is nothing to check here.
  */
  const revealAt = useSectionReveal()

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
          <motion.p className={styles.eyebrow} {...revealAt(0)}>
            Who We Are
          </motion.p>

          {/*
            "Our Story" as one unbroken string. It used to wrap "Story" in a span to
            paint it gold; with the accent gone the span had nothing to do, so the
            heading is plain text and .title-accent is deleted rather than left as a
            class that only sets the colour it already inherits.
          */}
          <motion.h2 className={styles.title} {...revealAt(1)}>
            Our Story
          </motion.h2>

          {/*
            Still a wrapper around a single <p> rather than a styled paragraph: .body
            owns the measure, the inline-start inset and the gold hairline that runs
            down it, and it is also the reveal step in the stagger ladder.
          */}
          <motion.div className={styles.body} {...revealAt(2)}>
            <p>{storyParagraph}</p>
          </motion.div>

          {/*
            /about is not routed yet — the link is wired ahead of the page.
            Shared button visuals + a local class carrying only its spacing.
          */}
          <MotionLink
            to="/about"
            className={`${buttonStyles.button} ${buttonStyles['button-glass']} ${styles.cta}`}
            {...revealAt(3)}
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
        <motion.div className={styles.visual} {...revealAt(4)}>
          {/*
            The circle itself: the round clip, the rim, the fill and the shadow, with
            CssLens filling it absolutely. It is also the frame of reference the
            section's pointer coordinates are measured against.
          */}
          <div className={styles.circle} ref={circleRef}>
            <CssLens
              videoSrc={storyVideo}
              onVideo={attachVideo}
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
