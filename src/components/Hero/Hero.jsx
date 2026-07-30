import { useEffect, useRef } from 'react'

import useScrollPosition, {
  isPastFirstViewport,
} from '../../hooks/useScrollPosition'
import heroVideo from '../../assets/videos/hero.webm'
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

function Hero() {
  /*
    Playback gate. The backdrop is `position: fixed`, so it keeps decoding frames
    long after it is invisible — the section below the hero is 100vh and starts
    exactly one viewport down, so `viewportProgress` reaches 1 at the same moment
    that section finishes covering the screen. Past that point there is nothing to
    see, so the video is paused; it resumes as soon as any of the hero is exposed
    again.

    The same threshold reveals the fixed site header (see Header.jsx): one scrolled
    viewport is the end of the hero, so the header arriving and the video pausing
    are the same event.

    Subscribed as a boolean rather than as the raw position, and that is a render
    concern rather than an effect one: the effect below already only fires on the
    two crossings, but a hook returning the scroll offset re-rendered this whole
    section on every frame of every scroll — the 4K <video>, HeroHeader with its
    turbulence filter, FluidBar with its own, and six ticker items — to produce
    identical output. Selecting the boolean lets React bail out of all of it, and
    the section now re-renders twice a pass: once entering, once leaving.

    Note this makes HeroHeader's per-frame re-render (and the note about it in
    CLAUDE.md §4) obsolete. Its module-scoped `entrancePlayed` flag is unaffected
    — it guards against remounts, not against re-renders, which is why it lives at
    module scope in the first place.
  */
  const videoRef = useRef(null)
  const isHeroCovered = useScrollPosition(isPastFirstViewport)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isHeroCovered) {
      video.pause()
      return
    }

    /*
      play() returns a promise that rejects when the browser refuses playback —
      which this video invites, being unmuted (see the backdrop comment below).
      There is nothing to recover from, so the rejection is swallowed rather than
      left to surface as an unhandled promise error.
    */
    video.play()?.catch(() => {})
  }, [isHeroCovered])

  return (
    /*
      `data-offscreen` is the hero telling everything inside it to stop moving.

      Two CSS animations live in here and both ran from first paint until the tab
      closed, on and off screen alike: FluidBar's three drifting layers, and the gold
      light travelling the Contact button's rim. Neither is cheap. The layers drift
      *underneath* an SVG displacement filter, so their transform cannot be composited
      — every frame re-runs feDisplacementMap across the whole ~1500px strip. The rim
      light animates a registered custom property feeding a conic-gradient behind two
      masks, so every frame is a full repaint of the ring.

      At this threshold the hero is a full viewport above the top of the screen, so
      both elements are genuinely gone rather than merely covered — the only part of
      the hero still visible past here is the fixed video backdrop, seen through
      About's glass. Pausing rather than cancelling means each resumes exactly where
      it stopped, so scrolling back up cannot resync them into a visible jump.

      The attribute rather than a class because CSS Modules hashes class names per
      file: FluidBar and Button own their own stylesheets and match this from theirs.
    */
    <section
      className={styles.hero}
      data-offscreen={isHeroCovered ? 'true' : 'false'}
    >
      {/*
        Full-viewport, fixed video backdrop with a light scrim on top — tinted to
        --color-black, not raw black — to keep the foreground text legible.

        Note: browsers block autoplay-with-sound unless the user has already
        interacted with the page (or the site), so on first load most browsers
        will still start this muted regardless of the `muted={false}` below.
        Sound will play once the visitor interacts with the tab/page.
      */}
      <div className={styles.backdrop} aria-hidden="true">
        <video
          ref={videoRef}
          className={styles['backdrop-video']}
          src={heroVideo}
          autoPlay
          loop
          muted={false}
          playsInline
        />
        <div className={styles['backdrop-overlay']} />
      </div>

      {/*
        The page's h1, visually hidden.

        The hero used to carry a visible one: the large logo, with "AGB Media" as
        its alt text. That logo has moved into HeroHeader, where it belongs to a
        navigation row and would be the wrong thing to mark up as the document's
        top-level heading. Nothing else in the hero is heading-shaped now that the
        body is deliberately empty, so the heading stays and only its presentation
        goes — without it the document's first heading would be About's h2.

        `.sr-only` is a global utility in global.css, so its name is not hashed and
        it is absent from the styles object: it has to be a literal string.
      */}
      <h1 className="sr-only">AGB Media — Arts &amp; Media Production</h1>

      <HeroHeader />

      {/*
        Between the header above and the ticker below, the hero is intentionally
        empty — the footage carries the whole middle of the first screen. The
        location label, large logo, tagline and CTA that used to sit here are gone;
        the logo and CTA now live in HeroHeader.

        There is no spacer element for that void: .ticker takes `margin-block-start:
        auto` in the stylesheet, which absorbs all the free space in this column
        flex container and pins the ticker to the bottom.
      */}

      <ul className={styles.ticker}>
        {/*
          The strip's water, sitting behind the metadata at z-index -1. Drifting gradient
          masses under an SVG turbulence displacement — see FluidBar.jsx, and the note
          where the linear-gradient sheen it descends from used to be in Hero.module.css.

          One wart, stated rather than hidden: <ul> is specified to contain only <li> and
          script-supporting elements, so this <div> child is technically invalid markup.
          Every browser renders it, it is absolutely positioned so it is out of the flex
          flow entirely, and it carries aria-hidden so assistive tech never sees it
          between the list items. The clean fix is to wrap the ticker in a positioned
          <div> and make this its sibling instead — deliberately not done here, because it
          would change the strip's box, which is the one thing this section's glass
          depends on staying still.
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
