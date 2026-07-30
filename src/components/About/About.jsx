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
*/

/* Where the blur lands, measured on screen rather than in the layer's local space. */
const ZOOM_BLUR_PX = 25

/*
  A little past `cover`, so the square's edges are safely outside the viewport once the
  radius has squared off and no sliver of the section shows along an edge.
*/
const ZOOM_OVERSHOOT = 1.04

/*
  The lens fades out over the first 12% and its mesh is dropped at 15%. Early, because a
  refracting disc makes no sense once the circle stops being a circle — and because the
  cost it carries is the one worth shedding before the layer gets large.
*/
const LENS_FADE_END = 0.12
const LENS_DROP_AT = 0.15

/*
  Playback stops at 85%, where the blur is deep enough that the last moving frame and
  the frozen one are indistinguishable. Scrolling back up crosses the same line and
  resumes.
*/
const VIDEO_PAUSE_AT = 0.85

/* The circle squares off slightly before the zoom finishes, so it reaches the viewport
   edges as a rectangle rather than squaring off after it has already covered them. */
const RADIUS_DONE_AT = 0.8

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
    reduced motion drops it whole rather than shortening it. About then renders neither
    spacer, the stage collapses to the section, and the page below follows immediately.
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
    Where the circle has to travel to, in pixels, and how far it has to grow.

    Measured rather than guessed because both depend on layout: the circle's size is a
    min() of four terms, and its position is wherever the grid puts it. Recomputed on
    resize only — while .about is pinned the numbers cannot change, and the whole
    transition happens while it is pinned.
  */
  const [target, setTarget] = useState({ scale: 1, x: 0, y: 0 })

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
        The circle's centre *as it will sit once .about is pinned at inset-block-start:
        0*, which is not where it is right now. Taking the offset within the section and
        dropping the section's own viewport position gives the pinned coordinates from
        any scroll position, so this does not have to be re-measured mid-transition.
      */
      const centreX = c.left - a.left + size / 2
      const centreY = c.top - a.top + size / 2

      const vw = window.innerWidth
      const vh = window.innerHeight

      setTarget({
        /* Cover, not fit: the larger viewport axis is what the square has to span. */
        scale: (Math.max(vw, vh) / size) * ZOOM_OVERSHOOT,
        x: vw / 2 - centreX,
        y: vh / 2 - centreY,
      })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [zoomEnabled])

  /*
    Translate first, then scale about the element's own centre — so the circle slides to
    the middle of the viewport and grows from there, rather than growing from where it
    sits on the inline end and spilling off one side.
  */
  const zoomScale = useTransform(scrollYProgress, [0, 1], [1, target.scale])
  const zoomX = useTransform(scrollYProgress, [0, 1], [0, target.x])
  const zoomY = useTransform(scrollYProgress, [0, 1], [0, target.y])

  const zoomRadius = useTransform(
    scrollYProgress,
    [0, RADIUS_DONE_AT],
    ['50%', '0%'],
  )

  const scrimOpacity = useTransform(scrollYProgress, [0.1, 0.95], [0, 1])

  /*
    Divided by the live scale, and that division is the whole trick.

    `filter` applies in the element's local coordinate space and is then scaled with it,
    so a flat 25px blur would arrive on screen as 25px × the scale — around 75px at the
    end, and ramping non-linearly the whole way. Dividing it back out makes the *rendered*
    blur exactly ZOOM_BLUR_PX × progress, which is what the eye is being promised.
  */
  const mediaFilter = useTransform(
    [scrollYProgress, zoomScale],
    ([progress, scale]) =>
      `blur(${((progress * ZOOM_BLUR_PX) / (scale || 1)).toFixed(3)}px)`,
  )

  const lensOpacity = useTransform(scrollYProgress, [0, LENS_FADE_END], [1, 0])

  /*
    State, not a MotionValue, because it decides whether the mesh is in the tree at all.
    It flips twice per pass, so the re-render it costs is not on the scroll path.
  */
  const [lensMeshMounted, setLensMeshMounted] = useState(true)

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
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
      The stage is scroll runway, not layout: .about is pinned inside it and the two
      spacers below it give the zoom scroll distance to consume. With the zoom off it
      holds a single child and collapses to exactly the section's own height.
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
              Untransformed on purpose, and the frame of reference for two things: the
              section's pointer coordinates, and the zoom's measurement of where the circle
              sits and how large it is. getBoundingClientRect() on the transformed layer
              inside it would report the zoomed box instead of the resting one.
            */}
            <div className={styles.circle} ref={circleRef}>
              <motion.div
                className={styles['zoom-layer']}
                style={
                  zoomEnabled
                    ? {
                        x: zoomX,
                        y: zoomY,
                        scale: zoomScale,
                        borderRadius: zoomRadius,
                      }
                    : undefined
                }
              >
                {/*
                  The blur rides on this wrapper rather than on the layer above it, which
                  keeps the rim, the shadow and the scrim sharp while the footage softens.
                */}
                <motion.div
                  className={styles.media}
                  style={zoomEnabled ? { filter: mediaFilter } : undefined}
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
                      mesh sheds all of it. Scaling a canvas with CSS costs nothing extra
                      either — the backing store stays the circle's size, and the
                      upsampling that causes is hidden under the blur.
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
        all rather than merely be zero-height, or the page keeps 200vh of scroll leading
        nowhere.
      */}
      {zoomEnabled && (
        <>
          <div className={styles.runway} ref={runwayRef} aria-hidden="true" />
          {/* Where the Founder section's content will go, over the frozen frame. */}
          <div className={styles.hold} aria-hidden="true" />
        </>
      )}
    </div>
  )
}

export default About
