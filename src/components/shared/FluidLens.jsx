import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial, useGLTF, useVideoTexture } from '@react-three/drei'
import { easing } from 'maath'

import styles from './FluidLens.module.css'

/*
  A glass lens that follows the pointer and refracts a looping video behind it.

  Cut down from the community FluidGlass component to the one mode this site uses:
  no ScrollControls, no Scroll, no Images, no Typography, no NavItems, and neither
  the bar nor the cube mode. There is no `mode` prop for the same reason — lens is
  the only thing left, so a prop with one legal value would be noise. The hardcoded
  gl.setClearColor is gone too; the canvas clears transparent.

  ---

  One deliberate departure from the brief, because the brief cannot work as written.

  The plan was for the video to stay an ordinary HTML <video> underneath a
  transparent canvas, with MeshTransmissionMaterial refracting "whatever is behind
  it". It cannot: transmission works by rendering the *WebGL scene* into an offscreen
  buffer and sampling that buffer with refraction offsets. A DOM element behind the
  canvas is never in that buffer. The lens would have come out as a faint glassy
  disc with some specular on it, and the video underneath would have shown through
  completely undistorted — every part mounted, the actual effect absent.

  So the video is inside the scene instead, as a VideoTexture on a plane filling the
  camera frustum, with the lens in front of it. Now there is something in the buffer
  to bend, and the refraction is real. What that costs: the video is no longer a DOM
  node on this path, so the reduced-motion and mobile fallbacks render their own
  plain <video> in About.jsx rather than sharing one element with this. Only ever one
  of the two mounts, so the file is only ever decoded once.
*/

const LENS_MODEL = '/assets/3d/lens.glb'

/*
  Camera at z=20 with a narrow 15° field, and the lens at z=15 — close to the lens,
  far from the video. The narrow field is what keeps the refraction legible: a wide
  one distorts the plane toward the edges of frame on its own and muddies what the
  glass is actually doing.
*/
const CAMERA = { position: [0, 0, 20], fov: 15 }
const LENS_Z = 15

/* Pointer follow, in seconds to catch up. Enough lag to read as weight, not drag. */
const FOLLOW_DAMPING = 0.15

/*
  How close the lens has to be to where the pointer wants it before it stops asking for
  frames. See the note in useFrame — this is a distance in scene units, and it is well
  under a pixel: the frustum at LENS_Z is ~1.3 units across a canvas that is ~430px wide,
  so one unit is roughly 330px and this is a third of one.
*/
const SETTLE_EPSILON = 0.001

/* Used when no pointer ref is supplied — the lens simply rests at the centre. */
const CENTRED_POINTER = { current: { x: 0, y: 0 } }

/*
  --- The two numbers that decide what this canvas costs -----------------------

  Neither is part of the lens's look. They are the price of drawing it, and both were
  left at drei's defaults, which are tuned for a scene far heavier than this one.
*/

/*
  The size of the offscreen buffer the refraction samples.

  MeshTransmissionMaterial renders the scene into a render target every frame and then
  samples that target through a refraction offset — that second render pass is the whole
  reason the material is expensive. drei allocates the target with `useFBO(resolution)`,
  and useFBO falls back to the FULL CANVAS (`size * dpr`, half-float, two of them) when
  the prop is omitted, which it was. Worse, useFBO re-sizes the targets from a layout
  effect keyed on that measurement, so an omitted resolution also means a GPU
  re-allocation on every frame the canvas changes size — which, during About's
  scroll-zoom, is every frame.

  A literal pins the width and stops the churn on that axis. 512 against the ~648px the
  canvas actually is at rest is a 21% cut in the pass, and it is invisible because the
  buffer is never seen directly: only the ~150px of glass reads it, through a distortion,
  and what comes back out is a refracted smear rather than a legible image.

  (drei forwards this to useFBO's *width* argument only, so the height still tracks the
  canvas. That is drei's API, not an oversight here — there is no prop for the other axis.)
*/
const TRANSMISSION_RESOLUTION = 512

