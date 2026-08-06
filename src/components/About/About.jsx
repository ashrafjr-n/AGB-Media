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
  THERE IS NO LONGER A `GLASS_REACH_MARGIN` HERE, and the deletion is the point rather
  than a tidy-up.

  This section used to observe its own box a third time, at a root margin, purely to tell
  Hero whether its `position: fixed` footage was still being sampled through this glass —
  reported up through HomePage as `onGlassVisibilityChange`. The margin was the whole
  difficulty: too tight and the layer was re-created on the frame the glass first read it,
  too loose and a full-viewport 4K texture stayed composited well into the Founder. It was
  tuned twice and was wrong in one direction or the other both times.

  The footage is now `position: sticky`, scoped to a stage holding exactly the hero and
  this section (HeroBackdrop.module.css). A sticky box cannot be offset past its own
  containing block, so it stops being on screen at this section's bottom edge as a matter
  of layout. Nothing has to observe anything and there is no threshold left to tune.

  WHAT THIS SECTION STILL OWES THE ARRANGEMENT: its ground must cover its FULL height, not
  just the first screen — see .about::before. The glass is the only thing between the
  reader and that footage, and a ground that stops short does not fall back to black, it
  falls back to bare video.
*/

/*
  How much of this section has to be on screen before the fixed site header arrives.

  The handoff used to be `isPastFirstViewport` — one scrolled viewport, which is the end
  of the hero — so the header appeared only once this section had taken the screen
  outright. It now arrives at this section's own halfway mark instead, which is a good
  deal earlier: half of a 100vh section is on screen from half a viewport of scrolling.

  Measured against THIS BOX rather than as a multiple of the viewport, and that is the
  point of doing it here at all. `min-block-size: 100vh` is a floor — the section is
  taller than a screen whenever the copy needs it to be — so a scroll threshold written
  in viewport heights would drift from the section's real midpoint on exactly the windows
  where it is least like one viewport.

  It cannot bring the two headers on screen together: the hero's own header is in flow at
  the very top of the page and is gone after roughly 120px of scrolling, where this fires
  at half a viewport.
*/
const HEADER_REVEAL_AMOUNT = 0.5

/**
 * One of this section's two observations of itself is reported upward rather than used
 * here, because what it gates belongs to another component. It is wired in HomePage.jsx,
 * which is the only thing that knows the two are on the same screen.
 *
 * There were three, and the third — `onGlassVisibilityChange`, which told Hero whether
 * its footage was still being sampled through this glass — went with the fixed backdrop
 * it existed to gate. See the note where its root margin used to be, above.
 *
 * @param {object} props
 * @param {(halfVisible: boolean) => void} [props.onHalfVisibleChange]
 *   Reports whether half of this section is on screen, which is when the fixed site
 *   header is due — see HEADER_REVEAL_AMOUNT above and Header.jsx.
 */
function About({ onHalfVisibleChange }) {
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

    It is an *intent* rather than a decision, and it still goes through
    useExclusiveVideo even though this is now the page's ONLY claimant. The Founder used
    to ask the same question about its own background over an overlapping range, and the
    registry existed to resolve the two; its ground is a still image now. What the hook
    still buys here is a declarative play/pause and the DEV assertion that the invariant
    holds — and it is where a second video ground would register. See the note at the top
    of that file for why it was kept rather than unwound.

    CssLens renders its `<video>` without `autoPlay`, so `attachVideo` is the only thing
    that ever starts it, and it will not until the hero's own video has stopped.
  */
  const { attachVideo } = useExclusiveVideo({
    priority: PLAYBACK_PRIORITY.story,
    wants: heroCovered && inView,
  })

  /* --- What this section's position tells the rest of the page ------------- */

  /*
    TWO OBSERVATIONS OF ONE BOX, at two distances, and each answers a question the other
    cannot. `inView` above is "may my video decode", at a fifth of the section.
    `halfVisible` is "is the site header due", at the section's midpoint.

    There was a third at a root margin — "is the hero's footage still being looked at" —
    and it is gone with the fixed backdrop it fed. Sticky answers that in layout now.

    They are separate observers rather than one with several thresholds because they are
    read as independent booleans and IntersectionObserver reports a threshold crossing,
    not which threshold: collapsing them would mean deriving both states from one ratio on
    every crossing, which is more code and one shared failure. Two observers on one
    element is cheap — the browser batches them off the main thread and neither reads
    layout.

    Reported through an effect rather than during render because it is a parent's state
    being written: HomePage owns the flag, since it is the only component that knows this
    section and the header are on the same screen. The callback is a setState function and
    therefore stable, so this fires on the two crossings and nothing else.
  */
  const halfVisible = useInView(aboutRef, { amount: HEADER_REVEAL_AMOUNT })

  useEffect(() => {
    onHalfVisibleChange?.(halfVisible)
  }, [halfVisible, onHalfVisibleChange])

  /*
    The reveal ladder, one rung per block: label, heading, body, button, then the
    circle. The steps are indices rather than delays — the timing, the travel, the
    easing and the once-only viewport all live in useSectionReveal, which the Founder
    reveals from too so the two sections read as one gesture. It carries its own
    reduced-motion branch, so there is nothing to check here.
  */
  const revealAt = useSectionReveal('about')

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