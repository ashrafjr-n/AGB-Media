import { motion, useReducedMotion } from 'framer-motion'

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
      aria-labelledby="founder-name"
      {...reveal}
    >
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
