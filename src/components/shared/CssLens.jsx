import { useCallback, useEffect, useRef } from 'react'

import styles from './CssLens.module.css'

/*
  The Story circle: a looping video with a glass disc that follows the pointer over it.

  It replaced FluidLens, which did the same job with three.js — an R3F <Canvas>, the
  video as a VideoTexture on a frustum-filling plane, a lens mesh loaded from a .glb, and
  drei's MeshTransmissionMaterial refracting the scene through it. That was ~1.5MB of
  library and a WebGL context re-rendering the whole scene into an offscreen buffer every
  frame to compute the refraction, for one circle on one section. This is a div.

  WHAT IS HONESTLY DIFFERENT, because the two are not the same effect and pretending
  otherwise would waste someone's afternoon later.

  MeshTransmissionMaterial bent the *footage*: it sampled a render of the scene through a
  refraction offset, so the video visibly warped behind the glass, with real per-channel
  chromatic dispersion. Nothing in CSS can do that. `filter` applies to the element it is
  set on, not to what is behind it, and `backdrop-filter` only takes blur-and-colour
  operations that cannot displace a pixel sideways. Distorting the video itself needs
  either WebGL or a second decoded copy of the video inside the lens, and the second copy
  is exactly the simultaneous decode the rest of this page is built to avoid.

  So this is a *frosted* glass disc rather than a refracting one: a backdrop blur diffuses
  what is behind it, a saturate pass keeps that diffused footage looking like footage, a
  soft radial highlight and a flat white tint give the pane a body, and an inset shadow
  gives it thickness. It reads as glass. It does not bend the picture.

  It is also a PERFECT CIRCLE, which an earlier pass of it was not — see the note on .lens
  in CssLens.module.css for the SVG turbulence displacement that used to warp its edge and
  why nothing here may distort geometry again.
*/

/*
  The disc's diameter, in pixels, and it lives here rather than in the stylesheet because
  the follow arithmetic needs it: the travel bound is the circle's radius less this one.
  Handed to CSS as a custom property so the two cannot disagree.
*/
const LENS_SIZE = 140

/*
  How much of the remaining distance the disc covers each frame at 60fps — the same
  "enough lag to read as weight, not drag" the R3F lens got from maath's damp3.

  Applied through the exponential below rather than multiplied in directly. A flat
  per-frame fraction is a different curve on every display: at 120Hz it would run twice
  as many steps per second and the disc would snap to the cursor with half the weight.
  Raising it to the power of (elapsed frames) is the standard correction and makes this
  number mean the same thing everywhere.
*/
const FOLLOW_LERP = 0.12

/*
  When the follow stops asking for frames, in pixels of remaining distance.

  This is the "stop the loop when the mouse stops" rule, expressed as arrival rather than
  as a timeout: exponential smoothing is within a tenth of a pixel of its target about
  half a second after the last movement, so it lands in the same place a 500ms timer would
  and cannot be wrong about it. Below this the disc is snapped exactly onto the target and
  the loop ends until the next pointer move wakes it.
*/
const SETTLE_PX = 0.1

/* Used when no pointer ref is supplied — the disc simply rests at the centre. */
const CENTRED_POINTER = { current: { x: 0, y: 0 } }

