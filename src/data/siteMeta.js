/*
  Site-wide constants for meta tags and structured data — the production domain,
  the default fallback OG image, and the strings every page's <Seo> call and the
  root JSON-LD read from. One place, because a domain typed into eight page files
  would drift the moment it needs to change.

  SITE_URL IS CONFIRMED — "https://agb-media.net" is the real, registered,
  live production domain (confirmed 2026-08-05; it had been a placeholder
  guessed from the project's own name until then, since nothing else in the
  codebase — no env file, no existing canonical tag, no deployed reference —
  named it). Every canonical link, og:url/twitter, the sitemap and the JSON-LD
  in index.html read from this one constant, so a future domain change is
  still a one-place fix, but there is no open question left about the value.
*/
export const SITE_URL = 'https://agb-media.net'
export const SITE_NAME = 'AGB Media'

/*
  THE DEFAULT OG IMAGE IS A GENERATED PLACEHOLDER — the AGB logo centred on the
  site's own --color-black, built because no existing wide (1200x630-ready)
  marketing still exists in src/assets for the Home and About routes. It is a
  safe, on-brand fallback, not a substitute for real photography of a shoot, the
  studio, or the team — swap it for one the moment there is a better still.
  Services, Contact, Nael and the Founder page each get their own image cropped
  from an existing photo already in the codebase (see each page's <Seo> call).
*/
export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/og/og-default.jpg`
