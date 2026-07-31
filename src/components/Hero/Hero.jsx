import useScrollPosition, {
  isPastFirstViewport,
} from '../../hooks/useScrollPosition'
import FluidBar from '../shared/FluidBar'
import HeroHeader from './HeroHeader'
import styles from './Hero.module.css'

/*
  Metadata rendered as a single line along the bottom of the hero.
  Separators are drawn in CSS (a gold dot before every item but the first), so
  this array stays pure data — add or reorder entries freely.
*/
const tickerItems = [
  { label: 'Company', value: 'AGB Media' },
  { label: 'Founded', value: '2025' },
  { label: 'HQ', value: 'Doha, Qatar' },
  { label: 'Founder', value: 'Abdullah Ghyfan' },
  { label: 'CEO', value: 'Nael Al-Jarabah' },
  { label: 'Scope', value: 'Qatar · Gulf · Arab World' },
]

/**
 * The 100svh landing section — its own header, an sr-only h1, and the metadata ticker
 * pinned to the bottom. The middle is intentionally empty.
 *
 * THE FOOTAGE IS NOT IN HERE. It used to be: a `position: fixed` backdrop rendered as a
 * child of this section, plus a `sampledBelow` prop telling this component whether the
 * Story section below was still showing that footage through its glass, so it knew
 * whether to keep the layer alive. Both are gone. The backdrop is now a `position:
 * sticky` sibling of this section and of About, scoped to the stage that holds the two
 * (HeroBackdrop.jsx, and `.stage` in HomePage.module.css) — it could not live in here
 * even if we wanted it to, because a sticky box is constrained by its containing block
 * and `.hero` carries `overflow: hidden`.
 *
 * This section takes no props at all now, which is the honest shape: it renders the same
 * thing wherever it is mounted, and what is behind it is the stage's business.
 */
function Hero() {
  /*
    Read for one thing only: whether the animations inside this section are still worth
    running. Subscribed as a boolean rather than as the raw position, so this section —
    HeroHeader with its turbulence filter, FluidBar with its own, six ticker items — does
    not re-render on every scroll frame to produce identical output.
  */
  const isHeroCovered = useScrollPosition(isPastFirstViewport)

  return (
    /*
      `data-offscreen` is the hero telling everything inside it to stop moving.

      Two CSS animations live in here and both ran from first paint until the tab closed,
      on and off screen alike: FluidBar's three drifting layers, and the gold light
      travelling the Contact button's rim. Neither is cheap. The layers drift *underneath*
      an SVG displacement filter, so their transform cannot be composited — every frame
      re-runs feDisplacementMap across the whole ~1500px strip. The rim light animates a
      registered custom property feeding a conic-gradient behind two masks, so every frame
      is a full repaint of the ring.

      At this threshold the hero is a full viewport above the top of the screen, so both
      elements are genuinely gone rather than merely covered. Pausing rather than
      cancelling means each resumes exactly where it stopped, so scrolling back up cannot
      resync them into a visible jump.

      The attribute rather than a class because CSS Modules hashes class names per file:
      FluidBar and Button own their own stylesheets and match this from theirs.
    */
    <section
      className={styles.hero}
      data-offscreen={isHeroCovered ? 'true' : 'false'}
    >
      {/*
        The page's h1, visually hidden.

        The hero used to carry a visible one: the large logo, with "AGB Media" as its alt
        text. That logo has moved into HeroHeader, where it belongs to a navigation row
        and would be the wrong thing to mark up as the document's top-level heading.
        Nothing else in the hero is heading-shaped now that the body is deliberately
        empty, so the heading stays and only its presentation goes — without it the
        document's first heading would be About's h2.

        `.sr-only` is a global utility in global.css, so its name is not hashed and it is
        absent from the styles object: it has to be a literal string.
      */}
      <h1 className="sr-only">AGB Media — Arts &amp; Media Production</h1>

      <HeroHeader />

      {/*
        Between the header above and the ticker below, the hero is intentionally empty —
        the footage carries the whole middle of the first screen. The location label,
        large logo, tagline and CTA that used to sit here are gone; the logo and CTA now
        live in HeroHeader.

        There is no spacer element for that void: .ticker takes `margin-block-start: auto`
        in the stylesheet, which absorbs all the free space in this column flex container
        and pins the ticker to the bottom.
      */}

      <ul className={styles.ticker}>
        {/*
          The strip's water, sitting behind the metadata at z-index -1. Drifting gradient
          masses under an SVG turbulence displacement — see FluidBar.jsx.

          One wart, stated rather than hidden: <ul> is specified to contain only <li> and
          script-supporting elements, so this <div> child is technically invalid markup.
          Every browser renders it, it is absolutely positioned so it is out of the flex
          flow entirely, and it carries aria-hidden so assistive tech never sees it between
          the list items. The clean fix is to wrap the ticker in a positioned <div> and
          make this its sibling instead — deliberately not done here, because it would
          change the strip's box, which is the one thing this section's glass depends on
          staying still.
        */}
        <FluidBar />

        {tickerItems.map(({ label, value }) => (
          <li key={label} className={styles['ticker-item']}>
            <span className={styles['ticker-label']}>{label}</span>
            <span className={styles['ticker-dash']}>—</span>
            <span className={styles['ticker-value']}>{value}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Hero
