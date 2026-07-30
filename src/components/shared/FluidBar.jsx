import styles from './FluidBar.module.css'

/*
  A strip of dark, slow-moving water behind the hero's metadata ticker.

  Three drifting gradient masses, pushed through an SVG turbulence displacement. No
  canvas, no WebGL, no JS: the component is markup, and every moving part is a CSS
  animation.

  ---

  It was a raw WebGL fragment shader, and what killed that was not the shader.

  The cleanup released its context with WEBGL_lose_context, on the reasoning that
  contexts are a capped resource and routing away should not leak one. But StrictMode
  runs effects, tears them down, and runs them again against the *same* DOM node — so
  the teardown destroyed the context, and the second run's getContext() call handed back
  that same lost context rather than a fresh one. Linking against a lost context fails,
  and every get*InfoLog call on one returns null, which is why the failure reported
  itself as "failed to link null null null" and looked unattributable.

  That was a two-line fix. The reason this is DOM instead is the rest of it: a fragment
  shader is compiled by the user's driver, so portability is never provable from here,
  and debugging it without being able to see the page is guesswork. This renders the same
  way everywhere, and it leaves the browser's WebGL contexts to the Story section's lens,
  which genuinely needs one.
*/

/*
  The turbulence, and the reason this reads as water rather than as three moving blobs.

  NOT SHARED WITH THE OTHER TWO, deliberately. Three of these filters exist — this one,
  #hero-cta-turbulence in HeroHeader.jsx and #site-header-turbulence in Header.jsx — and
  they are structurally near-identical while every number in them differs. That is not
  duplication waiting to be factored out: feTurbulence's baseFrequency is in user-space
  units rather than units of the element, so one field tuned for a given box produces a
  visibly different texture on another. What reads as water across this ~1500px strip is
  sandpaper on a 140px button. numOctaves and the displacement scale follow from the same
  fact — detail finer than a pixel only costs time, and a scale that flows a wide bar
  tears a short one apart.

  Nor would sharing buy anything at render time: a filter is evaluated per element it is
  applied to, so two elements pointing at one id still pay for it twice. Consolidating
  these would mean one definition plus three sets of overrides, which is what the three
  already are. Keep them separate, and keep each one's numbers commented.

  Notable: the seed is static, where the brief animated it from 1 to 100 over 20s. Three
  reasons it is not animated. Implementations truncate the seed to an integer, so an
  animated seed re-randomises the field in discrete steps and pops rather than flows.
  Changing it invalidates the turbulence every frame, and feTurbulence at three octaves
  is by far the most expensive part of this filter — static, it is computed once and
  cached, leaving only the displacement to run. And it would be driven by SMIL, which
  the prefers-reduced-motion block in global.css cannot reach, so the one thing still
  moving under a reduced-motion preference would be the least appropriate one.

  Motion comes from the layers drifting *underneath* a fixed distortion field instead —
  the same thing as watching something move behind rippled glass.

  color-interpolation-filters="sRGB" is not optional. The default is linearRGB, which
  reinterprets the displacement map's channels and both washes out the result and shifts
  where the field pushes.

  The filter region is widened to 140% so the displacement has material to pull from
  near the strip's edges rather than dragging in transparency.
*/
/*
  Kept in step with the `filter: url(...)` on .surface in FluidBar.module.css by hand.

  It cannot be passed through from here: an inline style would be a constant value, which
  CLAUDE.md §4 rules out, and a filter id is a document-wide reference rather than a
  class, so CSS Modules neither hashes it nor knows about it. Two places, one string.
*/
const FILTER_ID = 'fluid-bar-turbulence'

function FluidBar() {
  return (
    /*
      aria-hidden: pure atmosphere, and a non-<li> child of a <ul> — see the note at the
      call site in Hero.jsx. Nothing in here is content.
    */
    <div className={styles.fluid} aria-hidden="true">
      <svg className={styles.defs} focusable="false">
        <filter
          id={FILTER_ID}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.024"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/*
        The filter sits on this wrapper rather than on each layer, so all three are
        displaced by one shared field and stay part of the same body of water. Filtering
        them separately would push each by the same offsets but composite them as three
        independently warped sheets.
      */}
      <div className={styles.surface}>
        <span className={styles['layer-light']} />
        <span className={styles['layer-shade']} />
        <span className={styles['layer-glint']} />
      </div>
    </div>
  )
}

export default FluidBar
