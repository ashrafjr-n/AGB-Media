import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { HiOutlineUser } from 'react-icons/hi'

import useScrollPosition, {
  isPastFirstViewport,
} from '../../hooks/useScrollPosition'
import useExclusiveVideo, {
  PLAYBACK_PRIORITY,
} from '../../hooks/useExclusiveVideo'
import useSectionReveal from '../../hooks/useSectionReveal'
import nael from '../../assets/nael/nael.webp'
import teamVideo from '../../assets/videos/story.webm'
import styles from './Team.module.css'

/*
  The people section — a title, the CEO, and the four seats beside him — over story.webm
  running full bleed.

  THE VIDEO IS THE SAME FILE THE STORY CIRCLE SHOWS, and that is worth stating because it
  is the reason this section costs almost nothing to add. story.webm is already imported,
  already bundled and already in the browser's cache by the time anyone scrolls this far,
  so the second use adds no bytes at all — only a second decode, which is exactly what
  useExclusiveVideo exists to prevent two of. It also means the two sections are showing
  the same footage at different scales and different treatments, which reads as one film
  the site keeps returning to rather than as two stock clips.

  THE PANE IS THE LIGHTENED *VIDEO* SCRIM. It is `.pane-lighter` from
  shared/SectionGlass.module.css — --section-glass-fill-lighter (0.55) over the same 7px
  blur every section pane uses — and what it is lighter than is About's 0.75, the site's
  treatment for type over moving footage. It is heavier than the Founder's and WhyAgb's
  0.4, which is not an inconsistency: those two sit over near-black photographs, and this
  sits over footage whose lit stretches are two orders of magnitude brighter. 0.55 is the
  lightest fill at which everything in this section clears AA against the worst frames in
  the clip; the measurements are at the token, and the section's labels are opaque rather
  than muted precisely so the fill could come down that far.
*/

/*
  THE FOUR SEATS, and they are placeholders on purpose.

  Copy as data, the same way About, the Founder and WhyAgb hold theirs — but this array has
  a second job those do not: it is the swap-in point. Adding the real people later is
  editing four entries here, not touching a line of markup. An entry is `{ name, title,
  image }`, matching the shape the lead figure below uses, so a placeholder becomes a real
  person by filling in the three fields and adding the import.

  `image: null` is what marks a seat as unfilled, and the render branches on it. THERE IS
  NO PLACEHOLDER IMAGE FILE, deliberately: CLAUDE.md §5 forbids inventing one, and a
  generated avatar would be a fabricated person on a page about real people. What fills an
  empty circle instead is `HiOutlineUser` from react-icons — the Heroicons outline set the
  Header and About already draw from (§5 again: never hand-build an SVG). It reads
  unmistakably as an empty seat rather than as somebody.

  The names say so too. "Team Member" / "Position TBD" is not filler nobody proofread — it
  is the visible statement that these four are not yet announced, which is the honest thing
  for the page to say and impossible to mistake for a real credit.
*/
const seats = [
  { name: 'Team Member', title: 'Position TBD', image: null },
  { name: 'Team Member', title: 'Position TBD', image: null },
  { name: 'Team Member', title: 'Position TBD', image: null },
  { name: 'Team Member', title: 'Position TBD', image: null },
]

/*
  The lead figure, in the same shape as a seat so the two render paths stay one idea. He is
  above the row rather than in it because the hierarchy is real — a larger circle, his own
  reveal rung, and the name treatment the Founder's heading uses.
*/
const lead = {
  name: 'Nael Al-Jarabah',
  title: 'CEO & Managing Director',
  image: nael,
}

/*
  A fifth of the section on screen before the video is allowed to decode — the same
  threshold About uses for the Story circle, so the two claimants ask the same question of
  their own boxes and the registry sees one consistent kind of intent.
*/
const PLAYBACK_AMOUNT = 0.2

