import { useEffect, useRef } from 'react'

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
/*
  A literal path into public/, not a Vite import, and it is deliberately the only asset
  on the site treated this way.

  index.html carries `<link rel="preload" as="video" fetchpriority="high">` for exactly
  this URL, which is what starts the fetch during HTML parse instead of after the JS
  bundle has downloaded, parsed and mounted React. That preload cannot name a bundled
  asset, because a bundled asset's URL is a content hash that does not exist until the
  build has run — so the file has to be served from a stable path for the hint to be
  writable at all. Keep the two in step by hand; there is no import to fail loudly if
  they drift.

  story.webm stays a Vite import. It is not on the first screen, it must not compete for
  the first screen's bandwidth, and it therefore wants the opposite treatment (see the
  preload note in CssLens.jsx).
*/
const HERO_VIDEO = '/assets/videos/hero.webm'

const tickerItems = [
  { label: 'Company', value: 'AGB Media' },
  { label: 'Founded', value: '2025' },
  { label: 'HQ', value: 'Doha, Qatar' },
  { label: 'Founder', value: 'Abdullah Ghyfan' },
  { label: 'CEO', value: 'Nael Al-Jarabah' },
  { label: 'Scope', value: 'Qatar · Gulf · Arab World' },
]

/**
 * @param {object} props
 * @param {boolean} [props.sampledBelow]
 *   Whether a section further down the page is still showing this hero's fixed
 *   footage through its own glass — today that is About and nothing else, and
 *   HomePage.jsx is what wires the two together.
 *
 *   It defaults to `false`, which is the honest default for a hero rendered on its
 *   own: nothing below it samples anything. It can only ever *extend* the backdrop's
 *   life, never cut it short — while any of the hero is on screen the backdrop is
 *   rendered whatever this says, so a page that forgets to pass it still gets a
 *   correct hero.
 */
function Hero({ sampledBelow = false }) {
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

  /*
    WHETHER THE BACKDROP IS RENDERED AT ALL — a second, later gate than the pause
    above, and the two answer different questions.

    Pausing stops the *decode*. It does not stop the element existing: a fixed,
    full-viewport <video> stays a composited layer with a 4K texture behind it for
    the entire scroll length of the page, long after the last thing that could see
    it has gone. Founder and the placeholder are both opaque and both paint over it,
    so from the founder down it was a full-screen layer kept alive to be invisible.

    It cannot simply be scoped to the hero's own box instead. About's ground is
    frosted glass over this footage (see About.module.css), and `backdrop-filter`
    can only sample what is actually painted beneath it — an absolutely positioned
    backdrop would be a viewport above the screen by the time About arrives, and the
    Story section would flatten to a plain dark panel. Fixed is load-bearing for as
    long as About is on screen, and irrelevant after that.

    So: rendered while the hero is on screen, or while something below is still
    sampling it. Past both, `display: none` takes the layer, the texture and the
    scrim out of the compositor entirely, and gives them back the moment either is
    true again.
  */
  const isBackdropVisible = !isHeroCovered || sampledBelow

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isHeroCovered) {
      video.pause()
      return
    }

    /*
      play() returns a promise that rejects if the element is torn down or the call
      is interrupted. It no longer rejects for the reason it used to — this video
      starts muted now, so the browser permits it (see the backdrop note below) —
      but the catch stays, because an unhandled rejection here would be noise.
    */
    video.play()?.catch(() => {})
  }, [isHeroCovered])

  /*
    Sound, on the first real interaction — which is what makes starting muted a
    delay rather than a loss.

    Autoplay policies gate *unmuted* playback on user activation, not playback
    itself, so the fix for the frozen first frame is to start muted and unmute once
    the visitor has given the page a gesture. Nothing needs restarting: changing
    `muted` on an element that is already playing simply turns the audio on.

    `once` on each listener, plus an explicit removal in the cleanup, because only
    one of the three will fire and the other two have to come off with it. Scroll is
    deliberately not among them — a wheel or trackpad scroll is not user activation
    in Chrome, so unmuting on it would be refused and would burn the one shot.
  */
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'touchstart']

    const unmute = () => {
      const video = videoRef.current
      if (video) video.muted = false

      events.forEach((event) => window.removeEventListener(event, unmute))
    }

    events.forEach((event) =>
      window.addEventListener(event, unmute, { passive: true, once: true }),
    )

    return () => {
      events.forEach((event) => window.removeEventListener(event, unmute))
    }
  }, [])

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

        IT STARTS MUTED, AND THAT IS NOT OPTIONAL. This element carried
        `muted={false}`, under a comment claiming browsers "will still start this
        muted regardless". They do not: an unmuted autoplay without prior user
        activation is REFUSED outright — the play() promise rejects and the video
        sits on its first frame. The rejection was being caught and dropped a few
        lines up, so it failed silently, and the long load time hid it: a video that
        had not arrived yet and a video frozen on frame one look identical.

        Sound is restored on the first real interaction instead — see the effect
        above, which is what the old comment described but nothing implemented.
      */}
      <div
        className={styles.backdrop}
        data-hidden={isBackdropVisible ? 'false' : 'true'}
        aria-hidden="true"
      >
        {/*
          `preload="auto"` states outright what the browser is otherwise left to guess.
          It is the default for a <video> with a src on desktop, but not on every mobile
          engine, and it is the one hint that says "fetch the whole thing" rather than
          "fetch enough to know what it is" — which for the section that IS the first
          screen is what we mean. It pairs with the preload link in index.html: the link
          starts the request early, this keeps it going.

          NO `autoPlay`, and its absence is deliberate. The effect above is what starts
          this video, on mount and on every crossing after it, so the attribute was
          duplicating the one case they agree on — and disagreeing on the one they do not.
          On a reload part-way down the page `isHeroCovered` is already true at first
          render (useScrollPosition reads the real offset in its lazy initialiser), so the
          effect's first act is to pause; `autoPlay` beat it to the element and spent a
          decode on a 4K frame behind an opaque section before anything could stop it.
          Starting playback from one place means the hero plays exactly when the hero is
          on screen, from any entry point.
        */}
        <video
          ref={videoRef}
          className={styles['backdrop-video']}
          src={HERO_VIDEO}
          loop
          muted
          playsInline
          preload="auto"
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
