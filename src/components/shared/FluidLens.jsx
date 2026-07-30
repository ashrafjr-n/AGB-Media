import { Suspense, useMemo, useRef } from 'react'
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
  The video, in the scene rather than in the document — see the note at the top of
  this file.

  Scaled to cover the frustum rather than fit it, which is the object-fit: cover the
  DOM path gets for free: match whichever axis leaves no gap and let the circle's
  overflow clip the rest. Fitting instead would letterbox a 16:9 video inside a round
  hole and show the section's ground through two corners of it.
*/
function VideoPlane({ src }) {
  const texture = useVideoTexture(src, {
    muted: true,
    loop: true,
    playsInline: true,
    crossOrigin: 'anonymous',
  })

  const { viewport } = useThree()

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
*/
function Lens({ scale = 0.25, ...materialProps }) {
  const ref = useRef(null)
  const { nodes } = useGLTF(LENS_MODEL)

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

    easing.damp3(
      ref.current.position,
      [(state.pointer.x * width) / 2, (state.pointer.y * height) / 2, LENS_Z],
      FOLLOW_DAMPING,
      delta,
    )
  })

  /*
    Guarded rather than assumed: the model is fetched at runtime from /public, so a
    replaced or re-exported lens.glb with a differently named node would otherwise
    throw inside the render rather than simply showing no lens.
  */
  const lensNode = nodes?.Cylinder
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
      <MeshTransmissionMaterial {...materialProps} />
    </mesh>
  )
}

function FluidLens({ videoSrc, lensProps }) {
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
      /* Capped at 2: past that this is a lot of transmission sampling per frame. */
      dpr={[1, 2]}
      camera={CAMERA}
    >
      {/*
        Lights for the glass alone — the video plane is unlit by design. No
        <Environment>, deliberately: drei's presets pull an HDRI from a CDN at
        runtime, and nothing else on this site fetches anything but the font.
      */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 6]} intensity={1.4} />

      {/*
        Both the model and the video texture suspend. `null` rather than a spinner:
        the circle behind this canvas is painted --color-black, so the section shows
        a dark disc until the footage arrives, which is quieter than anything that
        could be put here.
      */}
      <Suspense fallback={null}>
        <VideoPlane src={videoSrc} />
        <Lens {...lensProps} />
      </Suspense>
    </Canvas>
  )
}

export default FluidLens
