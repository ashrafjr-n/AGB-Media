import styles from './GlassRippleFilter.module.css'

/*
  THE GLASS RIPPLE FILTER — an SVG feTurbulence + feDisplacementMap pair that gives a
  static glass pane a slow, barely-perceptible shimmer, as if the glass itself were
  very faintly alive rather than the photograph underneath it. Pure SVG filter markup,
  no canvas, no WebGL — the same idiom the site's three other turbulence filters use
  (FluidBar, HeroHeader's Contact button, the site header pill), and it renders the same
  way CssLens's disc does: a DOM/SVG effect, not a 3D one.

  MOUNTED ONCE PER PAGE, referenced by up to two panes. Unlike the three filters above —
  each structurally near-identical but numerically tuned to one specific box, because
  baseFrequency is in user-space units and a field tuned for one size looks wrong on
  another (see FluidBar.jsx) — this one is genuinely shared. Every call site is the same
  order of magnitude: a near-full-viewport pane (Founder's and WhyAgb's are each one
  screen tall pinned to a section edge; Services' and Contact's are `position: fixed`
  covering the viewport outright). One field reads the same across all four, so one
  definition serves them rather than four tuned copies.

  Consuming panes reference it by composing `.ripple` from
  shared/SectionGlass.module.css, which is where the CSS that turns this on or off
  lives. This component only ever renders the filter's <defs> — it draws nothing itself,
  which is why it is safe to mount ahead of, after, or interleaved with the elements
  that use it; an SVG filter is a document-wide reference, not a DOM-tree one.

  THE ID IS HARD-CODED IN TWO PLACES — here and in SectionGlass.module.css's `.ripple`
  rule — kept in step by hand, the same trade FluidBar's own FILTER_ID comment explains:
  a filter id is a document-wide reference rather than a class, so CSS Modules neither
  hashes it nor knows about it, and there is no way to pass a JS constant into a CSS
  `url()`.

  BASEFREQUENCY ANIMATES, NOT SEED — the opposite choice from FluidBar, and for the
  reason FluidBar's own comment gives for making that choice the other way: an animated
  seed is truncated to an integer by every implementation, so it re-randomises the field
  in discrete steps and pops rather than flows. baseFrequency has no such floor — moving
  it a few thousandths continuously reads as the field itself slowly breathing, which is
  the "glass feels alive, not glass is doing something" brief this exists to satisfy.
  numOctaves stays at 1: a second octave adds fine detail no one is meant to consciously
  see, at a real per-frame cost, and at this scale (a viewport, not a 140px button) that
  cost is the one to protect first.

  THE CYCLE IS SLOW ON PURPOSE — 58s tip to tip to tip, eased with a spline rather than
  linear so the turn at each end does not read as a beat. "Very slowly" in the brief
  means the field should be hard to catch moving at all on a single glance; a viewer who
  stops and stares for several seconds is the only one meant to notice it.

  DISPLACEMENT SCALE IS 5 — a handful of pixels at most, well under anything that would
  visibly bend a straight edge inside the pane (there are none — this pane has no
  content of its own, only the glass fill and whatever bleeds through the backdrop
  blur). This is the dial to lower first if the effect ever reads as more than a shimmer.

  WHY THIS COSTS SOMETHING AND WHY THAT COST IS BOUNDED. A filter with an animating
  input cannot be cached across frames — the browser recomputes the noise field and
  re-runs the displacement every frame the animation is live, which is exactly the cost
  FluidBar's own comment warns is "by far the most expensive part" of a turbulence
  filter. That comment is about a ~1500x100px strip; this filter runs over up to a full
  viewport, which is why every other dial here (one octave, a slow cycle, a small
  displacement scale) is chosen to keep the per-frame recompute cheap rather than to
  make the ripple more visible. `.ripple` in SectionGlass.module.css is also the only
  place this filter is ever referenced from CSS — see that file for the
  prefers-reduced-motion and narrow-viewport gates that keep it from running at all
  where it is least likely to be affordable or wanted.
*/
const FILTER_ID = 'glass-ripple-distortion'

function GlassRippleFilter() {
  return (
    <svg className={styles.defs} aria-hidden="true" focusable="false">
      <filter
        id={FILTER_ID}
        x="-8%"
        y="-8%"
        width="116%"
        height="116%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.0035 0.006"
          numOctaves="1"
          seed="11"
          result="glass-noise"
        >
          <animate
            attributeName="baseFrequency"
            dur="58s"
            calcMode="spline"
            keyTimes="0; 0.5; 1"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            values="0.0035 0.006; 0.0052 0.0044; 0.0035 0.006"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="glass-noise"
          scale="5"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  )
}

export default GlassRippleFilter
