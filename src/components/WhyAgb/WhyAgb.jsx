import { useCallback, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import useSectionReveal from '../../hooks/useSectionReveal'
import styles from './WhyAgb.module.css'

/*
  The case for the company: six reasons in a 2 x 3 grid, over a drifting field of
  outlined wordmarks.

  STILL NOT A GRID OF CARDS, and the distinction is worth keeping straight now that it
  genuinely is a grid. Nothing here is a container: no fill, no radius, no border, no
  shadow. The cells are held together by two things only — a single hairline down the
  middle, and the oversized numeral sitting behind each title. That matters on this site
  because every raised surface elsewhere is glass over footage, and a card on flat black
  would be the one surface the design system has no answer for.
*/

/*
  Copy as data, so it can move to /src/data or a CMS later without touching the layout —
  the same reasoning About.jsx and Founder.jsx use for their own text.

  ONE TITLE PER ENTRY. Each row used to carry a `label` as well, a small tag above the
  heading, and on two of the six the tag and the heading were the same string — so the
  render carried a `label !== title` comparison to suppress the repeat. The tags are gone
  rather than deduplicated: the numeral is the row's mark now, and a micro-label above a
  title that already says the same thing was a second mark for one item.
*/
const reasons = [
  {
    title: 'Creative Leadership',
    description: 'Artistic decisions rest with artists, not management alone.',
  },
  {
    title: 'Industry Network',
    description:
      'Direct access to drama and content makers across Qatar, the Gulf, and the Arab world.',
  },
  {
    title: 'Flexible Production Teams',
    description:
      'We build the team around the project, so you never pay for a fixed structure you do not need.',
  },
  {
    title: 'Integrated Production Management',
    description:
      'From the first line of the script to the final broadcast-ready cut.',
  },
  {
    title: 'Deep Understanding of Gulf Culture',
    description:
      'We know what resonates with audiences here, and what does not.',
  },
  {
    title: 'High Quality Standards',
    description:
      'Written technical and artistic specifications we commit to at every stage.',
  },
]

/*
  THE BACKGROUND FIELD — three rows of the wordmark, drawn as outlines and drifting.

  WHY DOM TEXT WITH `-webkit-text-stroke` RATHER THAN SVG `<text>`, since both were on the
  table. The deciding factor is the seamless loop, not the stroke quality — both render a
  clean 1px outline.

  The loop works by putting two identical copies of the run side by side in a track and
  translating the track by exactly -50%: at that offset the second copy sits precisely
  where the first began, so the wrap is invisible. That is exact only if -50% of the track
  is exactly one copy, which is true for free when the track is a flex box sized by its own
  content — the browser measures the text and the percentage follows. An SVG would need a
  `viewBox` and a `width`, and neither can be written without knowing how wide "AGB MEDIA"
  sets in Clash Display at the current clamp — a number that changes with the font's
  metrics, the viewport, and whether the webfont has loaded yet. Getting it wrong by a few
  pixels is a visible stutter every cycle. DOM text moves that measurement into layout,
  where it cannot drift.

  The trade, stated: `-webkit-text-stroke` is a non-standard property. It is implemented in
  every current engine, and where it is not, the text is `color: transparent` with no
  stroke to replace it — the field simply does not appear, which is the right failure for a
  layer this decorative.

  Each copy is one text node ending in its separator, so the two spans are identical in
  width by construction. Building the run from an array of words with a flex `gap` would
  not be: a gap falls *between* items, so the last word of a copy would have no trailing
  space and -50% would land half a gap out.
*/
/*
  THREE, down from six, and the count is tied to the type size rather than chosen.

  The rule is that one copy must be at least as wide as the widest viewport, or the wrap
  point at -50% would pull a gap onto the screen. At the current clamp the wordmark sets
  around 1,600px on a 1280px window, so three repeats is roughly 4,800px — clear of any
  desktop and of an ultrawide. Six was right when the type was a third of this size; left
  at six now, each row's track would be about 19,000px of layer area for no visible gain.
*/
const WORDMARK_REPEATS = 3
const WORDMARK_RUN = 'AGB MEDIA    '.repeat(WORDMARK_REPEATS)

/*
  Three rows, and the middle one runs the other way. Opposed directions are what make the
  field read as two planes at different depths rather than as one sheet sliding past — the
  same reasoning the Founder's two LogoLoops are deliberately opposed.

  The durations are all different and none is a multiple of another, so the three rows
  never resynchronise into a visible pattern. They are long: at this size the motion should
  be something a reader notices only if they look for it.

  `pointer: true` ON THE MIDDLE ROW ALONE. That row carries a second, JS-driven offset on a
  wrapper *outside* the CSS-animated track, so the two transforms compose rather than
  compete — the autonomous drift is untouched and the pointer slides the whole drifting row
  along under it. The outer two stay pure CSS and know nothing about the cursor.
*/
const WORDMARK_ROWS = [
  { direction: 'reverse', duration: '64s', pointer: false },
  { direction: 'forward', duration: '81s', pointer: true },
  { direction: 'reverse', duration: '73s', pointer: false },
]

/*
  How far the middle row slides between the two edges of the window, in pixels either side
  of centre.

  Deliberately a fixed pixel budget rather than a fraction of the row's width: the row is
  thousands of pixels wide and any percentage of it would be a lurch. 90px is a little over
  half a glyph at this size — enough that crossing the window visibly shifts the row against
  its neighbours, far too little to read as the background chasing the mouse.
*/
const POINTER_TRAVEL = 90

/*
  The follow weight and the settle threshold, both the same idea as CssLens's disc — and
  the exponential in the tick below is there for the same reason: a flat per-frame fraction
  is a different curve on every display, running twice as many steps per second at 120Hz.

  Slower than the lens's 0.12. The lens is a small disc that should feel attached to the
  cursor; this is a wall of type several thousand pixels wide, and at the lens's weight it
  reads as the whole background twitching.
*/
const POINTER_LERP = 0.06
const SETTLE_PX = 0.1

function WhyAgb() {
  /*
    The same ladder the Story section and the Founder reveal on — see useSectionReveal
    for the timings, and for the reduced-motion branch that is why nothing here checks
    the preference.

    The grid restarts the ladder at 0 rather than continuing from the heading's two rungs.
    Eight rungs at 0.09s would put the last cell 0.63s behind its own trigger; six caps
    the tail at 0.45s. The cells reveal in reading order, which across two columns means
    the stagger runs left-to-right then down rather than straight down a single column.
  */
  const revealAt = useSectionReveal()

  /*
    THE MIDDLE ROW'S POINTER OFFSET.

    Reduced motion drops the whole mechanism rather than slowing it: this is pointer-driven
    motion that cannot be expressed as a CSS transition, so there is nothing to shorten.
    The listeners are never attached and the loop never starts, which also means the global
    reduced-motion block in global.css is left to freeze the CSS drift on its own — the two
    layers are frozen by two different mechanisms because they are two different kinds of
    animation, and both have to be covered.
  */
  const shouldReduceMotion = useReducedMotion()

  /* The node the offset is written to — the wrapper outside the CSS-animated track. */
  const shiftRef = useRef(null)

  /* Target and current offset in px. Never in state: this changes faster than we render. */
  const target = useRef(0)
  const offset = useRef(0)

  const frame = useRef(null)
  const lastTime = useRef(0)

  /*
    The window's width, cached.

    The pointer path must not read layout — the same rule About's mousemove follows. A
    mousemove fires well above the display's refresh rate, and `innerWidth` is exactly the
    kind of property access that can force the browser to flush pending layout before it
    can answer. It only changes on resize, so it is read there instead.
  */
  const viewportWidth = useRef(0)

  const tick = useCallback(() => {
    frame.current = null

    const node = shiftRef.current
    if (!node) return

    const now = performance.now()
    /* Clamped so a backgrounded tab does not resume with one enormous step. */
    const delta = Math.min((now - lastTime.current) / 1000, 0.1)
    lastTime.current = now

    /*
      Frame-rate independent exponential smoothing. `delta * 60` is how many 60fps frames
      this one stood in for, and the fraction left uncovered compounds once per frame, so
      raising it to that power is the same curve sampled coarsely.
    */
    const factor = 1 - (1 - POINTER_LERP) ** (delta * 60)
    offset.current += (target.current - offset.current) * factor

    const arrived = Math.abs(target.current - offset.current) < SETTLE_PX
    /* Land exactly on it, so the resting position is the target and not almost it. */
    if (arrived) offset.current = target.current

    node.style.transform = `translate3d(${offset.current}px, 0, 0)`

    /*
      The loop ends when the row arrives. A cursor held still costs nothing at all until
      the next move wakes it — the CSS drift underneath carries on regardless, on the
      compositor, without this loop existing.
    */
    if (!arrived) frame.current = requestAnimationFrame(tick)
  }, [])

  const wake = useCallback(() => {
    if (frame.current !== null) return

    lastTime.current = performance.now()
    frame.current = requestAnimationFrame(tick)
  }, [tick])

  const handlePointerMove = useCallback(
    (event) => {
      const width = viewportWidth.current
      if (!width) return

      /* -1 at the left edge of the window, +1 at the right. */
      const normalised = (event.clientX / width) * 2 - 1
      target.current = normalised * POINTER_TRAVEL

      wake()
    },
    [wake],
  )

  /*
    Back to centre when the cursor leaves the section, rather than holding the last offset.
    Without this the row stays leaning wherever the pointer happened to exit, which reads
    as a stuck animation the next time the section is scrolled to.
  */
  const handlePointerLeave = useCallback(() => {
    target.current = 0
    wake()
  }, [wake])

  useEffect(() => {
    if (shouldReduceMotion) return undefined

    const readWidth = () => {
      viewportWidth.current = window.innerWidth
    }

    readWidth()
    window.addEventListener('resize', readWidth)

    return () => {
      window.removeEventListener('resize', readWidth)

      /* Nothing is left running behind an unmounted section. */
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }, [shouldReduceMotion])

  return (
    <section
      className={styles.why}
      id="why-agb"
      aria-labelledby="why-agb-title"
      /*
        Scoped to this section rather than to the window: the field only exists here, and a
        global listener would be running for every scroll position on the page to feed a
        row at the bottom of it. Not attached at all under reduced motion.
      */
      onMouseMove={shouldReduceMotion ? undefined : handlePointerMove}
      onMouseLeave={shouldReduceMotion ? undefined : handlePointerLeave}
    >
      {/*
        Purely atmospheric, and marked so: aria-hidden because a screen reader reaching
        nine copies of the company name between the heading and the list would be reading
        furniture, and pointer-events: none in the stylesheet because this covers the whole
        section and would otherwise swallow every selection drag over it.
      */}
      <div className={styles.field} aria-hidden="true">
        {WORDMARK_ROWS.map(({ direction, duration, pointer }, row) => (
          <div className={styles['field-row']} key={row}>
            {/*
              TWO NESTED ELEMENTS, AND THE SPLIT IS THE WHOLE TECHNIQUE. The follow loop
              owns this element's `transform` outright — it writes it to the node every
              frame it moves — while the CSS keyframes own the track's. Nested transforms
              compose, so the row drifts on the compositor exactly as it did and the
              pointer offset slides that drifting row along on top. Putting both on one
              element would mean the loop overwriting the animation sixty times a second.

              The wrapper is present on all three rows so the field's markup stays uniform;
              on the outer two nothing ever writes to it and it costs an untransformed div.
            */}
            <div
              className={styles['field-shift']}
              ref={pointer && !shouldReduceMotion ? shiftRef : undefined}
            >
              <div
                className={styles['field-track']}
                data-direction={direction}
                style={{ animationDuration: duration }}
              >
                {/*
                  Two identical copies, and they must stay identical — the loop translates
                  the track by exactly -50%, which is one copy's width only while the two
                  are the same string. See the note on WORDMARK_RUN.

                  An inline style for the duration alone: it is the one value that differs
                  per row, and three near-identical keyframe-bearing classes to carry three
                  numbers would be worse than the exception. The animation itself,
                  including its direction, is entirely in CSS.
                */}
                <span>{WORDMARK_RUN}</span>
                <span>{WORDMARK_RUN}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.inner}>
        <div className={styles.opening}>
          {/*
            The site's micro-label, matching About's and the Founder's: tiny, widely
            tracked, dimmed, with the gold dot leading rather than trailing because the
            tracking adds a space after the final letter that CSS cannot trim.
          */}
          <motion.p className={styles.eyebrow} {...revealAt(0)}>
            Why AGB Media
          </motion.p>

          <motion.h2
            className={styles.title}
            id="why-agb-title"
            {...revealAt(1)}
          >
            We don&rsquo;t measure ourselves by the company&rsquo;s age, but by
            what our team can deliver today.
          </motion.h2>
        </div>

        {/*
          An ordered list, because the numerals are the design: six reasons in a
          deliberate order, and the index is what a reader counts. The numbers are drawn
          rather than left to a list-style marker — a marker cannot be styled to this
          size, colour and position — so each is aria-hidden and the <ol> carries the
          enumeration semantically.

          THE NUMERAL IS NORMAL FLOW NOW: numeral, then title, then description, stacked.
          It used to be absolutely positioned behind the title as decorative depth, at 8%
          of the accent, which needed the cell to be a positioning context and a `.body`
          wrapper to hold the copy in front of it. Both are gone with it — the numeral is
          a label above its title, and a label is just the first line of the cell.
        */}
        <ol className={styles.grid}>
          {reasons.map(({ title, description }, index) => (
            <motion.li className={styles.item} key={title} {...revealAt(index)}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <h3 className={styles.name}>{title}</h3>
              <p className={styles.description}>{description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default WhyAgb