function Team() {
  /*
    The shared ladder — see useSectionReveal for the timings and for the reduced-motion
    branch, which is why nothing here checks the preference. Four rungs: the eyebrow, the
    title, the lead, then the row. The four seats arrive together as one rung rather than
    four, because they are one row of equals and staggering them would imply an order the
    placeholders do not have.
  */
  const revealAt = useSectionReveal()

  const sectionRef = useRef(null)

  /* --- Playback ----------------------------------------------------------- */

  /*
    THE SAME TWO GATES About FOLDS TOGETHER, and they are folded here for the same
    reasons rather than copied.

    `heroCovered` is the hero's own threshold, so this section cannot ask for playback
    while hero.webm is still running — that is what keeps the hero exclusive without the
    hero being arbitrated at all (see the note on `wants` in useExclusiveVideo.js). It is
    trivially true this far down the page, and it is folded in anyway: it costs one shared
    boolean, and the alternative is a claimant whose intent is correct only because of
    where it happens to sit in the document.

    `inView` is the second: nothing decodes while the section is off screen. That is the
    whole "plays in view, pauses otherwise" requirement, expressed as intent rather than as
    a pair of play()/pause() calls, which is what lets the registry rather than this
    component decide what actually runs.
  */
  const heroCovered = useScrollPosition(isPastFirstViewport)
  const inView = useInView(sectionRef, { amount: PLAYBACK_AMOUNT })

  const { attachVideo } = useExclusiveVideo({
    priority: PLAYBACK_PRIORITY.team,
    wants: heroCovered && inView,
  })

  return (
    <section
      className={styles.team}
      id="team"
      aria-labelledby="team-title"
      ref={sectionRef}
    >
      {/*
        THE GROUND, and it must stay FIRST — it and the pane below it are both at z-index
        0, so document order is the only thing putting the footage behind the glass.

        No `autoPlay`, and that is the site-wide rule rather than a preference: playback is
        the registry's decision, and an autoplaying element would spend a decode before
        anything had asked it to (CLAUDE.md §7). `muted` is not optional either — an
        unmuted play() without a prior gesture is refused outright — and `playsInline` is
        what stops iOS taking it fullscreen.

        `preload="metadata"` rather than `none`, and it is nearly free here: this is the
        same story.webm the Story circle loaded three sections ago, so by the time anyone
        reaches this one the bytes are cached and the attribute only decides whether a
        first frame is ready. With `none` the section would show flat --color-black from
        the moment it scrolled into view until play() had fetched and decoded a frame.
      */}
      <video
        ref={attachVideo}
        className={styles.backdrop}
        src={teamVideo}
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      />

      {/*
        The pane, and the ONE place on the site that takes the lighter variant. See the
        note at the top of this file, and .glass in the stylesheet.
      */}
      <div className={styles.glass} aria-hidden="true" />

      <div className={styles.inner}>
        {/*
          The site's micro-label, matching About's, the Founder's and WhyAgb's: tiny,
          widely tracked, dimmed, with the gold dot leading rather than trailing because
          the tracking adds a space after the final letter that CSS cannot trim.
        */}
        <motion.p className={styles.eyebrow} {...revealAt(0)}>
          The Team
        </motion.p>

        <motion.h2 className={styles.title} id="team-title" {...revealAt(1)}>
          The People Behind AGB
        </motion.h2>

        {/* --- The lead figure ---------------------------------------------- */}
        <motion.div className={styles.lead} {...revealAt(2)}>
          <div className={`${styles.portrait} ${styles['portrait-lead']}`}>
            {/*
              `alt=""` and the name in real text beside it, rather than the name as alt
              text. The name is already a heading below the circle, so describing the
              photograph with it would have a screen reader read him twice.
            */}
            <img src={lead.image} alt="" loading="lazy" decoding="async" />
          </div>

          <div className={styles.identity}>
            <h3 className={styles.name}>
              Nael <span className={styles['name-accent']}>Al-Jarabah</span>
            </h3>
            <p className={styles.role}>{lead.title}</p>
          </div>
        </motion.div>

        {/* --- The four seats ----------------------------------------------- */}
        {/*
          A list, because four people are a list — and an unordered one, because the row
          carries no ranking. The placeholders are announced rather than hidden: a visitor
          on a screen reader should hear that four seats are unfilled, which is what the
          page is saying visually.
        */}
        <motion.ul className={styles.row} {...revealAt(3)}>
          {seats.map((member, index) => (
            <li className={styles.seat} key={index}>
              <div className={styles.portrait}>
                {member.image ? (
                  <img src={member.image} alt="" loading="lazy" decoding="async" />
                ) : (
                  /*
                    The empty seat. An icon from the installed set rather than a generated
                    avatar or a hand-built SVG — see the note on `seats`.
                  */
                  <HiOutlineUser className={styles['seat-icon']} aria-hidden="true" />
                )}
              </div>

              <p className={styles['seat-name']}>{member.name}</p>
              <p className={styles.role}>{member.title}</p>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

export default Team
