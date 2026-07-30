import { useEffect, useState } from 'react'

/**
 * Subscribes to a CSS media query from JS.
 *
 * For the cases a media query in a stylesheet cannot reach: deciding whether to
 * *mount* something at all. About's lens overlay is the reason it exists — hiding
 * a WebGL canvas with `display: none` at a breakpoint would still build the
 * context, load the model and decode a video texture on the phone that was
 * supposed to be spared it.
 *
 * Reads once during the initial state so the first render is already correct and
 * nothing flashes in at the wrong width, then keeps up via `change`. Guarded for
 * the no-`window` case so it stays safe if this is ever prerendered.
 *
 * @param {string} query a media query string, e.g. '(min-width: 48rem)'
 * @returns {boolean} whether the query currently matches
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const list = window.matchMedia(query)

    /*
      Re-read on subscribe as well as on change: the query string can differ
      between renders, and the state above was seeded from whatever it was on
      first mount.
    */
    setMatches(list.matches)

    const onChange = (event) => setMatches(event.matches)
    list.addEventListener('change', onChange)

    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export default useMediaQuery
