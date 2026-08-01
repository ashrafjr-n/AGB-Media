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

/*
  WHICH REVEALS HAVE ALREADY PLAYED, THIS SESSION — and why returning `{}` afterwards is
  the fix rather than a tidy-up.

  `once: true` in REVEAL_VIEWPORT is not the problem and never was: it works. What broke is
  subtler and was found by measuring rather than by reading. These props attach an
  `initial` — opacity 0, 12px down — for the element's whole life, and an element with
  `whileInView` and no `animate` resolves to that `initial` whenever the viewport state is
  re-evaluated while it is off screen. A component that never re-renders therefore keeps its
  finished state forever, and one that re-renders on scroll silently snaps back to opacity 0
  the moment it leaves the screen, then reveals again on the way back.

  That is exactly the split the page had. WhyAgb re-renders never, and its title stayed at
  opacity 1 when scrolled away. About re-renders constantly — two `useInView` observers and
  a `useScrollPosition` selector — and its "Discover Our Story" button was measured at
  `opacity: 0; transform: translateY(12px)` while off screen, on the same DOM node, and
  animated again on every return. Same hook, same props, opposite behaviour, decided by
  something as incidental as whether the section happens to watch its own scroll position.

  So the guard has to REPLACE the props, not merely stop them from re-triggering. Once a
  reveal is played its step returns SETTLED — `initial: false` with a static `animate` at
  the end state. There is no `whileInView` and no `viewport`, so no observer is attached to
  the element at all, and no `initial` for a re-render to fall back to.

  IT IS NOT `{}`, AND THAT WAS MEASURED THE HARD WAY. Returning an empty object is the
  obvious move and it is wrong for an element that has already rendered once with these
  props: Framer leaves the inline `opacity: 0` that `initial` wrote, and dropping every
  animation prop leaves nothing to clear it — the element played its reveal and then
  vanished. `initial: false` says "you are already at the target", which both pins the
  element for the rest of this mount and renders it correctly on a later one.

  MODULE SCOPE, NOT STATE, so it survives the remount that routing away and back causes —
  every nav destination except `/` is wired ahead of its page. That is HeroHeader.jsx's
  `entrancePlayed` pattern.

  LATCHED ON COMPLETION, NOT ON MOUNT, also from HeroHeader, and load-bearing twice over.
  StrictMode deliberately mounts, unmounts and remounts every component in development, so a
  mount-latched flag would be set by that throwaway first mount and suppress the entrance
  before anyone saw it. It is also what makes the swap invisible: an element only stops
  carrying animation props after its own animation has finished, so there is never a
  half-faded element snapped to its end state.

  KEYED PER ELEMENT (`scope:step`), NOT PER SECTION AND NOT GLOBALLY. A single flag would
  latch the moment any reveal completed, so a reader who scrolled quickly would find whole
  sections rendered flat that they had never seen animate. Per section is not fine-grained
  enough either, for the same reason one rung down: a tall section's first rung can complete
  long before its last has entered the viewport.

  RECORDING IS PASSIVE — a latch does NOT force a re-render, and that is a correction of
  something tried and measured. Notifying every consumer on each latch made the swap take
  effect the instant a key was recorded, which sounds better and is not: the rungs of a
  ladder complete one after another, so the first rung's latch re-rendered the section while
  the last rung was still animating, and the elements mid-flight reset to `initial` and
  flashed to nothing. Measured at the CTA: it rose to 0.9 opacity, dropped to 0 for around
  240ms, then reappeared.

  So the key is simply written, and every consumer picks it up on its NEXT render, whenever
  that naturally happens. This is not a compromise, because of what the two cases actually
  need. A section that re-renders — About, which watches its own scroll position — swaps to
  SETTLED on the first re-render after the animation finished, which is exactly the moment
  the replay would otherwise have been armed. A section that never re-renders keeps its
  original props for the life of the mount, and cannot replay either: with nothing
  re-resolving the viewport state there is nothing to fall back to `initial` from. WhyAgb was
  measured holding opacity 1 while off screen for precisely that reason. Either way the
  element animates once, and a later mount reads `played` on its first render.
*/
/*
  What a reveal that has already played renders as, and what reduced motion renders as: the
  end of the ladder, held. `initial: false` is the load-bearing half — it tells Framer the
  element is already at the target, so nothing writes an `opacity: 0` that would then need
  clearing, on this mount or any later one.

  Frozen so the identity is stable across every render and every consumer; a fresh object
  here would be a new prop value on every render for no reason.
*/
const SETTLED = Object.freeze({
  initial: false,
  animate: Object.freeze({ opacity: 1, y: 0 }),
  transition: Object.freeze({ duration: 0 }),
})

const played = new Set()

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
 *   An id for the ladder calling this. Combined with the step it forms the key a reveal is
 *   remembered by, which is what makes each element animate EXACTLY ONCE per session —
 *   the first time it ever enters the viewport, and never again, whether the second chance
 *   comes from scrolling back, a re-render while off screen, or a route remount. After
 *   that its step returns an empty object and the element carries no animation props and no
 *   observer at all. See the note above `played`.
 *
 *   One scope per ladder, NOT per component: a component running two independent ladders
 *   (WhyAgb's opening and its grid, which restarts the stagger at 0) needs two, or their
 *   steps collide and one ladder latches the other's elements before they have played.
 *
 *   Omit it and the reveal runs on every mount and every re-intersection, as it did before.
 */
function useSectionReveal(scope) {
  const shouldReduceMotion = useReducedMotion()

  return useCallback(
    (step = 0) => {
      const key = scope === undefined ? null : `${scope}:${step}`

      /*
        THE EARLY RETURN IS THE WHOLE FIX. `played` is read here, during render, on every
        render — so the moment this element's own animation has completed it stops being
        handed a `whileInView` and a `viewport`, and Framer has nothing left to re-observe
        or re-resolve. Checking the flag while still returning the props would not have
        worked: the replay came from the props existing, not from the observer being asked
        twice.

        Reduced motion takes the same branch, which is a small simplification on what this
        used to do: SETTLED renders the element in its final state with nothing to animate
        from, which is exactly what the empty object was achieving there.
      */
      if (shouldReduceMotion || (key !== null && played.has(key))) return SETTLED

      return {
        initial: { opacity: 0, y: REVEAL_DISTANCE },
        whileInView: { opacity: 1, y: 0 },
        viewport: REVEAL_VIEWPORT,
        transition: {
          duration: REVEAL_DURATION,
          delay: step * REVEAL_STAGGER,
          ease: REVEAL_EASE,
        },
        /*
          Latches this element alone, on its own completion. Omitted entirely when the
          caller passed no scope, so an unscoped ladder keeps the old behaviour rather
          than latching under a key it never supplied.
        */
        ...(key === null
          ? {}
          : {
              onAnimationComplete: () => {
                played.add(key)
              },
            }),
      }
    },
    [shouldReduceMotion, scope],
  )
}

export default useSectionReveal
