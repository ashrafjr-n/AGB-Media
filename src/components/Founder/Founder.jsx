import { useEffect, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

import useExclusiveVideo, {
  PLAYBACK_PRIORITY,
} from '../../hooks/useExclusiveVideo'
import useScrollPosition, {
  isPastFirstViewport,
} from '../../hooks/useScrollPosition'
import storyVideo from '../../assets/videos/story.webm'
import LogoLoop from '../shared/LogoLoop'
import styles from './Founder.module.css'

/*
  The portrait comes from the full-size originals; the strip does not.

  .portrait is drawn at roughly 440x350 CSS px, so its 1280x720 source is about right
  for a 2x screen. The strip is a different case entirely: LogoLoop sizes each still by
  height alone, at most clamp(5rem, 15vh, 9.5rem) — 152px, so around 270px wide — and
  the track holds two or three copies of the set. Feeding it the 1280x720 originals meant
  1.8MB of JPEG over the wire and, worse, a dozen images decoded to full size and held in
  a permanently composited layer: about 44MB of pixels to draw a strip 152px tall.

  src/assets/abdullah/strip/ holds 640x360 copies — 2x the largest size they are ever
  drawn at, so nothing is visibly softer — for 368KB and around 11MB decoded. The
  originals are kept where they are; nothing imports them, so Vite does not bundle them,
  and they are there to re-cut from if the strip ever grows.
*/
import portrait from '../../assets/abdullah/abdullah.jpg'
import work002 from '../../assets/abdullah/strip/002.jpg'
import work003 from '../../assets/abdullah/strip/003.jpg'
import work004 from '../../assets/abdullah/strip/004.jpg'
import work005 from '../../assets/abdullah/strip/005.jpg'
import work006 from '../../assets/abdullah/strip/006.jpg'
import work007 from '../../assets/abdullah/strip/007.jpg'

/*
  The founder's page-within-a-section, and an ordinary section of the home page: it sits
  after the Story section in HomePage.jsx and scrolls up past the viewport like anything
  else.

  It used to be a tenant of About's scroll-zoom stage — pinned across the Story section's
  runway and faded up over the finished zoom, painting no ground of its own because the
  blurred frozen frame behind it *was* its background. That whole transition is gone, so
  this now owns its own ground and arrives with a plain whileInView reveal.

  The ground is that same footage again, built rather than inherited: a <video> filling
  the section under a frosted pane of --section-glass-fill and --section-glass-blur, which
  is the identical treatment About gives the hero's backdrop. It is a second <video>
  element pointing at the same file, and it is arbitrated so that it and the Story
  circle's copy are never decoding at the same moment — see useExclusiveVideo.js.
*/

const bio =
  'A veteran Qatari artist whose presence across theatre, television drama, and radio spans decades, and a recognized name among audiences in Qatar and the Gulf. His experience extends well beyond acting — he is a leading voice in developing the local theatre movement and in preparing young talent for careers in performance, directing, and production.'

/*
  Copy as data rather than markup, so it can move to /src/data or a CMS later without
  touching the layout — the same reasoning About.jsx uses for its story paragraph.
*/
const facts = [
  { label: 'Nationality', value: 'Qatari' },
  { label: 'Standing', value: 'Pioneer of Qatari theatre and drama' },
  { label: 'Role', value: 'Founder, AGB Media' },
  { label: 'Theatre', value: 'General Director, Al Watan Theatre Company' },
]

/*
  Condensed from the five full sentences these started as. They are set as one flowing
  line rather than five cards now, and a card's worth of clause reads as a run-on the
  moment the cards are gone.
*/
const milestones = [
  'Stage and screen actor since the golden age of local theatre',
  'General Director of Al Watan Theatre Company',
  "Narrator at Qatar's 2019 World Beach Games",
  'Transitioned from acting to production',
  'Today leads AGB Media as founder and creative visionary',
]

/* Two notes on one line, in the same register as the career strip above them. */
const notes = [
  {
    label: 'Awards & Honours',
    value: 'listed with years and granting bodies',
  },
  {
    label: 'Contribution',
    value:
      'supporting artists, creating opportunities, developing Qatari theatre',
  },
]

/*
  Alt text is deliberately generic: these are production stills whose subjects are not
  documented here, and a specific claim about each would be a guess. The strip announces
  itself once through LogoLoop's own label.
*/
const workImages = [work002, work003, work004, work005, work006, work007].map(
  (src, index) => ({ src, alt: `AGB Media production still ${index + 1}` }),
)

/*
  How much of the section has to be on screen before its background video is allowed to
  run. The same fifth About uses, so the two sections ask the same question of themselves
  and the arbitration in useExclusiveVideo.js is comparing like with like.
*/
const PLAYBACK_AMOUNT = 0.2

/*
  How early the file starts downloading, as an IntersectionObserver root margin.

  400px rather than the section's own edge, so the fetch and the first decode happen while
  the founder is still below the fold and the video has something to show the moment it
  arrives. In practice this is almost always instant anyway: it is the *same file* the
  Story circle has been streaming, so it comes out of the HTTP cache — the margin is
  insurance for the visitor who jumps straight down the page.

  Roughly half a laptop viewport of lead, where the 200px this started at was closer to a
  quarter of a second of scrolling and often landed after the section did.
*/
const PRELOAD_MARGIN = '400px 0px'

function Founder() {
  /*
    The global prefers-reduced-motion rule in global.css governs CSS animations only;
    Framer drives this inline, so the preference has to be honoured in JS. When reduced,
    the section renders in place with no transform to animate back from.

    The section reveals as one block rather than in a stagger like About's — it is a
    dense screen of small type, and four ladders arriving in sequence would read as the
    page assembling itself rather than as content appearing.
  */
  const shouldReduceMotion = useReducedMotion()

  /* --- The background video ---------------------------------------------- */

  const sectionRef = useRef(null)

  /*
    Two observations of the same box, because they answer two different questions at two
    different distances: `nearView` is "start fetching", 400px out; `inView` is "start
    playing", once a fifth of the section is genuinely on screen.
  */
  const nearView = useInView(sectionRef, { margin: PRELOAD_MARGIN })
  const inView = useInView(sectionRef, { amount: PLAYBACK_AMOUNT })

  /*
    Belt and braces on the page-wide rule, and cheap: useScrollPosition shares one
    listener and one scroll read across every consumer, and the selector keeps this to two
    renders per pass rather than one per frame.

    The founder cannot be a fifth on screen while the hero is still playing — it is two
    viewports further down — so this is never the gate that decides anything. It is here
    so that "the hero and this can never both be decoding" is provable from this file
    rather than inferred from the page's height.
  */
  const heroCovered = useScrollPosition(isPastFirstViewport)

  /*
    Intent, not a decision. The Story section asks for the same file over an overlapping
    range — at the boundary a fifth of both sections is on screen — and useExclusiveVideo
    resolves that to exactly one decoding element. This section holds the LOWER priority:
    its footage is under a 20px blur and a 0.75 scrim, where a frozen frame is very hard
    to tell from a moving one, and the Story circle's is not. The argument is at
    PLAYBACK_PRIORITY.
  */
  const { attachVideo, videoRef } = useExclusiveVideo({
    priority: PLAYBACK_PRIORITY.founder,
    wants: heroCovered && inView,
  })

  /*
    Promoting the element from `preload="none"` to a real fetch, once — and the reason the
    attribute starts at "none" at all.

    Left at the default, this <video> would begin buffering the moment it mounts, which is
    during first paint, competing with the hero's 3.7MB for the first screen's bandwidth
    while sitting four viewports below the fold. `none` means the browser touches the
    network only when told to.

    `load()` rather than setting `.preload` alone: raising the attribute is a hint that
    browsers are free to ignore, while load() restarts the resource selection algorithm
    and reliably begins fetching. It is safe here precisely because it *resets* the
    element — nothing has played yet, so there is no playhead to lose. The `preload`
    guard is what keeps it to once; without it a section scrolled past twice would reset
    a video that by then has a playhead worth keeping.
  */
  useEffect(() => {
    const video = videoRef.current
    if (!nearView || !video || video.preload === 'auto') return

    video.preload = 'auto'
    video.load()
  }, [nearView, videoRef])

  const reveal = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <motion.section
      className={styles.founder}
      id="founder"
      ref={sectionRef}
      aria-labelledby="founder-name"
      {...reveal}
    >
      {/*
        The ground: the same footage the Story circle shows, filling the section behind
        everything else.

        No `autoPlay` and `preload="none"`, both deliberate and both explained above — the
        element is inert until useExclusiveVideo hands it the page's one playback slot.
        `muted` is not a preference: an unmuted play() without a user gesture is refused
        outright, and this one is never started by a gesture.

        aria-hidden because it is decoration with no information in it, and the section is
        already labelled by the founder's name.
      */}
      <video
        ref={attachVideo}
        className={styles.backdrop}
        src={storyVideo}
        loop
        muted
        playsInline
        preload="none"
        aria-hidden="true"
      />

      {/*
        The frosted pane between the footage and the copy — the same two tokens About
        uses on its own ground, so the two sections read as one material rather than as
        two treatments that happen to be dark.
      */}
      <div className={styles.glass} aria-hidden="true" />

      {/* --- Hero block: the name and portrait against the profile ------------ */}
      <div className={styles.intro}>
        <div className={styles.identity}>
          {/*
            An h2, matching About's — both are top-level sections under the hero's
            sr-only h1, and neither is subordinate to the other.

            Two spans rather than a <br>: the break is typographic rather than a break in
            the sentence, and the second line carries the accent colour, so each line
            needs something to hang a rule on.
          */}
          <h2 className={styles.name} id="founder-name">
            <span className={styles['name-line']}>Abdullah</span>
            <span className={`${styles['name-line']} ${styles['name-accent']}`}>
              Ghayfan
            </span>
          </h2>

          {/*
            Lazy and async-decoded. The section is in normal flow well below the fold on
            every path now, so `loading="lazy"` genuinely defers the fetch until it is
            near the viewport; `decoding="async"` keeps the 205KB decode off the frame it
            lands on.
          */}
          <img
            className={styles.portrait}
            src={portrait}
            alt="Abdullah Ghayfan"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className={styles.profile}>
          <p className={styles.eyebrow}>The Founder</p>

          {/*
            A wrapper around the paragraph rather than a styled paragraph, so the gold
            hairline can span the block's full height as a pseudo-element — the same
            construction as About's .body, and for the same reason: a border cannot fade.
          */}
          <div className={styles.bio}>
            <p>{bio}</p>
          </div>

          {/*
            A description list, because these are label/value pairs and nothing else. The
            div wrappers are the standard HTML5 grouping and are what the grid lays out —
            dt and dd cannot be grid items in a pair on their own.
          */}
          <dl className={styles.facts}>
            {facts.map((fact) => (
              <div className={styles.fact} key={fact.label}>
                <dt className={styles['fact-label']}>{fact.label}</dt>
                <dd className={styles['fact-value']}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* --- Career: one flowing line ---------------------------------------- */}
      <div className={styles.career}>
        <p className={`${styles.eyebrow} ${styles['career-label']}`}>Career</p>

        {/*
          Still an ordered list, because these are still five sequential milestones —
          only their presentation collapsed to a single wrapping line. The separating
          dots are pseudo-elements rather than characters in the copy, so a screen reader
          hears five list items instead of one sentence full of punctuation.
        */}
        <ol className={styles['career-list']}>
          {milestones.map((milestone) => (
            <li className={styles['career-item']} key={milestone}>
              {milestone}
            </li>
          ))}
        </ol>
      </div>

      {/* --- The work: full bleed, continuously scrolling --------------------- */}
      <div className={styles.strip}>
        <LogoLoop
          logos={workImages}
          speed={60}
          direction="left"
          /*
            A CSS length rather than a number, which LogoLoop accepts so that a strip
            inside a fixed-height section can scale with the viewport instead of pinning
            itself to one figure. Tops out at 152px, inside the 140–160 asked for.
          */
          logoHeight="clamp(5rem, 15vh, 9.5rem)"
          gap={16}
          pauseOnHover={true}
          /*
            fadeOut is deliberately left off. .strip masks its own edges instead, which
            removes the pixels rather than painting a gradient over them — so the images
            dissolve into whatever is behind them without the fade having to know the
            ground colour. See the note there.
          */
          ariaLabel="AGB Media productions"
        />
      </div>

      {/* --- Closing: both notes on one line ---------------------------------- */}
      <dl className={styles.closing}>
        {notes.map((note) => (
          <div className={styles.note} key={note.label}>
            <dt className={styles['note-label']}>{note.label}</dt>
            <dd className={styles['note-value']}>{note.value}</dd>
          </div>
        ))}
      </dl>
    </motion.section>
  )
}

export default Founder
