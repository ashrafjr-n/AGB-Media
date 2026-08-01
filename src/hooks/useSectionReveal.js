import { useCallback, useRef } from 'react'
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

/*
  WHICH SECTIONS HAVE ALREADY PLAYED THEIR LADDER, THIS SESSION.

  `once: true` above stops a reveal replaying while the page stays mounted. It cannot stop
  it replaying across a REMOUNT, and this site remounts constantly: every nav destination
  except `/` is wired ahead of its page, so following one unmounts HomePage entirely and
  coming back builds it again from scratch. Every section then faded in from opacity 0 a
  second, third and fourth time — most obviously on About's "Discover Our Story" button,
  because that is the link people actually click and therefore the element they come back
  to. An entrance that replays every time you return is the thing that makes a reveal feel
  cheap, which is the same argument `once: true` is already making one level down.

  MODULE SCOPE, NOT STATE, and it is the pattern HeroHeader.jsx uses for the hero's own
  one-per-session entrance. State would be destroyed by exactly the remount this exists to
  survive.

  LATCHED ON COMPLETION, NOT ON MOUNT — also from HeroHeader, and also not optional.
  StrictMode deliberately mounts, unmounts and remounts every component in development, so
  a mount-latched flag would be set by that throwaway first mount and would suppress the
  entrance before anyone ever saw it. An animation completing happens long after StrictMode
  is finished.

  A SET KEYED BY SECTION rather than one global boolean, and the distinction is the whole
  design. A single flag would latch the moment ANY section revealed, so a reader who
  followed a link out of the Story section would find the Founder, WhyAgb and Team rendered
  flat on their return — sections they had never actually seen animate. Keyed per section,
  each one keeps its entrance until it has genuinely played, and loses it only after.

  A section opts in by passing a scope. Calling `useSectionReveal()` with no argument keeps
  the old behaviour — reveal on every mount — which is the right default for anything that
  is not a section of this page.
*/
const playedScopes = new Set()

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
 *
 * @param {string} [scope]
 *   An id for the section calling this, and what makes the ladder play ONCE PER SESSION
 *   rather than once per mount. The first time this section's reveal finishes, the scope
 *   is recorded; on any later mount — after routing away and back — every step returns an
 *   empty object and the section renders in its final state with nothing to animate from.
 *   See `playedScopes` above. Omit it and the ladder reveals on every mount, as before.
 */
function useSectionReveal(scope) {
  const shouldReduceMotion = useReducedMotion()

  /*
    Read once per mount and held, so the answer cannot change mid-ladder: the first
    element to finish adds the scope, and without this the steps still animating would
    start returning `{}` on the next render and snap to their end state.
  */
  const alreadyPlayed = useRef(
    scope !== undefined && playedScopes.has(scope),
  ).current

  const markPlayed = useCallback(() => {
    if (scope !== undefined) playedScopes.add(scope)
  }, [scope])

  return useCallback(
    (step = 0) =>
      shouldReduceMotion || alreadyPlayed
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
            /*
              Every rung reports completion and they all write the same key, so the Set
              write is idempotent and the scope is latched by whichever step finishes
              first. That is deliberately not "the last step": a reader who scrolls past
              mid-ladder has still seen the entrance.
            */
            onAnimationComplete: markPlayed,
          },
    [shouldReduceMotion, alreadyPlayed, markPlayed],
  )
}

export default useSectionReveal
