import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { HiOutlineMail } from 'react-icons/hi'

import useScrollPosition from '../../hooks/useScrollPosition'
import heroVideo from '../../assets/videos/hero.mp4'
import buttonStyles from '../shared/Button.module.css'
import styles from './Hero.module.css'

/* Lets the CTA animate without wrapping the Link in an extra layout box. */
const MotionLink = motion.create(Link)

/*
  Entrance choreography. The reveal order is not DOM order — the logo leads, then
  the tagline in the opposite column, then the location label, then the CTA — so
  each element carries an explicit delay instead of a parent `staggerChildren`,
  which would follow the markup. Delays are spaced ~120ms apart: close enough to
  read as one gesture, far enough apart that nothing lands simultaneously.
*/
const ENTRANCE_DELAY = {
  logo: 0.1,
  tagline: 0.24,
  location: 0.38,
  cta: 0.5,
}

/*
  Has the entrance already run in this session?

  Module scope rather than component state, and that is the whole point: it has to
  outlive the component. The animation is mount-triggered (`initial`/`animate`, never
  `whileInView`), so scrolling past the hero and back cannot retrigger it on its own —
  but *anything* that unmounts and remounts Hero would replay it from the top, and a
  flag inside the component would be reset by exactly that. Routing away to /contact
  and back is the obvious case. This survives all of it and resets only on a genuine
  page load, which is precisely "plays once, on first load".

  Latched on animation *completion*, not on mount, because StrictMode deliberately
  mounts, unmounts and remounts every component in development. A mount-latched flag
  would be set by that throwaway first mount and would suppress the animation before
  anyone ever saw it. Completion happens long after StrictMode is done.
*/
let entrancePlayed = false

const markEntrancePlayed = () => {
  entrancePlayed = true
}

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
  { label: 'CEO', value: 'Nael Al-Jarabaa' },
  { label: 'Scope', value: 'Qatar · Gulf · Arab World' },
]

function Hero() {
  /*
    The prefers-reduced-motion block in global.css only governs CSS transitions;
    these animations are driven inline by Framer Motion, so the preference has to
    be honoured here. When reduced, every element renders in its final state.
  */
  const shouldReduceMotion = useReducedMotion()

  /*
    Playback gate. The backdrop is `position: fixed`, so it keeps decoding frames
    long after it is invisible — the section below the hero is 100vh and starts
    exactly one viewport down, so `viewportProgress` reaches 1 at the same moment
    that section finishes covering the screen. Past that point there is nothing to
    see, so the video is paused; it resumes as soon as any of the hero is exposed
    again.

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

  /*
    Read once per mount and held in a ref, so the scroll hook above — which
    re-renders this component on every frame of a scroll — cannot flip it while the
    entrance is still in flight.
  */
  const playEntrance = useRef(!entrancePlayed).current

  /*
    Returns no animation props at all when the entrance is not to play, which leaves
    each element rendering in its natural resting state: no `initial`, so nothing
    starts at opacity 0 and nothing has to animate back.
  */
  const rise = (delay) =>
    shouldReduceMotion || !playEntrance
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] },
        }

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

      <div className={styles.content}>
        {/* Left column — location label above the logo. */}
        <div className={styles.identity}>
          <motion.p {...rise(ENTRANCE_DELAY.location)} className={styles.location}>
            Doha · Qatar
          </motion.p>

          {/*
            The logo stands in for the removed "AGB Media" wordmark, so it takes
            over as the page's h1 — its alt text is the heading's text.
          */}
          <h1 className={styles['logo-heading']}>
            <motion.img
              {...rise(ENTRANCE_DELAY.logo)}
              src="/assets/images/agb-logo.png"
              alt="AGB Media"
              className={styles.logo}
            />
          </h1>
        </div>

        {/* Right column — tagline above the call to action. */}
        <div className={styles.pitch}>
          <motion.p {...rise(ENTRANCE_DELAY.tagline)} className={styles.tagline}>
            Arts &amp; Media Production
          </motion.p>

          {/*
            The quiet button variant, not the reveal one: this sits over moving
            footage and should stay understated. Local class carries spacing only.
          */}
          <MotionLink
            {...rise(ENTRANCE_DELAY.cta)}
            onAnimationComplete={markEntrancePlayed}
            to="/contact"
            className={`${buttonStyles.button} ${buttonStyles['button-quiet']} ${styles['contact-button']}`}
          >
            <HiOutlineMail size={20} aria-hidden="true" />
            <span>Contact Us</span>
          </MotionLink>
        </div>
      </div>

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