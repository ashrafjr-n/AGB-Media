import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { HiOutlineArrowNarrowRight } from 'react-icons/hi'

import useMediaQuery from '../../hooks/useMediaQuery'
import useScrollPosition, {
  isPastFirstViewport,
} from '../../hooks/useScrollPosition'
import storyVideo from '../../assets/videos/story.webm'
import Founder from '../Founder/Founder'
import CssLens from '../shared/CssLens'
import buttonStyles from '../shared/Button.module.css'
import styles from './About.module.css'

/*
  A plain import, where this was `lazy(() => import('../shared/FluidLens'))` behind a
  Suspense boundary.

  The split existed for one reason: FluidLens was the only module on the site that touched
  three, @react-three/fiber, @react-three/drei or maath — about 1.5MB of a 1.86MB bundle —
  and a static import put all of it in front of first paint for every visitor, including
  the ones below 48rem who would never mount it. CssLens is a few hundred lines with no
  dependencies beyond React and Framer Motion, both of which are in the main chunk
  already, so a separate chunk for it would be a second network round trip to save
  nothing.

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
    The circle's box, cached — and this was a forced synchronous layout on every single
    mousemove event.

    The note that used to sit here called the read cheap because nothing was written
    around it. That is true of the read in isolation and false in context. Framer Motion
    writes `width` and `height` inline on .zoom-layer from its own frame loop, and the
    grain layer, the section's backdrop-filter and two sticky boxes all sit above this in
    the tree — so any pending style invalidation makes `getBoundingClientRect()` flush
    layout for the whole document before it can answer. A high-polling-rate mouse fires
    well above the display's refresh, so that was happening several times per frame
    while the pointer moved, and continuously while it moved *during* the transition,
    which is exactly when the page has the least to spare.

    Nothing but scrolling or a resize can move this box: .circle is deliberately the
    untransformed parent (see the note at its call site), so the zoom does not move it
    and neither does anything else on the page. Marking the cache stale from those two
    events, and re-reading lazily on the next pointer move, caps the cost at one layout
    read per frame while scrolling — and takes it to zero for a pointer moving over a
    still page, which is what a reader is actually doing here.
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

  /* --- Scroll-zoom ------------------------------------------------------- */

  const aboutRef = useRef(null)
  const runwayRef = useRef(null)

  /*
    One handle, where this used to be two.

    While the lens was WebGL its footage lived *inside* the scene as a VideoTexture — the
    only way MeshTransmissionMaterial could refract it — so tearing the canvas down
    mid-transition meant swapping to a second, separately warmed <video> and matching
    their playheads at the swap. CssLens renders the one element the whole way through, so
    the priming window, the handoff seek and the pair of refs are all gone with it.
  */
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
    backdrop-filter, the ticker's SVG displacement and the blended grain layer. That is
    the heaviest moment on the site and it was carrying an entire video it had no use
    for. It reverses cleanly too: scrolling back up resumes the hero and pauses this one.

    Held on a ref *as well* as in state so the playback sync below can stay a stable
    callback — it is handed to two `ref` props, and an identity that changed twice per
    pass would detach and reattach them for no reason.

    THE ONE COST, stated plainly: About's circle is on screen from roughly a third of
    the way down the hero, but the hero's video does not pause until a full viewport has
    been scrolled. Between those points the circle now shows a still frame rather than
    moving footage. There is no way to close that window without either two decodes or a
    frozen hero, and a frozen hero is far more visible — it is full-bleed and it is what
    the visitor is looking at. Moving the handover means changing the shared selector,
    which moves the site header too.
  */
  const heroCovered = useScrollPosition(isPastFirstViewport)
  const heroCoveredRef = useRef(heroCovered)
  heroCoveredRef.current = heroCovered

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

    `size` doubles as the readiness flag: it is 0 until the first measurement lands, and
    the frame renders unstyled until then rather than starting from a zero-width box.
  */
  const [target, setTarget] = useState({ size: 0, width: 0, height: 0, x: 0, y: 0 })

  /*
    The footage's own aspect ratio, and the one thing the frame's geometry cannot be
    derived without.

    `object-fit: cover` used to answer this implicitly — it knew the intrinsic size and
    re-solved against every box the transition gave it. Reproducing that with a transform
    means computing the same answer here, and which axis covers depends on the video's
    aspect against the frame's. See `coverScale`.

    State rather than a ref because the transforms below are built from it, and it is
    written exactly once per page — `loadedmetadata` fires when the browser learns the
    dimensions, which `preload="metadata"` in CssLens is there to make happen early.
  */
  const [videoAspect, setVideoAspect] = useState(null)

  const readVideoAspect = useCallback((element) => {
    if (!element?.videoWidth || !element?.videoHeight) return

    setVideoAspect(element.videoWidth / element.videoHeight)
  }, [])

  /*
    Both entry points, because either can be the one that fires. A video served from
    cache can already have its dimensions by the time the ref callback runs, and a cold
    one will not — so the ref reads whatever is there and the event catches the rest.
    Setting the same number twice is a no-op; React bails on an unchanged state value.
  */
  const handleVideoMetadata = useCallback(
    (event) => readVideoAspect(event.currentTarget),
    [readVideoAspect],
  )

  /*
    Kept on a ref so the two places that need a *late* reading can ask for one — the
    reveal finishing, and the transition starting. See the notes at both call sites.
  */
  const measureRef = useRef(null)

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
        The translation that carries the frame's CENTRE to the viewport's centre.

        This used to be the offset that put the frame's top-left corner on the screen's
        top-left, which was the right statement while the box was growing from its own
        top-left. The box no longer grows — it is scaled about its own centre — so the
        target is the centre rather than the corner.

        The two are the same movement. Interpolating centre → centre linearly while the
        scale runs 1 → sx traces exactly the path the old corner-anchored growth traced:
        at progress p the old centre was `(left + size/2)(1-p) + p·vw/2`, and the new one
        is `left + size/2 + p·(vw/2 - left - size/2)`, which is the same expression. The
        intermediate frames are identical, not merely similar.

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
        x: vw / 2 - (c.left + size / 2),
        y: vh / 2 - (c.top - a.top + size / 2),
      })
    }

    measureRef.current = measure
    measure()
    window.addEventListener('resize', measure)
    return () => {
      measureRef.current = null
      window.removeEventListener('resize', measure)
    }
  }, [zoomEnabled])

  /*
    Re-read the geometry once the reveal has landed, and this is the fix for a gap along
    the bottom of the finished frame.

    The mount-time reading above is taken while .visual is still holding the reveal's
    `initial: { y: 24 }`, and getBoundingClientRect() reports that offset — so the circle
    measured 24px lower than where it settles, the frame was translated 24px too far up,
    and exactly that much of the section stayed visible under it. Nothing about the height
    was ever wrong; the anchor was.

    A late reading rather than a corrected early one, because the reveal is not the only
    thing that moves this. Clash Display swaps in after mount, and .inner centres its two
    columns against each other, so a reflowed copy column shifts the circle's centre too.
  */
  const handleRevealSettled = useCallback(() => {
    measureRef.current?.()
  }, [])

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
    --- The frame: a transform, not a box ------------------------------------

    .zoom-layer keeps its resting size for the whole transition and is *scaled* to the
    viewport. It used to genuinely become wider and taller — `width` and `height` written
    inline every frame — and the reason for the change is that those are layout
    properties: every frame dirtied layout for the subtree and, worse, resized a filtered,
    eventually viewport-sized layer, so the compositor could never keep a raster of it.
    `transform` is one of the two properties a browser can animate without laying out or
    repainting anything; the layer is rasterised once and the GPU moves it.

    THE SCALE IS NON-UNIFORM, because the frame is going from a square to the shape of the
    screen. Everything below is a consequence of that, and each piece exists to undo the
    distortion somewhere it would otherwise show.
  */
  const zoomScaleX = useTransform(
    easedProgress,
    [0, 1],
    [1, target.size ? target.width / target.size : 1],
  )
  const zoomScaleY = useTransform(
    easedProgress,
    [0, 1],
    [1, target.size ? target.height / target.size : 1],
  )

  /* Framer writes translate before scale, so this moves the frame unscaled. */
  const zoomX = useTransform(easedProgress, [0, 1], [0, target.x])
  const zoomY = useTransform(easedProgress, [0, 1], [0, target.y])

  /*
    The footage's own scale, and the number that makes the uncrop survive the rewrite.

    `object-fit: cover` used to do this work: as the box reshaped, cover re-solved against
    each new aspect and the footage was *uncropped* rather than magnified — the circle
    showed the middle square of a 16:9 frame, and by the end the whole frame. The box no
    longer reshapes, so cover is frozen on the resting square and has to be reproduced.

    This is the factor cover would have applied. It is the ratio by which the rendered
    footage grows, and it is UNIFORM at every point in the transition — cover never
    stretches, it only picks which axis fills and centres the rest. Which axis that is
    depends on the frame's aspect against the video's:

      height-driven while the frame is narrower than the footage   ->  scaleY
      width-driven once it is wider                                ->  scaleX / aspect

    and cover always takes whichever covers, hence the max. The two branches cross exactly
    where cover's own driver flips, so the curve here is continuous and has the same kink
    in the same place the old one did.

    The aspect is read off the element once its metadata lands (see handleVideoMetadata).
    Until then it falls back to the frame's final aspect, which makes the expression
    collapse to the height-driven branch — correct for any window narrower than the
    footage, and moot in practice: the transition cannot begin until the visitor has
    scrolled a viewport and a half, by which point the metadata is long since in.
  */
  const coverScale = useTransform(
    [zoomScaleX, zoomScaleY],
    ([scaleX, scaleY]) => {
      const aspect =
        videoAspect ?? (target.height ? target.width / target.height : 1)

      return Math.max(scaleY, aspect ? scaleX / aspect : scaleY)
    },
  )

  /*
    The counter-scale that turns the frame's non-uniform scale into the footage's uniform
    one. The media layer's net scale is `zoomScale * counter` on each axis — which is
    `coverScale` on both, by construction.

    So the footage is never stretched, exactly as it never was: what reaches the screen is
    the same rendered rectangle cover produced, at the same size, in the same place.
  */
  const mediaScaleX = useTransform(
    [coverScale, zoomScaleX],
    ([cover, scaleX]) => cover / scaleX,
  )
  const mediaScaleY = useTransform(
    [coverScale, zoomScaleY],
    ([cover, scaleY]) => cover / scaleY,
  )

  /*
    Circle → rounded rectangle, and then held there — the clamp past RADIUS_ROUNDED_AT is
    useTransform's own, not a stop. This is the radius as it should APPEAR on screen, and
    it is unchanged: half the resting width while the box is square, FRAME_RADIUS_PX after.
  */
  const zoomRadius = useTransform(
    easedProgress,
    [0, RADIUS_ROUNDED_AT],
    [target.size / 2, FRAME_RADIUS_PX],
  )

  /*
    ...divided back out per axis, because a radius is drawn in the element's own
    coordinates and then scaled with it. A single value under a non-uniform scale renders
    as an ellipse, so the corners are declared elliptically — `border-radius: Xpx / Ypx`,
    horizontal radius over vertical — with each half pre-divided by the scale on its own
    axis. What lands on screen is a circular corner of exactly `zoomRadius`.

    At rest both scales are 1 and this is `size/2 / size/2` on a square box: the same
    circle the stylesheet's 50% draws, so the handover on the first frame is still exact.
  */
  const zoomRadiusX = useTransform(
    [zoomRadius, zoomScaleX],
    ([radius, scaleX]) => radius / scaleX,
  )
  const zoomRadiusY = useTransform(
    [zoomRadius, zoomScaleY],
    ([radius, scaleY]) => radius / scaleY,
  )
  const zoomBorderRadius = useMotionTemplate`${zoomRadiusX}px / ${zoomRadiusY}px`

  const scrimOpacity = useTransform(easedProgress, [0.1, 0.95], [0, 1])

  /*
    The blur, divided by the scale again — the correction that was here before the frame
    stopped being scaled, back for the same reason it left.

    `filter` applies in an element's local coordinate space and is then scaled with it, so
    a flat 13px would arrive on screen as 13px × the scale. It is divided by `coverScale`
    rather than by either axis because the media layer's net scale is uniform — which is
    the whole point of the counter-scale above, and is also what makes an isotropic
    `blur()` the right shape here at all. A blur under a non-uniform scale would arrive as
    an ellipse, and there is no CSS blur that can be pre-squashed to compensate.
  */
  const blurPx = useTransform(
    easedProgress,
    [BLUR_START_AT, BLUR_FULL_AT],
    [0, ZOOM_BLUR_PX],
  )
  const mediaBlurPx = useTransform(
    [blurPx, coverScale],
    ([blur, cover]) => blur / cover,
  )
  const mediaFilter = useMotionTemplate`blur(${mediaBlurPx}px)`

  /*
    The blur's own margin, on exactly the blur's ramp so the two can never fall out of
    step — a negative inset pushing .media's faded edges out beyond the frame that clips
    them. See MEDIA_BLEED_PX for why the fade exists at all.

    Divided by the same scale as the blur is, so the bleed lands at a constant 48px on
    screen rather than growing to four times that. Because the inset is uniform and the
    layer is square, the box it makes stays square — so cover's driver cannot flip because
    of the bleed, only because of the frame's own aspect.
  */
  const bleedPx = useTransform(
    easedProgress,
    [BLUR_START_AT, BLUR_FULL_AT],
    [0, -MEDIA_BLEED_PX],
  )
  const mediaBleed = useTransform(
    [bleedPx, coverScale],
    ([bleed, cover]) => bleed / cover,
  )

  const lensOpacity = useTransform(easedProgress, [0, LENS_FADE_END], [1, 0])

  /*
    The lens disc's own counter-scale, undoing the media layer's uniform `coverScale` so
    the glass stays exactly the size it is at rest.

    It wraps the disc rather than sitting on it, so the follow loop's translate is applied
    *inside* the counter and comes back out at its natural magnitude — a disc that is the
    right size but drifting at four times the distance would be no better than one that
    grew. See the note at CssLens's `counterScale` prop.

    Only ~12% of the transition can see this: the disc is fully faded by LENS_FADE_END and
    dropped from the DOM at LENS_DROP_AT.
  */
  const lensCounterScale = useTransform(coverScale, (cover) => 1 / cover)

  /*
    The frame is only driven once it has been measured. Before that every target is 0, and
    writing them would collapse the circle to a zero-width box for as long as it took to
    measure — so it renders on its stylesheet values instead and the transition takes over
    on the next render. useLayoutEffect does the measuring, so that render lands before
    the browser paints and the unmeasured state is never seen.
  */
  const zoomActive = zoomEnabled && target.size > 0

  /*
    State, not a MotionValue, because it decides what is in the tree at all. It flips
    twice per pass, so the re-renders it costs are not on the scroll path.

    The disc is dropped from the DOM once its fade has finished, and stays gone for the
    rest of the page. That is a much smaller saving than it was when this tore down a
    whole WebGL context — what goes now is one small `backdrop-filter` element and its
    ResizeObserver — but it is the right moment to shed it either way: the frame is about
    to start growing toward the full viewport, and a refracting disc makes no sense once
    the circle stops being round.

    The video is untouched by this. It is a sibling of the disc inside CssLens, not a
    child of it, and it plays straight through the transition.
  */
  const [lensMounted, setLensMounted] = useState(true)

  /* Latches the single re-measurement below. */
  const measuredForRun = useRef(false)

  /*
    The single place playback is decided.

    Both gates in one expression, because they are one question — "should the story
    video be running right now?" — and splitting them across a scroll handler and an
    effect is how the two ends drift apart. The hero gate is above; the progress gate is
    the transition's own, where the blur is deep enough that the last moving frame and a
    frozen one are indistinguishable.

    Stable (`easedProgress` is a MotionValue and never changes identity), so the ref
    callback that calls it is stable too, and it can be invoked from anywhere that learns
    something new: the scroll handler, the effect on the hero gate, or the element
    arriving.

    play() returns a promise that rejects if the element is torn down or interrupted
    mid-call; it is caught and dropped because there is nothing useful to do about it
    and an unhandled rejection in a scroll handler is noise.
  */
  const syncPlayback = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const shouldPlay =
      heroCoveredRef.current && easedProgress.get() < VIDEO_PAUSE_AT

    if (!shouldPlay) {
      if (!video.paused) video.pause()
      return
    }

    if (video.paused) {
      const played = video.play()
      if (played) played.catch(() => {})
    }
  }, [easedProgress])

  /* The hero gate's own crossings — the scroll handler below only sees the zoom's. */
  useEffect(() => {
    syncPlayback()
  }, [heroCovered, syncPlayback])

  useMotionValueEvent(easedProgress, 'change', (progress) => {
    /*
      The backstop to handleRevealSettled: one more reading the first time the transition
      actually moves. It catches anything that shifted the row after the reveal finished
      — a late font swap being the likely one — and it covers the case where a fast scroll
      reaches the runway before the reveal has completed at all.

      Safe to take at any scroll position: both offsets it reads are scroll-invariant.
    */
    if (!measuredForRun.current && progress > 0) {
      measuredForRun.current = true
      measureRef.current?.()
    }

    setLensMounted(progress < LENS_DROP_AT)

    /* Follows the value in both directions, so scrolling back up resumes playback. */
    syncPlayback()
  })

  /*
    The one video element, handed up by CssLens.

    CssLens renders it without `autoPlay`, so this is the only thing that ever starts it —
    and it will not, until the hero's own video has stopped. Syncing on arrival is what
    covers the element turning up when the page is already past that gate.
  */
  const handleVideo = useCallback(
    (element) => {
      videoRef.current = element
      if (!element) return

      syncPlayback()
      readVideoAspect(element)
    },
    [syncPlayback, readVideoAspect],
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
          <motion.div
            className={styles.visual}
            {...revealAt(0.32)}
            /* The reveal's own transform offsets the zoom's measurement — see the note
               on handleRevealSettled. */
            onAnimationComplete={zoomEnabled ? handleRevealSettled : undefined}
          >
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
                        /*
                          Framer composes translate before scale, so the frame is moved
                          at its natural size and then scaled about its own centre —
                          which is why the measured target is a centre offset. Nothing
                          here touches layout.
                        */
                        x: zoomX,
                        y: zoomY,
                        scaleX: zoomScaleX,
                        scaleY: zoomScaleY,
                        borderRadius: zoomBorderRadius,
                        /*
                          Read by the box-shadow in About.module.css, which has to divide
                          its lengths back out — a shadow is drawn in the element's own
                          coordinates and scaled with it. The argument is at the rule.
                        */
                        '--frame-scale': zoomScaleY,
                      }
                    : undefined
                }
              >
                {/*
                  The blur rides on this wrapper rather than on the layer above it, which
                  keeps the rim, the shadow and the scrim sharp while the footage softens.

                  It also carries the counter-scale that undoes the frame's non-uniform
                  stretch, so everything inside it is drawn at a uniform `coverScale` —
                  the footage at exactly the size and crop `object-fit: cover` used to
                  give it, and the blur isotropic. See the notes on coverScale and
                  mediaScaleX above; the two are one mechanism.

                  The four insets are one motion value, not four — they are always equal,
                  and writing them separately would only invite them to drift apart.
                */}
                <motion.div
                  className={styles.media}
                  style={
                    zoomEnabled
                      ? {
                          scaleX: mediaScaleX,
                          scaleY: mediaScaleY,
                          filter: mediaFilter,
                          top: mediaBleed,
                          right: mediaBleed,
                          bottom: mediaBleed,
                          left: mediaBleed,
                        }
                      : undefined
                  }
                >
                  {/*
                    One component, on every path.

                    It renders the <video> unconditionally and the glass disc only when
                    told to, so the phone and reduced-motion paths are the same element
                    with the disc left off rather than a separate branch. They used to be
                    genuinely separate: the WebGL lens kept its footage *inside* the scene
                    as a texture, because MeshTransmissionMaterial can only refract what is
                    in the WebGL buffer, so every path without a canvas needed a <video> of
                    its own and the transition needed a warmed handoff between the two.

                    `showLens` folds the two reasons the disc might be absent — the
                    section-level one (wide enough, and motion allowed) and the
                    transition's, which drops it once the fade has finished.

                    The footage still *uncrops* rather than magnifying as the frame grows:
                    the <video> is `object-fit: cover` against a box that is changing shape,
                    exactly as it was on the old plain path. Nothing here is scaled.
                  */}
                  <CssLens
                    videoSrc={storyVideo}
                    onVideo={handleVideo}
                    onMetadata={handleVideoMetadata}
                    pointer={pointer}
                    showLens={showLens && lensMounted}
                    lensOpacity={lensOpacity}
                    lensCounterScale={zoomEnabled ? lensCounterScale : undefined}
                    wakeRef={lensWake}
                  />

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

          {/*
            The dwell. Scroll distance and nothing else, again — the founder is fully
            faded in and pinned across it, and it is what stops the section being carried
            off the top the instant it finishes arriving.
          */}
          <div className={styles.hold} aria-hidden="true" />
        </>
      )}

      {/*
        The founder, in a layer of its own so it can be pinned across the stage and
        released at exactly the point .about is — see .founder-layer in About.module.css.

        Rendered unconditionally, unlike the spacers above it. Those are scroll distance
        and must not exist when there is no zoom; this is a section of the site, and
        leaving it inside the branch would have deleted it under prefers-reduced-motion.

        Last in source order, so it is also last in the reading order — the founder follows
        the story, which is how the page reads on the paths where nothing is pinned at all.
      */}
      <div className={styles['founder-layer']}>
        <Founder progress={easedProgress} pinned={zoomEnabled} />
      </div>
    </div>
  )
}

export default About