/*
  How many times the refraction is integrated per pixel.

  drei's default is 10, and the shader calls getIBLVolumeRefraction once per sample PER
  COLOUR CHANNEL — thirty dependent texture fetches for every pixel of glass, each one
  behind four integer-hash rand() calls.

  Four is not a quality cut *at this call site*, because roughness is 0 there. With no
  roughness the sampled normal is identical on every iteration, so the loop is not
  averaging a rough surface at all: the only things that vary across it are the chromatic
  aberration ramp and a 1% thickness smear, and both are parameterised by
  `(i + jitter) / samples` — a term that spans the same 0→1 range whatever the count. Four
  samples estimate the same integral over the same range, with the per-pixel jitter drei
  already applies carrying the difference. Raising `roughness` above 0 at a call site is
  what would make this number matter again.
*/
const TRANSMISSION_SAMPLES = 4

/*
  Whether the browser will tell us when the video has a new frame.

  Chrome and Safari implement requestVideoFrameCallback; Firefox does not. It decides the
  canvas's frameloop below, because the on-demand loop is woken by video frames — with no
  callback there would be nothing to wake it and the canvas would render once and freeze.
*/
const HAS_VIDEO_FRAME_CALLBACK =
  typeof HTMLVideoElement !== 'undefined' &&
  'requestVideoFrameCallback' in HTMLVideoElement.prototype

/*
  Whether the canvas is anywhere near the viewport, as a ref rather than state.

  About mounts this section on the home page, so the lens is alive from first paint —
  while the visitor is still on the hero, a screen above it, watching a different 4K
  video. Without this the canvas spent that whole time rendering a scene nobody could see,
  in direct competition with the hero's own decode, the section glass's backdrop-filter
  and the grain layer. That is the moment the site feels heaviest, and it was paying for
  the most expensive thing on the page to draw off screen.

  The video is deliberately NOT paused with it. It stays warm and in sync so that arriving
  at the section shows moving footage rather than a first frame; what stops is the GPU
  work, which is the part that costs anything.

  A ref because nothing renders from this — it only gates the invalidate below, and
  putting it in state would re-render the whole canvas tree twice per pass to change a
  boolean that no output reads.
*/
function useNearViewport() {
  const canvas = useThree((state) => state.gl.domElement)
  const invalidate = useThree((state) => state.invalidate)
  const near = useRef(true)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined

    /*
      A generous margin: the gate is about not rendering a screen away, not about
      trimming the last frame at the edge. Waking early costs one or two frames and
      guarantees the section is already live by the time any of it is on screen.
    */
    const observer = new IntersectionObserver(
      ([entry]) => {
        near.current = entry.isIntersecting

        /*
          Coming back into view has to ask for a frame itself, and this is not belt and
          braces — it is the only thing that can. The story video is paused until the
          hero's own has stopped (see About), so for the whole approach to this section
          there are no video frames arriving to drive the loop, and a settled lens asks
          for nothing. Without this the canvas would still be showing whatever it drew
          before it went off screen.
        */
        if (entry.isIntersecting) invalidate()
      },
      { rootMargin: '50%' },
    )

    observer.observe(canvas)
    return () => observer.disconnect()
  }, [canvas, invalidate])

  return near
}

/*
  Hands the canvas's `invalidate` out to About, which owns the section-wide mousemove
  that drives the lens and therefore has to be able to wake the on-demand loop.

  A component rather than a hook because `invalidate` only exists inside the Canvas, and
  it sits outside the Suspense boundary below so the handle is live from the first
  commit rather than after the model and the video have loaded. It renders nothing.
*/
function InvalidateHandle({ handle }) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!handle) return undefined

    handle.current = invalidate
    return () => {
      handle.current = null
    }
  }, [handle, invalidate])

  return null
}

