import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { HiOutlineArrowNarrowRight } from 'react-icons/hi'

import useMediaQuery from '../../hooks/useMediaQuery'
import storyVideo from '../../assets/videos/story.webm'
import FluidLens from '../shared/FluidLens'
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
  to track — and it is exactly the class of device least able to spare a WebGL context,
  a model fetch and a video texture.

  A JS gate rather than a CSS one because this decides whether to *mount*: hiding the
  canvas at a breakpoint would still pay for all three.
*/
const LENS_MIN_WIDTH = '(min-width: 48rem)'

/*
  --- Scroll-zoom tuning ----------------------------------------------------

  The transition runs over one viewport of scroll (.runway in About.module.css) and is
  expressed entirely as fractions of that, so retiming it means moving these and nothing
  else.

  The *delay* before it starts is not a number here: .lead sits between the section and
  the runway, so the pinned section simply holds, fully formed, for that much scroll
  before progress leaves 0. Retiming the wait means moving .lead's height, not a
  constant — the runway is still exactly 0 → 1 across its own height.

  Every fraction below is read against the EASED progress, not raw scroll, so they all
  land later in the scroll than their number suggests. That is deliberate: the blur, the
  scrim, the lens fade and the video gate all have to stay on one clock, and the eased
  value is the one the eye is actually reading.
*/

/*
  Where the blur lands.

  13px, down from 25. That is a smaller cut than it looks: the frame is no longer
  scaled, so this is a true screen-space blur and every pixel of it is what the eye
  gets. The old 25 was a local-space figure being divided back down by a live scale
  factor, and it had to be that large because it was fighting a 4× magnified layer.
  The frame is meant to soften here, not dissolve — the footage stays legible to the
  end, which is the point of uncropping it.
*/
const ZOOM_BLUR_PX = 13

/*
  The blur is the one property that does not run the full length of the transition. It
  holds off while the frame is still recognisably a circle and is fully in by the time
  the corners go sharp, so it reads as the frame settling rather than as a fade.
*/
const BLUR_START_AT = 0.2
const BLUR_FULL_AT = 0.7

/*
  The shape, in one leg rather than two.

  The circle relaxes into a rounded rectangle over the first 30% — the radius falling
  from half the circle's own width to FRAME_RADIUS_PX while the box is growing, so the
  corners tighten from both directions at once — and then it *stops*. There is no second
  leg taking the last 20px out: the finished frame keeps its corners, which is what makes
  it read as a framed panel rather than as a section that has simply been replaced.

  useTransform clamps outside its input range, so holding the value past 0.3 needs no
  second stop; the two-element range is the whole statement.

  That the corners survive is why the frame now ends exactly on the viewport rather than
  a couple of pixels past it. It used to bleed out so its rim finished off screen; the
  rim and the corners are the point now, so bleeding them away would be throwing out what
  this is for.

  Radius is carried in pixels rather than percentages, because a percentage radius on a
  box that is wider than it is tall resolves to an *ellipse*. At rest the box is square,
  so half its width is precisely the 50% the stylesheet holds, and the two agree on the
  first frame.
*/
const FRAME_RADIUS_PX = 20
const RADIUS_ROUNDED_AT = 0.3

/*
  How far .media is pushed outside the frame that clips it, and the fix for a dark ring
  that used to close in around the footage as the blur came up.

  `filter: blur()` samples past the edges of the element it is applied to, and there is
  nothing out there — so the outermost band of a blurred box fades toward transparent and
  lets whatever is behind it through. Behind .media is .zoom-layer's opaque --color-black,
  so the frame was drawing its own dark vignette, tens of pixels deep, exactly in step
  with the blur ramp.

  CSS blur(v) is a Gaussian with standard deviation v, so the fade is meaningful out to
  roughly 3v — about 39px at full strength. 48px clears that with room, and .zoom-layer's
  overflow: hidden crops the surplus, so the only part of .media ever on screen is the
  part that is fully opaque.

  It ramps with the blur rather than sitting at a constant, which is what keeps the
  resting section untouched: at progress 0 there is no blur and no bleed, and .media is
  exactly the frame. The cover crop drifts by a few percent while it is out — under the
  blur that produced it, and invisible.
*/
const MEDIA_BLEED_PX = 48

