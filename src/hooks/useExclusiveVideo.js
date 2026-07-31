import { useCallback, useEffect, useRef } from 'react'

/**
 * ONE VIDEO DECODES AT A TIME, ACROSS THE WHOLE PAGE.
 *
 * THERE IS ONE CLAIMANT TODAY — the Story circle — and this file is kept anyway.
 * That is a decision rather than an oversight, so here is the reasoning.
 *
 * It was built to arbitrate two: the Story circle and the Founder's background,
 * adjacent sections each at least 100vh, so at the boundary a fifth of both was
 * on screen and both wanted the same file playing. A per-section effect cannot
 * resolve that — neither knows about the other, and the last one to run its
 * effect wins, which is a different answer depending on render order. The
 * Founder's ground became a still image, so its claim went with the video.
 *
 * What is left still earns its place. With one claimant this is a declarative
 * play/pause — "this section would like its video running" instead of an effect
 * calling play() and pause() by hand — and it keeps the DEV assertion that the
 * page's invariant actually holds. More to the point, a second video ground is
 * expected (the strong section-glass tokens exist for exactly that), and the
 * arbitration is the part that would have to be rebuilt from scratch rather than
 * re-derived. Deleting it would be throwing away the answer to a question the
 * page is going to ask again.
 *
 * The hero is deliberately NOT a claimant — its exclusivity is structural rather
 * than arbitrated, and the note on `wants` below says why.
 *
 * Module scope, like useScrollPosition's listener: the registry has to outlive
 * any single component and be shared by all of them.
 */
const claims = new Set()

/**
 * Lower wins, in document order. One entry today.
 *
 * The Founder held `founder: 1` until its ground became a still image. The rule
 * that ordered the two is worth keeping written down, because it is the rule a
 * second entry should be argued against rather than simply appended to: the
 * section whose footage is on screen SHARP outranks one showing it under a blur
 * and a scrim, because a frozen frame is obvious in the first and very hard to
 * spot in the second. Freeze the one nobody can see freezing.
 */
export const PLAYBACK_PRIORITY = {
  story: 0,
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
 *   The one current caller folds `isPastFirstViewport` into this, which is what
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