/*
  The video, in the scene rather than in the document — see the note at the top of
  this file.

  Scaled to cover the frustum rather than fit it, which is the object-fit: cover the
  DOM path gets for free: match whichever axis leaves no gap and let the circle's
  overflow clip the rest. Fitting instead would letterbox a 16:9 video inside a round
  hole and show the section's ground through two corners of it.
*/
function VideoPlane({ src, onVideo }) {
  const invalidate = useThree((state) => state.invalidate)
  const nearViewport = useNearViewport()

  /*
    The heartbeat of the on-demand loop, and the reason `frameloop` can be "demand" at
    all (see the Canvas below).

    One render per DECODED VIDEO FRAME rather than one per display refresh. The footage
    runs well under 60fps, so a second render between two video frames had nothing new to
    show — it re-ran the transmission pass to produce the identical image. Driving the
    loop from the source instead removes that duplicated work outright, and the result is
    pixel-for-pixel what it was.

    It doubles as the loop's safety net: anything that needs a frame and fails to ask for
    one is at most one video frame away from getting one anyway, which is what makes
    demand mode safe here rather than merely cheaper.
  */
  const handleVideoFrame = useCallback(() => {
    if (nearViewport.current) invalidate()
  }, [invalidate, nearViewport])

  const texture = useVideoTexture(src, {
    muted: true,
    loop: true,
    playsInline: true,
    crossOrigin: 'anonymous',
    onVideoFrame: handleVideoFrame,
    /*
      drei plays the element as soon as the texture resolves. It must not: this canvas
      mounts during first paint, a screen above the section it belongs to, while the
      hero's own video is still running — and only one of the two may decode at a time.
      About decides instead, through the element handed up by `onVideo` below.

      Loading is unaffected. The element still fetches and still decodes its first frame
      while paused, so the texture has something in it before anything starts.
    */
    start: false,
  })

  const { viewport } = useThree()

  /*
    Hands the underlying <video> up to the caller.

    useVideoTexture builds and owns the element internally, so this is the only handle
    on it — and About needs one, because the scroll-zoom pauses playback partway through
    the transition. Nothing here mutates the element; the caller only calls play() and
    pause() on it.
  */
  useEffect(() => {
    if (onVideo) onVideo(texture.image ?? null)
  }, [texture, onVideo])

  const scale = useMemo(() => {
    const frameAspect = viewport.width / viewport.height

    /*
      useVideoTexture suspends until `loadedmetadata`, so the intrinsic size is
      normally known by the time this runs. The fallback covers the case where it
      is not: an aspect of 0 would resolve to a zero-height plane rather than
      something merely mis-scaled.
    */
    const video = texture.image
    const videoAspect =
      video?.videoWidth && video?.videoHeight
        ? video.videoWidth / video.videoHeight
        : frameAspect

    return videoAspect > frameAspect
      ? [viewport.height * videoAspect, viewport.height, 1]
      : [viewport.width, viewport.width / videoAspect, 1]
  }, [texture, viewport.width, viewport.height])

  return (
    <mesh scale={scale}>
      <planeGeometry />
      {/*
        Basic, not standard: this plane is the subject, not a lit surface. A
        standard material would have the lights below fall across the footage and
        darken it unevenly. `toneMapped={false}` for the same reason — the video
        should arrive at the colour it was graded at.
      */}
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

/*
  The lens itself.

  `scale` arrives inside the caller's lensProps alongside the material settings, but
  it is a *mesh* transform rather than a material property, so it is split back out
  here — passing it through to MeshTransmissionMaterial would silently do nothing.

  `pointer` is a ref, not two numbers. The lens is driven from a mousemove listener
  covering the whole About section (see About.jsx), which fires far more often than
  this tree should re-render: passing the coordinates as props would re-render the
  Canvas and rebuild MeshTransmissionMaterial's props on every mouse event, for a
  value only ever read inside useFrame. A ref is mutated in place and read once a
  frame, which is where it is actually needed.
*/
function Lens({
  pointer = CENTRED_POINTER,
  opacity,
  scale = 0.25,
  ...materialProps
}) {
  const ref = useRef(null)
  const materialRef = useRef(null)
  const { nodes } = useGLTF(LENS_MODEL)
  const invalidate = useThree((state) => state.invalidate)

  /*
    Guarded rather than assumed: the model is fetched at runtime from /public, so a
    replaced or re-exported lens.glb with a differently named node would otherwise
    throw inside the render rather than simply showing no lens.
  */
  const lensNode = nodes?.Cylinder

  /*
    The lens's own radius in the screen plane, in the model's local units — the amount
    the travel bound below has to be shrunk by so the glass stays wholly inside the
    circle rather than its centre sitting on the rim.

    Measured from the geometry rather than hardcoded, because lens.glb is fetched at
    runtime and a re-export could change its dimensions. Taken from the bounding box's
    largest absolute extent on the two axes that end up in the screen plane: the mesh
    is rotated a quarter turn about X, so local X stays horizontal and local Z becomes
    vertical, while local Y (the cylinder's authored axis, and its thickness) turns
    into depth and cannot widen the silhouette. Absolute values on both ends so a
    geometry that is not centred on its own origin still yields a bound the mesh's
    position cannot escape.
  */
  const lensRadius = useMemo(() => {
    const geometry = lensNode?.geometry
    if (!geometry) return 0

    if (!geometry.boundingBox) geometry.computeBoundingBox()
    const { min, max } = geometry.boundingBox

    return Math.max(
      Math.abs(min.x),
      Math.abs(max.x),
      Math.abs(min.z),
      Math.abs(max.z),
    )
  }, [lensNode])

  useFrame((state, delta) => {
    if (!ref.current) return

    /*
      The frustum measured *at the lens's own depth*, not at the origin.

      `state.viewport` describes the plane at z=0, twenty units from the camera. The
      lens sits at z=15, five units from it, where the frustum is far narrower —
      mapping the pointer against the z=0 width would throw the lens well outside
      the visible cone long before the cursor reached the edge of the circle.
      Measuring at LENS_Z is what makes the glass sit under the cursor.
    */
    const { width, height } = state.viewport.getCurrentViewport(state.camera, [
      0,
      0,
      LENS_Z,
    ])

    /*
      The canvas fills a 1:1 box that CSS clips to a circle, so the visible area is the
      disc inscribed in the frustum — its radius is half the *shorter* side. `min` is
      defensive: the two are equal while .circle keeps `aspect-ratio: 1`, and if that
      ever changes this stays inside the visible area rather than outside it.

      Shrinking that radius by the lens's own is what keeps the glass from escaping the
      frame: the centre can reach the rim less one lens radius, and no further.
    */
    const travel = Math.max(Math.min(width, height) / 2 - lensRadius * scale, 0)

    /*
      The pointer arrives normalised against the circle's radius, so it is already past
      1 whenever the cursor is outside the circle — over the copy column, most of the
      time. Clamping the *vector* rather than each axis maps everything beyond the rim
      onto the bound in the direction it came from, which is what makes a cursor parked
      on the text read as "the lens is leaning that way" instead of pinning to a corner.
    */
    const { x, y } = pointer.current
    const distance = Math.hypot(x, y)
    const bounded = distance > 1 ? travel / distance : travel

    const targetX = x * bounded
    const targetY = y * bounded

    easing.damp3(
      ref.current.position,
      [targetX, targetY, LENS_Z],
      FOLLOW_DAMPING,
      delta,
    )

    /*
      A damped follow has to ask for its own frames once the loop is on demand, and this
      is what keeps the motion at the display's rate instead of the video's. Without it
      the lens would step once per decoded frame and read as ~25fps where it used to be
      60 — the one place where rendering less would actually have been visible.

      Asking only while it is still travelling is the entire saving. A lens sitting under
      a stationary cursor reaches its target, stops requesting, and the canvas drops back
      to the video's own rate with nothing lost: the glass is not moving, so the frames it
      is not drawing would have been identical.
    */
    const settled =
      Math.abs(ref.current.position.x - targetX) < SETTLE_EPSILON &&
      Math.abs(ref.current.position.y - targetY) < SETTLE_EPSILON

    if (!settled) invalidate()

    /*
      The fade-out as About's scroll-zoom begins, read per frame from a MotionValue
      rather than taken as a prop — the same reasoning as `pointer` above. It changes on
      every scroll frame, and threading it through props would re-render the Canvas and
      rebuild this material's props to feed a number only this loop reads.

      About drops the mesh entirely once the fade completes (see `showLens`); this only
      covers the ramp down to that point.
    */
    if (opacity && materialRef.current) {
      const next = opacity.get()
      materialRef.current.opacity = next

      /*
        The fade needs frames of its own for the same reason the follow does — it is read
        from a MotionValue rather than pushed, so nothing else knows it has moved. It runs
        only until About drops the mesh a little past the end of the ramp.
      */
      if (next < 1) invalidate()
    }
  })

  if (!lensNode) return null

  return (
    <mesh
      ref={ref}
      geometry={lensNode.geometry}
      /* The cylinder is authored along Y; this turns its axis to face the camera. */
      rotation-x={Math.PI / 2}
      scale={scale}
      position={[0, 0, LENS_Z]}
    >
      {/*
        `transparent` so the opacity written each frame above actually composites —
        without it the material renders opaque whatever its opacity says. It costs
        nothing while opacity is 1, which is every moment outside the zoom transition.
      */}
      <MeshTransmissionMaterial
        ref={materialRef}
        transparent
        {...materialProps}
        /*
          After the spread, deliberately. These two are not part of how the lens looks —
          they are what it costs to draw — so a call site handing over a bag of material
          settings should not be able to put a full-canvas buffer or a thirty-fetch shader
          back by accident. See the constants at the top of the file for what each buys.
        */
        samples={TRANSMISSION_SAMPLES}
        resolution={TRANSMISSION_RESOLUTION}
      />
    </mesh>
  )
}

/*
  `pointer` is a ref carrying { x, y } normalised against the circle's radius, with
  +y up. Its owner is About.jsx, which listens across the whole section — see the note
  on Lens for why this is a ref and not a pair of props.
*/
function FluidLens({
  videoSrc,
  lensProps,
  pointer,
  onVideo,
  showLens = true,
  lensOpacity,
  invalidateRef,
}) {
  return (
    <Canvas
      className={styles.canvas}
      /*
        alpha, and no clear colour of any kind. The video plane fills the frame in
        practice, but a transparent clear means the circle's antialiased edge
        composites against whatever the CSS puts behind it instead of against an
        opaque rectangle.
      */
      gl={{ alpha: true, antialias: true }}
      /*
        Capped at 1.5, down from 2. Transmission samples the whole scene into an offscreen
        buffer every frame, so cost here goes with pixel count, not area of glass: 1.5
        against 2 is about 44% fewer pixels on a retina screen for a subject that is a
        refracting distortion rather than anything with an edge to hold. There is no text
        and no fine geometry in this canvas for the resolution to serve.
      */
      dpr={[1, 1.5]}
      camera={CAMERA}
      /*
        Rendered when something asks for it, not sixty times a second regardless.

        Three things ask: a decoded video frame (VideoPlane), a lens still travelling
        toward the pointer (Lens), and R3F itself, which invalidates on any store change —
        which covers the canvas resizing under About's zoom, so the transition is driven
        without either of the other two knowing about it. Between them the canvas renders
        at the display's rate exactly while something is moving, and at the video's rate —
        roughly half as often — while it is not. Every frame this drops would have been
        identical to the one before it.

        Firefox has no requestVideoFrameCallback, so there is no signal to drive the loop
        from and it stays on the always-on path rather than freezing. Nothing else about
        the canvas differs between the two.
      */
      frameloop={HAS_VIDEO_FRAME_CALLBACK ? 'demand' : 'always'}
    >
      {/*
        Lights for the glass alone — the video plane is unlit by design. No
        <Environment>, deliberately: drei's presets pull an HDRI from a CDN at
        runtime, and nothing else on this site fetches anything but the font.
      */}
      <InvalidateHandle handle={invalidateRef} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 6]} intensity={1.4} />

      {/*
        Both the model and the video texture suspend. `null` rather than a spinner:
        the circle behind this canvas is painted --color-black, so the section shows
        a dark disc until the footage arrives, which is quieter than anything that
        could be put here.
      */}
      <Suspense fallback={null}>
        <VideoPlane src={videoSrc} onVideo={onVideo} />

        {/*
          The lens mesh goes away entirely once About's zoom has faded it out, leaving
          just the video plane in the scene.

          This is the GPU saving, and it is the mesh rather than the canvas that has to
          go to get it: MeshTransmissionMaterial re-renders the scene to an offscreen
          buffer every frame to sample it, and that cost is the whole reason the lens is
          expensive. A lone textured quad is close to free. Unmounting the Canvas
          instead would also destroy the only decode of story.webm mid-scroll — see the
          note at About's call site.
        */}
        {showLens && (
          <Lens pointer={pointer} opacity={lensOpacity} {...lensProps} />
        )}
      </Suspense>
    </Canvas>
  )
}

export default FluidLens
