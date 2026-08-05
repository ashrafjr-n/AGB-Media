import { Helmet } from 'react-helmet-async'

import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../../data/siteMeta'

/*
  THE SITE'S ONLY HEAD-MANAGEMENT CALL SITE. Every route renders exactly one of
  these, near the top of its JSX, with its own title/description/image — react-
  helmet-async merges each route's tags into the one <head> and cleans up the
  previous route's on navigation, which a hand-written useEffect touching
  document.title would not do consistently across all eight routes.

  `path` is the route's own clean path ("/", "/about", …) — not the full URL —
  because SITE_URL is the one thing that might still need editing (see
  data/siteMeta.js) and every call site should stay a one-line diff away from a
  domain change rather than hand-building its own absolute URL.

  `image` defaults to the site-wide placeholder; call sites with a real photo
  pass their own (see each page for which).

  `type` is "website" for every route except the two person profiles
  (NaelPage, AbdullahPage), which pass "profile" — the two og:type values the
  brief asks for and the only two anything on this site needs.

  `noindex` is false everywhere except NotFoundPage, which is the one page the
  site does not want a crawler to index — and which also skips the canonical
  link entirely (see `canonical` below): a catch-all route matches every
  mistyped URL, and none of them has one clean address to claim as canonical
  over the others.

  `canonical` defaults to true and NotFoundPage is the one call site that
  passes false.
*/
function Seo({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  canonical = true,
}) {
  const url = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={noindex ? 'noindex, follow' : 'index, follow'}
      />
      {canonical && <link rel="canonical" href={url} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {canonical && <meta property="og:url" content={url} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}

export default Seo
