import { motion, useMotionValue, useTransform } from 'framer-motion'

import LogoLoop from '../shared/LogoLoop'
import styles from './Founder.module.css'

import portrait from '../../assets/abdullah/abdullah.jpg'
import work002 from '../../assets/abdullah/002.jpg'
import work003 from '../../assets/abdullah/003.jpg'
import work004 from '../../assets/abdullah/004.jpg'
import work005 from '../../assets/abdullah/005.jpg'
import work006 from '../../assets/abdullah/006.jpg'
import work007 from '../../assets/abdullah/007.jpg'

/*
  The founder's page-within-a-section, and the tenant of About's .hold — the slot the
  Story section's zoom transition spends its whole runway building a blurred, frozen
  backdrop for. That backdrop *is* this section's background, which is why nothing here
  paints a ground of its own.

  It does not scroll into view. On the motion path it is pinned to the viewport and
  appears purely by fading up from nothing as the zoom finishes — see the note on
  FADE_START and the .founder[data-pinned] rule in the stylesheet.
*/

/*
  Where the fade starts, as a fraction of About's eased zoom progress — the same clock
  every other part of the transition reads, so this arrives against a scrim that is
  already ~88% up and a blur that is fully in. Nothing here overlaps the zoom itself; the
  frame has finished becoming a frame before the founder begins to exist.

  Worth knowing before retuning: progress is squared, so 0.85 → 1.0 is only the last ~8%
  of the runway's *scroll*. That is a fast fade by design — raise this number and it gets
  faster still, lower it and the founder starts appearing while the frame is still moving.
*/
const FADE_START = 0.85

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
  `progress` is About's eased zoom progress as a MotionValue, and `pinned` says whether
  the zoom is running at all. Both are absent under prefers-reduced-motion, where the
  section is simply rendered in place.
*/
function Founder({ progress, pinned = false }) {
  /*
    A constant 1 when there is no zoom to follow, so the transforms below can be declared
    unconditionally and the reduced-motion path lands on "fully visible" rather than on a
    special case. Hooks cannot be skipped, and a MotionValue is the cheapest stand-in.
  */
  const settled = useMotionValue(1)
  const source = progress ?? settled

  const opacity = useTransform(source, [FADE_START, 1], [0, 1])

  /*
    Not decoration. While pinned this element covers the entire viewport from the moment
    the page loads, invisible at opacity 0 — and an invisible full-screen box still eats
    every pointer event underneath it. Without this the Story section's lens would never
    see a mousemove, because the founder would be swallowing them the whole way down.
  */
  const pointerEvents = useTransform(source, (value) =>
    value >= 1 ? 'auto' : 'none',
  )

  return (
    <motion.section
      className={styles.founder}
      id="founder"
      aria-labelledby="founder-name"
      data-pinned={pinned ? 'true' : 'false'}
      style={{ opacity, pointerEvents }}
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

          <img
            className={styles.portrait}
            src={portrait}
            alt="Abdullah Ghayfan"
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
            The token rather than a literal #010101. It is passed straight into a custom
            property, so `var()` resolves at use time and the fade stays tied to the one
            ground colour instead of becoming an eighth hand-copy of it (CLAUDE.md §2).
          */
          fadeOut={true}
          fadeOutColor="var(--color-black)"
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