/*
  `pointer` is a ref carrying { x, y } normalised against the circle's radius, with +y up.
  Its owner is About.jsx, which listens across the whole section — a ref rather than props
  because mousemove fires above the display's refresh rate and nothing in this component's
  output depends on the value; it is read once a frame inside the loop below.

  `wakeRef` is filled in with the function that starts that loop. About calls it from the
  same mousemove handler, because the loop is not running while the disc is at rest and
  the pointer moving is the only thing that can know it should be.
*/
function CssLens({ videoSrc, onVideo, pointer, showLens = true, wakeRef }) {
  const areaRef = useRef(null)
  const followRef = useRef(null)

  /* The disc's current offset from the circle's centre, in px. Never in state. */
  const position = useRef({ x: 0, y: 0 })

  /*
    How far the disc's centre may travel from the circle's centre: the circle's radius
    less the disc's own, so the glass stays wholly inside the frame rather than its centre
    sitting on the rim. Measured, because the circle is a min() of three terms that
    resolves differently across two breakpoints and with the window's own size.
  */
  const travel = useRef(0)

  const frame = useRef(null)
  const lastTime = useRef(0)

  const tick = useCallback(() => {
    frame.current = null

    const node = followRef.current
    if (!node) return

    const now = performance.now()
    const delta = Math.min((now - lastTime.current) / 1000, 0.1)
    lastTime.current = now

    const { x, y } = (pointer ?? CENTRED_POINTER).current

    /*
      The pointer arrives normalised against the circle's radius, so it is already past 1
      whenever the cursor is outside the circle — over the copy column, most of the time.
      Clamping the *vector* rather than each axis maps everything beyond the rim onto the
      bound in the direction it came from, which is what makes a cursor parked on the text
      read as "the glass is leaning that way" instead of pinning to a corner.
    */
    const distance = Math.hypot(x, y)
    const bounded = distance > 1 ? travel.current / distance : travel.current

    const targetX = x * bounded
    /* The pointer's y grows upward; CSS translate's grows down. */
    const targetY = -y * bounded

    /*
      Frame-rate independent exponential smoothing — see FOLLOW_LERP. `delta * 60` is how
      many 60fps frames this one stood in for, and the fraction left un-covered compounds
      once per frame, so raising it to that power is the same curve sampled coarsely.
    */
    const factor = 1 - (1 - FOLLOW_LERP) ** (delta * 60)

    const current = position.current
    current.x += (targetX - current.x) * factor
    current.y += (targetY - current.y) * factor

    const arrived =
      Math.abs(targetX - current.x) < SETTLE_PX &&
      Math.abs(targetY - current.y) < SETTLE_PX

    if (arrived) {
      /* Land exactly on it, so the resting position is the target and not almost it. */
      current.x = targetX
      current.y = targetY
    }

    node.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`

    /*
      The loop ends here when the disc has arrived. Nothing else in this file animates,
      so an arrived disc over a still pointer costs nothing at all until the next wake().
    */
    if (!arrived) frame.current = requestAnimationFrame(tick)
  }, [pointer])

  const wake = useCallback(() => {
    if (frame.current !== null) return

    lastTime.current = performance.now()
    frame.current = requestAnimationFrame(tick)
  }, [tick])

  /*
    A callback ref rather than a plain one, so the disc is placed during the commit
    instead of a frame later.

    `position` outlives the node — it belongs to this component, which stays mounted while
    `showLens` flips (a resize crossing the breakpoint is the case that reaches it).
    Without writing the transform as the node attaches, a fresh element would paint once
    at the centre of the circle and then jump to where the disc actually is.
  */
  const attachFollow = useCallback((node) => {
    followRef.current = node
    if (!node) return

    const { x, y } = position.current
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }, [])

  /*
    Handed out to About, which owns the section-wide mousemove.

    The loop stops as soon as the disc arrives, so something has to start it again, and
    the only thing that knows the target has moved is the listener that moved it. Cleared
    on unmount so a stale wake cannot resurrect a loop writing to a detached node.
  */
  useEffect(() => {
    if (!wakeRef) return undefined

    wakeRef.current = wake
    return () => {
      wakeRef.current = null
    }
  }, [wakeRef, wake])

  /* Nothing is left running behind an unmounted disc. */
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
    },
    [],
  )

  /*
    The travel bound, re-measured whenever the circle changes size — across the two
    breakpoints and on a window resize.

    `contentRect` rather than a getBoundingClientRect() of our own: a ResizeObserver
    already carries the measurement, and reading layout back inside its callback is how
    an observer turns into a loop.
  */
  useEffect(() => {
    const area = areaRef.current
    if (!area || !showLens || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect

      travel.current = Math.max(Math.min(width, height) / 2 - LENS_SIZE / 2, 0)
      wake()
    })

    observer.observe(area)
    return () => observer.disconnect()
  }, [showLens, wake])

  return (
    <div className={styles.area} ref={areaRef}>
      {/*
        A plain <video>, hardware-decoded by the browser, where FluidLens had to keep the
        footage inside the WebGL scene as a texture so there was something in the buffer
        for the transmission material to refract. That constraint is gone.

        No `autoPlay`, deliberately: playback is About's decision, because the hero's own
        video must have stopped before this one starts. `muted` is not optional — an
        unmuted play() is refused by every browser — and it is what makes this safe to
        start without a gesture.

        `preload="metadata"`, and the choice matters in both directions. Left at the
        default this element downloads its whole 4.7MB the moment it mounts, which is
        during first paint, in direct competition with the 3.7MB the hero needs for the
        screen the visitor is actually looking at — two large media fetches racing each
        other for the first screen's bandwidth. `metadata` fetches only enough to know
        the video's dimensions and decode its first frame.

        NOT `preload="none"`, which is the obvious next step and would be wrong: none
        means no frame is decoded, so the circle would show its flat --color-black fill
        from the moment it scrolls into view until playback starts a third of a viewport
        later. `metadata` gives the still frame the circle is supposed to be showing
        there, for a few hundred KB rather than the whole file. play() streams the rest
        when About finally calls it.
      */}
      <video
        ref={onVideo}
        className={styles.video}
        src={videoSrc}
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      />

      {/*
        Two nested elements rather than one, because the follow loop owns the outer one's
        `transform` outright — it writes it directly to the node every frame it moves, so
        nothing else may put a style on that element. The disc's own appearance lives on
        the inner one.

        There used to be more here: a third wrapper carrying a counter-scale for the
        scroll-zoom, and an inline <svg> defining the turbulence filter that warped the
        disc's edge. Both are gone, so this branch is a single element and needs no
        fragment around it.
      */}
      {showLens && (
        <div
          className={styles.follow}
          ref={attachFollow}
          style={{ '--lens-size': `${LENS_SIZE}px` }}
          aria-hidden="true"
        >
          <div className={styles.lens} />
        </div>
      )}
    </div>
  )
}

export default CssLens