/*
  Scroll → progress is raised to this power before anything reads it: slow start, fast
  finish. At 2 the first half of the runway produces a quarter of the visual change and
  the second half produces the other three quarters, which is what keeps the section
  legible while it is still recognisably a section.
*/
const ZOOM_EASE_POWER = 2

/*
  The lens fades out over the first 12% and its mesh is dropped at 15%. Early, because a
  refracting disc makes no sense once the circle starts relaxing out of round — and
  because the cost it carries is the one worth shedding before the layer gets large.

  These are eased fractions, so 0.15 is reached around a third of the way down the
  runway — later in scroll than it was under a linear map, which suits the slower start.
*/
const LENS_FADE_END = 0.12
const LENS_DROP_AT = 0.15

/*
  Playback stops at 85%, where the blur is deep enough that the last moving frame and
  the frozen one are indistinguishable. Scrolling back up crosses the same line and
  resumes.
*/
const VIDEO_PAUSE_AT = 0.85

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
    same footage in the same circle; only the refraction goes.
  */
  const showLens = isWideEnoughForLens && !shouldReduceMotion

  /*
    The zoom is scroll-driven transform and blur — motion with no still equivalent — so
    reduced motion drops it whole rather than shortening it. About then renders none of
    the spacers, the stage collapses to the section, and the page below follows
    immediately.
  */
  const zoomEnabled = !shouldReduceMotion

  /*
    The lens reads the pointer from the *whole section*, not from the canvas.

    Hovering a 550px circle is a small target on a two-column layout, and R3F's built-in
    state.pointer only updates while the cursor is over the canvas — so for most of the
    time the reader spends here, with the cursor on the copy, the lens sat frozen. This
    listener covers the section, and FluidLens clamps whatever it gets to the circle's
    interior, so the glass leans toward the cursor without ever escaping the frame.

    A ref rather than state on purpose: mousemove fires per frame at best and there is
    nothing in the render output that depends on the value — storing it in state would
    re-render the section, the Canvas and the lens material on every mouse event to
    feed a number only useFrame ever reads.
  */
  const circleRef = useRef(null)
  const pointer = useRef({ x: 0, y: 0 })

  const handlePointerMove = useCallback((event) => {
    const circle = circleRef.current
    if (!circle) return

    /*
      Read per event rather than cached: the rect moves with every scroll, and this is
      a single layout read with no writes interleaved, which is the cheap direction.
    */
    const rect = circle.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    /*
      Normalised against the circle's own radius, so ±1 is its rim and anything beyond
      is the cursor outside it — the magnitude is meaningful, and FluidLens uses it to
      decide direction before clamping. Y is negated because the document's Y grows
      downward and the scene's grows up.
    */
    const radiusX = rect.width / 2
    const radiusY = rect.height / 2

    pointer.current.x = (event.clientX - (rect.left + radiusX)) / radiusX
    pointer.current.y = -(event.clientY - (rect.top + radiusY)) / radiusY
  }, [])

  /* --- Scroll-zoom ------------------------------------------------------- */

  const aboutRef = useRef(null)
  const runwayRef = useRef(null)
  const videoRef = useRef(null)

  /*
    0 → 1 across exactly the runway's height.

    The offsets read as "start of the runway at the bottom of the viewport" → "start of
    the runway at the top of it", which is the one screen of scrolling during which
    .about is pinned and the runway is sliding up behind it. Tracking the runway rather
    than the stage is what keeps the timing independent of the hold below it.
  */
  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ['start end', 'start start'],
  })

  /*
    Where the frame has to travel to, and what size it has to end up — both in pixels,
    both measured rather than guessed, because both depend on layout: the circle's size is
    a min() of three terms and its position is wherever the grid puts it.

    Recomputed on resize only. While .about is pinned these numbers cannot change, and the
    whole transition happens while it is pinned.

    `size` doubles as the readiness flag: it is 0 until the first measurement lands, and
    the frame renders unstyled until then rather than starting from a zero-width box.
  */
  const [target, setTarget] = useState({ size: 0, width: 0, height: 0, x: 0, y: 0 })

  useLayoutEffect(() => {
    if (!zoomEnabled) return undefined

    const measure = () => {
      const circle = circleRef.current
      const about = aboutRef.current
      if (!circle || !about) return

      const c = circle.getBoundingClientRect()
      const a = about.getBoundingClientRect()
      const size = c.width
      if (!size) return

      /*
        clientWidth rather than innerWidth: innerWidth counts a classic scrollbar, and the
        frame's edge has to land on the visible edge of the page rather than underneath
        the gutter. Height is innerHeight, which is the screen actually on show — on a
        phone with the toolbars out that is less than 100vh, and it is the smaller of the
        two the frame has to cover.

        Exactly the viewport, with nothing added. The frame keeps its rounded corners to
        the end, so its edges are meant to be seen — overshooting would push the corners
        off screen and undo them.
      */
      const vw = document.documentElement.clientWidth
      const vh = window.innerHeight

      /*
        The frame does not need to be told to centre itself. It only needs to end up as a
        box the size of the screen with its top-left corner on the screen's top-left, and
        interpolating linearly toward that from its resting box carries its centre along a
        straight line to the centre of the viewport for free — the algebra cancels.

        Both offsets are the *pinned* position, not the current one. X is scroll-invariant
        so the live rect is already correct; Y is not, but .about pins at
        inset-block-start: 0, so the circle's offset within the section is exactly where
        it will sit once pinned. That is what lets this be measured once rather than
        re-read mid-transition.
      */
      setTarget({
        size,
        width: vw,
        height: vh,
        x: -c.left,
        y: -(c.top - a.top),
      })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [zoomEnabled])

  /*
    The single clock everything downstream reads.

    Raw scroll is linear; this is it raised to ZOOM_EASE_POWER, so the transition creeps
    away from rest and then accelerates into the finish. It is derived once here rather
    than eased per property, because the properties only hold together — the blur
    arriving with the scale, the scrim arriving with both — while they share one curve.
  */
  const easedProgress = useTransform(scrollYProgress, (progress) =>
    Math.pow(progress, ZOOM_EASE_POWER),
  )

  /*
    The frame's *box*, not a scale on it, and that substitution is the whole point of
    this transition.

    Nothing is magnified. The element genuinely becomes wider and taller, and the video
    inside it is left entirely alone — no transform of its own, just object-fit: cover
    against a box that is changing shape. Cover always fills the box from the centre out,
    so widening the box does not stretch the footage, it *uncrops* it: the circle shows
    the middle square of a 16:9 frame, and by the end the same frame is being shown whole.
    The reveal comes from the aperture opening rather than from anything moving.

    What it costs, and it is the one real cost here: `width` and `height` are layout
    properties, so this cannot ride the compositor the way a scale did. The layer is
    absolutely positioned and everything under it is `inset: 0`, so no ancestor or sibling
    reflows — but on the lens path the R3F canvas resizes with it, and R3F answers a
    resize by reallocating its drawing buffer. That runs once a frame while the frame is
    growing. The lens *mesh* is already dropped by 0.15, which sheds the expensive half of
    it; if the rest ever needs shedding, capping the canvas's dpr is the dial.

    The translate is still a transform, because moving the frame does not have to be a
    layout operation and there is no reason to make it one.
  */
  const zoomWidth = useTransform(easedProgress, [0, 1], [target.size, target.width])
  const zoomHeight = useTransform(easedProgress, [0, 1], [target.size, target.height])
  const zoomX = useTransform(easedProgress, [0, 1], [0, target.x])
  const zoomY = useTransform(easedProgress, [0, 1], [0, target.y])

  /*
    Circle → rounded rectangle, and then held there for the rest of the transition — the
    clamp past RADIUS_ROUNDED_AT is useTransform's own, not a stop. Half the resting width
    is the same shape the stylesheet's 50% draws while the box is still square, so the
    handover on the first frame is exact; see the note on FRAME_RADIUS_PX for the rest.
  */
  const zoomRadius = useTransform(
    easedProgress,
    [0, RADIUS_ROUNDED_AT],
    [target.size / 2, FRAME_RADIUS_PX],
  )

  const scrimOpacity = useTransform(easedProgress, [0.1, 0.95], [0, 1])

  /*
    A plain screen-space blur now, with no correction term.

    It used to be divided by the live scale, because `filter` applies in an element's
    local coordinate space and was then magnified along with it — a flat 25px arrived on
    screen as 25px × the scale. Nothing is scaled any more, so the number here is the
    number that lands, and the division that used to be the whole trick is gone.
  */
  const mediaFilter = useTransform(
    easedProgress,
    [BLUR_START_AT, BLUR_FULL_AT],
    ['blur(0px)', `blur(${ZOOM_BLUR_PX}px)`],
  )

  /*
    The blur's own margin, on exactly the blur's ramp so the two can never fall out of
    step — a negative inset applied to all four sides, pushing .media's faded edges out
    beyond the frame that clips it. See MEDIA_BLEED_PX for why the fade exists at all.
  */
  const mediaBleed = useTransform(
    easedProgress,
    [BLUR_START_AT, BLUR_FULL_AT],
    [0, -MEDIA_BLEED_PX],
  )

  const lensOpacity = useTransform(easedProgress, [0, LENS_FADE_END], [1, 0])

  /*
    The frame is only driven once it has been measured. Before that every target is 0, and
    writing them would collapse the circle to a zero-width box for as long as it took to
    measure — so it renders on its stylesheet values instead and the transition takes over
    on the next render. useLayoutEffect does the measuring, so that render lands before
    the browser paints and the unmeasured state is never seen.
  */
  const zoomActive = zoomEnabled && target.size > 0

  /*
    State, not a MotionValue, because it decides whether the mesh is in the tree at all.
    It flips twice per pass, so the re-render it costs is not on the scroll path.
  */
  const [lensMeshMounted, setLensMeshMounted] = useState(true)

  useMotionValueEvent(easedProgress, 'change', (progress) => {
    setLensMeshMounted(progress < LENS_DROP_AT)

    /*
      Playback follows the same value in both directions, so scrolling back up resumes
      it. play() is a promise that rejects if the element is torn down or interrupted
      mid-call; it is caught and dropped because there is nothing useful to do about it
      and an unhandled rejection in a scroll handler is noise.
    */
    const video = videoRef.current
    if (!video) return

    if (progress >= VIDEO_PAUSE_AT) {
      if (!video.paused) video.pause()
    } else if (video.paused) {
      const played = video.play()
      if (played) played.catch(() => {})
    }
  })

  /*
    The lens owns its <video> internally, so FluidLens hands it up through this. The
    plain path assigns the same ref directly on the element — either way videoRef is the
    one handle the pause logic needs, and it does not care which path produced it.
  */
  const handleVideoElement = useCallback((element) => {
    videoRef.current = element
  }, [])

  /* Nothing should be left paused behind a torn-down transition. */
  useEffect(() => () => { videoRef.current = null }, [])

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
    /*
      The stage is scroll runway, not layout: .about is pinned inside it and the three
      spacers below it give the zoom scroll distance to consume — a lead-in that delays
      it, the runway it plays over, and a hold at the end. With the zoom off it holds a
      single child and collapses to exactly the section's own height.
    */
    <div className={styles.stage} data-zoom={zoomEnabled ? 'on' : 'off'}>
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
            refracting it under the pointer. It replaced the large logo that used to
            anchor this side — the mark is already in both headers, and a third instance
            at this size was the loudest thing in the section.

            Last in the reveal ladder so the copy lands first. It is also last in source
            order, which keeps the reading and tab order copy-first; the stacked layout
            puts the circle on top with `order` instead — see About.module.css.
          */}
          <motion.div className={styles.visual} {...revealAt(0.32)}>
            {/*
              Left alone on purpose, and the frame of reference for two things: the
              section's pointer coordinates, and the zoom's measurement of where the circle
              sits and how large it is. The layer inside it is both resized and translated
              during the transition, so getBoundingClientRect() on that would report a box
              on its way to filling the screen rather than the resting one.
            */}
            <div className={styles.circle} ref={circleRef}>
              <motion.div
                className={styles['zoom-layer']}
                style={
                  zoomActive
                    ? {
                        x: zoomX,
                        y: zoomY,
                        width: zoomWidth,
                        height: zoomHeight,
                        borderRadius: zoomRadius,
                      }
                    : undefined
                }
              >
                {/*
                  The blur rides on this wrapper rather than on the layer above it, which
                  keeps the rim, the shadow and the scrim sharp while the footage softens.

                  The four insets are one motion value, not four — they are always equal,
                  and writing them separately would only invite them to drift apart.
                */}
                <motion.div
                  className={styles.media}
                  style={
                    zoomEnabled
                      ? {
                          filter: mediaFilter,
                          top: mediaBleed,
                          right: mediaBleed,
                          bottom: mediaBleed,
                          left: mediaBleed,
                        }
                      : undefined
                  }
                >
                  {showLens ? (
                    /*
                      The footage lives *inside* this canvas as a texture, not as a DOM
                      element beneath it — MeshTransmissionMaterial can only refract what
                      is in the WebGL scene. See the note at the top of FluidLens.jsx.

                      The canvas stays mounted through the whole transition and only the
                      lens *mesh* is dropped. Unmounting the Canvas instead would destroy
                      the single decode of story.webm partway through the scroll and force a
                      swap to a second <video> at the moment the frame is most visible;
                      the expensive part is the transmission material, and dropping the
                      mesh sheds all of it.

                      This canvas now *resizes* with the frame rather than being scaled by
                      it, which is what lets the WebGL path uncrop exactly like the DOM
                      one: VideoPlane recomputes its cover scale from the R3F viewport, so
                      a wider canvas shows more of the footage instead of magnifying it.
                      It is also the reason the resize is not free — see the note on the
                      width and height transforms above.
                    */
                    <FluidLens
                      videoSrc={storyVideo}
                      pointer={pointer}
                      onVideo={handleVideoElement}
                      showLens={lensMeshMounted}
                      lensOpacity={lensOpacity}
                      lensProps={{
                        scale: 0.25,
                        ior: 1.15,
                        thickness: 2,
                        transmission: 1,
                        roughness: 0,
                        chromaticAberration: 0.05,
                        anisotropy: 0.01,
                      }}
                    />
                  ) : (
                    /*
                      The plain path: the same footage, no lens over it. `muted` is not
                      optional — an unmuted autoplay is refused by every browser — and it
                      is what makes this safe to start without a user gesture.
                    */
                    <video
                      ref={handleVideoElement}
                      className={styles.video}
                      src={storyVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      aria-hidden="true"
                    />
                  )}
                </motion.div>

                {/*
                  The veil, above the media and inside the same clip, so it squares off
                  with the frame rather than sitting behind a rounded edge.
                */}
                {zoomEnabled && (
                  <motion.div
                    className={styles.scrim}
                    style={{ opacity: scrimOpacity }}
                    aria-hidden="true"
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/*
        Rendered only when the zoom is on. Under reduced motion they must not exist at
        all rather than merely be zero-height, or the page keeps 240vh of scroll leading
        nowhere.
      */}
      {zoomEnabled && (
        <>
          {/*
            The wait. It carries no animation at all — it exists so that the section is
            pinned and complete for a beat before the runway below it starts feeding
            progress, and it delays the whole transition purely by pushing the runway
            further down the document.
          */}
          <div className={styles.lead} aria-hidden="true" />
          <div className={styles.runway} ref={runwayRef} aria-hidden="true" />
          {/* Where the Founder section's content will go, over the frozen frame. */}
          <div className={styles.hold} aria-hidden="true" />
        </>
      )}
    </div>
  )
}

export default About
