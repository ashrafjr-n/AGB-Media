import { useCallback, useEffect, useRef } from 'react'

/**
 * ONE VIDEO DECODES AT A TIME, ACROSS THE WHOLE PAGE.
 *
 * THERE ARE TWO CLAIMANTS — the Story circle and the Team section's ground.
 *
 * It was built to arbitrate two of them: the Story circle and the Founder's
 * background, adjacent sections each at least 100vh, so at the boundary a fifth
 * of both was on screen and both wanted the same file playing. A per-section
 * effect cannot resolve that — neither knows about the other, and the last one
 * to run its effect wins, which is a different answer depending on render order.
 * The Founder's ground became a still image and it dropped to one claimant; this
 * file was kept anyway, on the argument that a second video ground was expected
 * and the arbitration is the part that would have to be rebuilt rather than
 * re-derived. The Team section is that second ground, and it arrived pointing at
 * the same story.webm the circle already shows.
 *
 * The two are NOT adjacent — Founder and WhyAgb sit between them, so roughly two
 * viewports separate the last frame either would want. In practice one hands over
 * to the other with a long gap in the middle where neither is claiming. That is a
 * fact about today's page order rather than a guarantee: insert or remove a
 * section and the gap changes, which is exactly the sort of thing this registry
 * exists to stop anyone having to think about.
 *
 * The hero is deliberately NOT a claimant — its exclusivity is structural rather
 * than arbitrated, and the note on `wants` below says why.
 *
 * Module scope, like useScrollPosition's listener: the registry has to outlive
 * any single component and be shared by all of them.
 */
const claims = new Set()

/**
 * Lower wins, in document order.
 *
 * THE RULE, which the Founder's old `founder: 1` established and the Team's entry
 * is argued from rather than merely appended to: the section whose footage is on
 * screen SHARP outranks one showing it under a blur and a scrim, because a frozen
 * frame is obvious in the first and very hard to spot in the second. Freeze the
 * one nobody can see freezing.
 *
 * That puts the Story circle first. It shows story.webm unblurred inside a ~300px
 * window, where a stall is plainly a stall; the Team section shows the same file
 * full-bleed under a 7px blur and a 0.3 scrim, where a held frame reads as a still
 * background. Note the ordering is the same one the Founder had for the same
 * reason even though the Team's pane is the LIGHTER of the two treatments — a
 * lighter scrim over a blurred full-screen ground is still far more forgiving of a
 * freeze than a sharp circle is.
 */
export const PLAYBACK_PRIORITY = {
  story: 0,
  team: 1,
}

/**
 * The whole arbitration: at most one claimant plays, everyone else is paused.
 *
 * Called on every change from every claimant rather than diffed, because it is
 * cheap (two entries, a `paused` read each) and because recomputing the entire
 * state from the current claims is what makes it impossible for two videos to
 * both believe they won.
 *
 * play() returns a promise that rejects if the element is torn down or the play
 * is interrupted by a pause mid-call — which is exactly what happens when the
 * winner changes twice in quick succession. It is caught and dropped: the next
 * resolve() is the authority on what should be running, not this call.
 */
function resolve() {
  let winner = null

  for (const claim of claims) {
    if (!claim.wants || !claim.active) continue
    if (!winner || claim.priority < winner.priority) winner = claim
  }

  /*
    LOSERS FIRST, in a pass of their own, so a handover never issues a play()
    while another element is still running. `pause()` takes effect synchronously
    — the spec sets the paused flag before returning — so by the time the second
    pass runs, the outgoing decode has already been told to stop.
  */
  for (const claim of claims) {
    if (claim === winner) continue

    const video = claim.videoRef.current
    if (video && !video.paused) video.pause()
  }

  const video = winner?.videoRef.current
  if (video && video.paused) {
    const played = video.play()
    if (played) played.catch(() => {})
  }

  if (import.meta.env.DEV) assertSinglePlayback()
}

/**
 * The invariant, checked rather than assumed — and the reason there are no
 * temporary console.logs anywhere in the two call sites.
 *
 * `paused` is the element's own view of whether it is running, so this reads the
 * actual DOM state after the writes above rather than the registry's intent. It
 * is stripped from production builds: Vite replaces `import.meta.env.DEV` with
 * `false` and the minifier drops the branch and this function with it.
 */
function assertSinglePlayback() {
  const playing = []
  for (const claim of claims) {
    if (claim.videoRef.current && !claim.videoRef.current.paused) {
      playing.push(claim.priority)
    }
  }

  if (playing.length > 1) {
    console.error(
      `useExclusiveVideo: ${playing.length} videos decoding at once (priorities ${playing.join(', ')}). Exactly one may run.`,
    )
  }
}

/**
 * Registers one `<video>` with the page-wide exclusivity above.
 *
 * @param {object} options
 * @param {number} options.priority From PLAYBACK_PRIORITY. Lower wins a tie.
 * @param {boolean} options.wants
 *   Whether this section would like its video running — its own visibility test,
 *   with no knowledge of the other sections. Nothing here overrides it upward:
 *   a claimant that does not want to play never plays, whatever the others do.
 *
 *   Both current callers fold `isPastFirstViewport` into this, which is what
 *   keeps the HERO exclusive without it being a claimant at all: the hero's
 *   `<video>` runs only while that threshold is false (Hero.jsx pauses on it),
 *   and neither claimant will ask for playback until it is true. The two states
 *   cannot overlap, so there is nothing to arbitrate. Hero.jsx is untouched by
 *   this file and should stay that way — nothing may pause or delay the hero.
 * @returns {{ attachVideo: (element: HTMLVideoElement | null) => void, videoRef: React.RefObject<HTMLVideoElement | null> }}
 *   `attachVideo` goes on the element's `ref`. It is a stable identity, so React
 *   never detaches and reattaches it. `videoRef` is the same element for callers
 *   that need it for something else.
 */
function useExclusiveVideo({ priority, wants }) {
  const videoRef = useRef(null)

  /*
    One claim object for the component's whole life, mutated in place. The
    registry holds it by identity, so replacing it would orphan the entry — and
    the values are read inside resolve(), never rendered from.
  */
  const claimRef = useRef(null)
  if (claimRef.current === null) {
    claimRef.current = { videoRef, priority, wants, active: false }
  }
  claimRef.current.priority = priority
  claimRef.current.wants = wants

  useEffect(() => {
    const claim = claimRef.current
    claim.active = true
    claims.add(claim)
    resolve()

    return () => {
      /*
        Go inactive and re-resolve BEFORE leaving the registry, rather than
        deleting and then cleaning up. One pass does both jobs: an inactive
        claim is treated as a loser and paused like any other, and the slot goes
        to whoever was waiting behind it. An unmounting section must not leave an
        element decoding.

        `active` is a separate flag rather than clobbering `wants`, and that is
        not tidiness. `wants` is written during render; StrictMode's
        mount → unmount → remount (and every Fast Refresh) re-runs this effect
        WITHOUT re-rendering, so a cleanup that wrote `wants = false` would leave
        the remounted claim stuck at false until the next unrelated render.
      */
      claim.active = false
      resolve()
      claims.delete(claim)
    }
  }, [])

  /* Every change of intent goes through the same single decision. */
  useEffect(() => {
    resolve()
  }, [wants, priority])

  /*
    A callback ref rather than handing `videoRef` out directly: the element
    arriving is itself a change worth resolving on, and it can arrive already
    past the point where this section wanted to be playing.
  */
  const attachVideo = useCallback((element) => {
    videoRef.current = element
    resolve()
  }, [])

  return { attachVideo }
}

export default useExclusiveVideo
