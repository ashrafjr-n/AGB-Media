import { useEffect, useRef } from 'react'

import useScrollPosition from '../../hooks/useScrollPosition'
import heroVideo from '../../assets/videos/hero.mp4'
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
  { label: 'Founder', value: 'Abdullah Ghifan' },
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

    Derived as a boolean rather than acted on directly: viewportProgress changes
    every frame while scrolling, and pause()/play() should only fire on the two
    crossings, not on every read.
  */
  const videoRef = useRef(null)
  const { viewportProgress } = useScrollPosition()
  const isHeroCovered = viewportProgress >= 1

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
    <section className={styles.hero}>
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
