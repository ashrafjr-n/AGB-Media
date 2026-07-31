import { useCallback } from 'react'
import { useReducedMotion } from 'framer-motion'

/*
  THE SITE'S ONE ENTRANCE, as a ladder of steps.

  Three sections reveal on scroll — the Story section, the Founder and WhyAgb — and they
  are meant to feel like the same gesture happening three times, not three animations that
  happen to use Framer. A shared step function is what guarantees that: retuning the feel
  is one edit here rather than three edits that drift, and a fourth section gets the
  established motion for free.

  It deliberately does NOT cover the hero, which is mount-triggered, plays once per
  session and is argued in HeroHeader.jsx. This is scroll-triggered only.
*/

/*
  The travel, and it is smaller than it looks like it should be — 12px, where the
  sections started at 24.

  A reveal reads as "arriving" from a distance the eye can follow without tracking it,
  and past roughly 16px the element stops appearing and starts sliding: the movement
  becomes the subject instead of the content. 12px against a 0.58s duration is slow
  enough to register and short enough that nothing has to travel to get there.

  Only opacity and transform, both of which the compositor handles on its own — nothing
  in this ladder can force a layout, which is what keeps it light on a page already
  carrying two viewport-wide backdrop-filters.
*/
const REVEAL_DISTANCE = 12

/*
  0.58s per element. Under about half a second an entrance reads as a flicker rather
  than as motion; past about 0.8s the reader is waiting on the page. The value sits just
  above the middle of that window because the easing below spends most of its time
  decelerating — the element is visually settled well before the transition formally
  ends, so a duration that sounds long feels immediate.
*/
const REVEAL_DURATION = 0.58

/*
  The gap between one step and the next. Enough to read as a sequence — the eye follows
  the ladder down the column instead of seeing a block appear — and short enough that
  the last step of a five-rung ladder starts 0.36s in, while the first is still moving.
  They overlap, which is what makes it one gesture rather than five.
*/
const REVEAL_STAGGER = 0.09

/*
  A long, flat-tailed decelerating curve — near-exponential ease-out.

  The generic eases are wrong here for one reason each: `easeOut` keeps too much speed
  into its final third, so an element visibly stops; anything with overshoot puts a
  bounce on a section of a production company's site. This one does almost all of its
  travel in the first third and then coasts, which is the shape that reads as expensive:
  the content is legible and effectively in place long before it settles.
*/
const REVEAL_EASE = [0.16, 1, 0.3, 1]

/*
  `once: true` is not a preference — it is what stops the ladder replaying every time
  the reader scrolls back up, which is the single thing that makes a reveal feel cheap.
  Each element keeps its own trigger, so a block low in a tall section animates when it
  genuinely arrives rather than on the section's own threshold.

  A quarter of the element, which suits both ends of what this ladder is applied to: a
  one-line eyebrow is essentially "as soon as it appears", and a tall block like the
  Founder's intro fires while it is genuinely arriving rather than after it has landed.
*/
const REVEAL_VIEWPORT = { once: true, amount: 0.25 }

/**
 * The scroll-in entrance every section shares.
 *
 * @returns {(step?: number) => object} A function taking the element's rung on the
 *   ladder — 0 first, then 1, 2, 3 — and returning the Framer Motion props to spread
 *   onto it. Steps are indices, not seconds: the delay is derived, so re-ordering a
 *   ladder is renumbering it rather than recomputing a set of timings.
 *
 *   Under `prefers-reduced-motion` every step returns an empty object, so the element
 *   renders in its final state with no `initial` to animate back from. That branch has
 *   to live in JS: the media query in global.css governs CSS animations only and cannot
 *   reach anything Framer drives inline (CLAUDE.md §4).
 */
function useSectionReveal() {
  const shouldReduceMotion = useReducedMotion()

  return useCallback(
    (step = 0) =>
      shouldReduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: REVEAL_DISTANCE },
            whileInView: { opacity: 1, y: 0 },
            viewport: REVEAL_VIEWPORT,
            transition: {
              duration: REVEAL_DURATION,
              delay: step * REVEAL_STAGGER,
              ease: REVEAL_EASE,
            },
          },
    [shouldReduceMotion],
  )
}

export default useSectionReveal
