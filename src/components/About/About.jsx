import { useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { HiOutlineArrowNarrowRight } from 'react-icons/hi'

import useMediaQuery from '../../hooks/useMediaQuery'
import storyVideo from '../../assets/videos/story.mp4'
import FluidLens from '../shared/FluidLens'
import buttonStyles from '../shared/Button.module.css'
import styles from './About.module.css'

/* Lets the CTA animate without wrapping the Link in an extra layout box. */
const MotionLink = motion.create(Link)

/*
  The short home-page blurb. The long-form version lives on /about — keep this
  to two paragraphs so the section holds its single-screen height.

  Copy lives here as data so it can move to /src/data or a CMS later without
  touching the layout.
*/
const paragraphs = [
  'AGB Media is a Doha-based arts and media production house specialising in theatre, television, film, and visual content. Built on decades of creative experience, we bring together carefully selected teams to transform ideas into high-quality productions from concept to final delivery.',
  'Led by veteran Qatari artist Abdullah Ghayfan and writer-director Nael Al-Jarabah, AGB Media combines artistic leadership with a strong regional network to deliver productions that meet international standards while staying true to Gulf culture.',
]

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
      /* Only attached when there is a lens to drive — nothing listens on the plain path. */
      onMouseMove={showLens ? handlePointerMove : undefined}
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          {/*
            Two-part opening: a tracked label, then the section title. Both are plain
            --color-text now — the gold that used to carry this column moved into the
            glass button's sheen and the two hairlines, so the type itself is white.
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

          <motion.div className={styles.body} {...revealAt(0.16)}>
            {paragraphs.map((text) => (
              <p key={text.slice(0, 32)}>{text}</p>
            ))}
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
          {/* The ref is the frame of reference the section's pointer coords are measured against. */}
          <div className={styles.circle} ref={circleRef}>
            {showLens ? (
              /*
                The footage lives *inside* this canvas as a texture, not as a DOM
                element beneath it — MeshTransmissionMaterial can only refract what is
                in the WebGL scene. See the note at the top of FluidLens.jsx.
              */
              <FluidLens
                videoSrc={storyVideo}
                pointer={pointer}
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
                optional — an unmuted autoplay is refused by every browser — and it is
                what makes this safe to start without a user gesture.
              */
              <video
                className={styles.video}
                src={storyVideo}
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
              />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
