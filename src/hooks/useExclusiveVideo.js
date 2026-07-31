import { useCallback, useEffect, useRef } from 'react'

/**
 * ONE VIDEO DECODES AT A TIME, ACROSS THE WHOLE PAGE.
 *
 * Two sections carry footage — the Story circle and the Founder's background —
 * and both want to run while they are on screen. Their "on screen" windows
 * genuinely overlap: the sections are adjacent and each is at least 100vh, so at
 * the boundary a fifth of both is visible at once. A per-section effect cannot
 * resolve that, because neither knows about the other; the last one to run its
 * effect would win, which is a different answer depending on render order.
 *
 * So the decision is made here, in one place, from all the claims at once. The
 * hero is deliberately NOT a claimant — its exclusivity is structural rather
 * than arbitrated, and the note on `wants` below says why.
 *
 * Module scope, like useScrollPosition's listener: the registry has to outlive
 * any single component and be shared by all of them.
 */
const claims = new Set()

/**
 * Lower wins. Document order, and the tie-break is argued rather than incidental.
 *
 * When the Story section and the Founder overlap, the Story keeps the video. Its
 * footage is on screen SHARP — a circular window with only a 140px lens disc
 * over part of it — so a frozen frame there is immediately visible. The
 * Founder's copy of the same footage sits under a 20px blur and a 0.75 scrim,
 * where a still frame and a moving one are very hard to tell apart. Freeze the
 * one nobody can see freezing.
 *
 * The consequence, stated so it is not re-derived as a bug: scrolling down, the
 * Founder's background is still until the Story section has mostly left. That is
 * the same trade the hero → Story handover already makes, for the same reason.
 */
export const PLAYBACK_PRIORITY = {
  story: 0,
  founder: 1,
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
 *   that need it for something else — the Founder's preload warm-up does.
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

  return { attachVideo, videoRef }
}

export default useExclusiveVideo
