import { useCallback, useEffect, useRef, useState } from 'react'

import styles from './LogoLoop.module.css'

/*
  A continuously scrolling horizontal strip of images.

  Written to the prop contract the caller asked for — logos, speed, direction,
  logoHeight, gap, pauseOnHover, fadeOut, fadeOutColor, ariaLabel — so a different
  implementation of the same component can replace this file without touching Founder.

  It is not the Tailwind version that was going to be pasted in: Tailwind is disconnected
  from this build on purpose (see CLAUDE.md §4), so utility classes would have rendered as
  unstyled markup. The brief's fallback was to convert those utilities to inline styles;
  this goes one step further and puts them in a CSS Module beside the component, which is
  what the rest of the project does and what keeps the animation in a stylesheet where the
  reduced-motion rule in global.css can reach it. Inline styles are kept for exactly the
  values that are genuinely runtime numbers.

  HOW THE LOOP IS SEAMLESS. The track holds enough whole copies of the set to overflow the
  container, and the animation translates it by exactly one copy's width plus one gap —
  the distance from the start of one copy to the start of the next. At the end of the
  cycle the strip is pixel-identical to its start, so the repeat has nothing to see.

  That width has to be measured rather than assumed: the images size themselves from a
  fixed height and their own aspect, and they arrive one by one. A ResizeObserver on the
  first copy is what keeps the shift honest as they decode.
*/

/* Two, so there is always a second copy following the first into view. */
const MIN_COPIES = 2

/*
  A bare number means pixels, which is the common case and what the prop contract asks
  for. A string is passed through untouched, so a caller can hand over any CSS length —
  including a clamp(), which is what lets a strip inside a fixed-height section scale with
  the viewport instead of pinning itself to one number. Both end up in a custom property,
  and the keyframe's calc() handles either.
*/
const toLength = (value) => (typeof value === 'number' ? `${value}px` : value)

function LogoLoop({
  logos = [],
  speed = 60,
  direction = 'left',
  logoHeight = 280,
  gap = 16,
  pauseOnHover = true,
  fadeOut = false,
  fadeOutColor = 'transparent',
  ariaLabel = 'Logo loop',
  paused = false,
}) {
  const containerRef = useRef(null)
  const sequenceRef = useRef(null)

  const [sequenceWidth, setSequenceWidth] = useState(0)
  const [copies, setCopies] = useState(MIN_COPIES)

  /*
    Whether any of the strip is on screen.

    The animation is infinite and, left alone, runs from first paint until the tab
    closes — including the several viewports of scrolling before this component is
    anywhere near the screen. That is not a cheap idle: the track is a `will-change:
    transform` layer holding a dozen photographs, and keeping it live costs the
    compositor whether or not anyone can see it.

    It observes the container rather than the track, because the track is the thing
    moving — a box that is permanently wider than the viewport and mid-transform is a
    poor thing to ask about intersection. The container is the fixed window onto it.

    Starts `true` so the strip is running on the first frame and only ever stops after
    an observation says it should; a browser without IntersectionObserver simply keeps
    the old always-on behaviour.
  */
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const measure = useCallback(() => {
    const container = containerRef.current
    const sequence = sequenceRef.current
    if (!container || !sequence) return

    const width = sequence.getBoundingClientRect().width
    const containerWidth = container.getBoundingClientRect().width
    if (!width) return

    /*
      Both are set unconditionally: React bails out of a re-render when a state value is
      unchanged, so the observer below can fire as often as it likes without this
      becoming a loop. Adding copies cannot change the width of the first one, which is
      what makes that safe.
    */
    setSequenceWidth(width)
    setCopies(Math.max(MIN_COPIES, Math.ceil(containerWidth / width) + 1))
  }, [])

  useEffect(() => {
    measure()

    if (typeof ResizeObserver === 'undefined') return undefined

    /*
      The container for viewport changes, the first sequence for its own content — images
      have no width until they decode, so the useful measurement is the late one.
    */
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    if (sequenceRef.current) observer.observe(sequenceRef.current)

    return () => observer.disconnect()
  }, [measure, logos, logoHeight, gap])

  /* px per second, so a longer strip takes proportionally longer and the pace is even. */
  const duration = sequenceWidth && speed ? sequenceWidth / Math.abs(speed) : 0

  const renderSequence = (copyIndex) => (
    <ul
      key={copyIndex}
      className={styles.sequence}
      ref={copyIndex === 0 ? sequenceRef : undefined}
      /* The set is announced once; the copies exist only to fill the track. */
      aria-hidden={copyIndex > 0 ? 'true' : undefined}
    >
      {logos.map((logo, index) => (
        <li className={styles.item} key={`${copyIndex}-${logo.src ?? index}`}>
          {/*
            `decoding="async"` so a photograph arriving mid-scroll is decoded off the
            main thread rather than blocking the frame it lands on. Every copy points at
            the same handful of files, so the decode happens once per image however many
            copies the track ends up holding.

            `loading="lazy"` on the copies only. The first sequence carries the real alt
            text and is the one that has to be measured — the ResizeObserver above reads
            its width to compute the loop's shift, and a lazy image has no width until it
            loads, so deferring it would leave the strip motionless behind a measurement
            that never arrives. The copies exist purely to fill the track and can turn up
            whenever they turn up.
          */}
          <img
            className={styles.image}
            src={logo.src}
            alt={copyIndex === 0 ? (logo.alt ?? '') : ''}
            draggable="false"
            decoding="async"
            loading={copyIndex === 0 ? undefined : 'lazy'}
          />
        </li>
      ))}
    </ul>
  )

  return (
    <div
      ref={containerRef}
      className={styles.loop}
      role="group"
      aria-label={ariaLabel}
      data-ready={duration > 0 ? 'true' : 'false'}
      data-direction={direction}
      data-pause-on-hover={pauseOnHover ? 'true' : 'false'}
      data-fade={fadeOut ? 'true' : 'false'}
      /*
        Two independent reasons to stop, resolved to one attribute because the
        stylesheet only cares that it is stopped: the caller says the strip is
        invisible (Founder passes this while the section is still faded out), or it is
        simply not on screen. Either way this is `paused`, not `none` — the strip holds
        wherever it is and resumes from there, so nothing jumps when it comes back.
      */
      data-paused={paused || !onScreen ? 'true' : 'false'}
      /*
        The only inline styles here, and each is a genuine runtime value: two measured
        lengths, a duration derived from one of them, and the caller's own numbers. They
        are passed as custom properties so the stylesheet stays the single description of
        what the strip looks like.
      */
      style={{
        '--logo-loop-height': toLength(logoHeight),
        '--logo-loop-gap': toLength(gap),
        '--logo-loop-shift': `${sequenceWidth}px`,
        '--logo-loop-duration': `${duration}s`,
        '--logo-loop-fade': fadeOutColor,
      }}
    >
      <div className={styles.track}>
        {Array.from({ length: copies }, (_, index) => renderSequence(index))}
      </div>
    </div>
  )
}

export default LogoLoop
