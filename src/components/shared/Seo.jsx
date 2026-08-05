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

  `structuredData` IS PAGE-SPECIFIC JSON-LD, ADDITIONAL TO THE SITE-WIDE GRAPH.
  The Organization + LocalBusiness @graph lives once in index.html because it
  describes the one company on every route; this prop is for the schema that
  is true of THIS page alone — a Person on the two profile pages, the Service
  catalogue on /services, a BreadcrumbList on everything but Home — so it takes
  an array of already-complete schema objects (each carrying its own
  "@context") rather than one shape this component would have to know about.
  Defaults to an empty array, so a route that adds none renders none.

  EACH ENTRY BECOMES ITS OWN <script> TAG, not one shared one: multiple
  unrelated root-level types (a Person and a BreadcrumbList, say) read as
  separate documents to a parser, which is what the JSON-LD spec expects when
  the types are not woven into one @graph. Where a page's own schema IS a
  family of the same type — /services' eleven Service entries — the call site
  combines them into one @graph itself before this ever sees them, so this
  component still renders exactly one script per array entry.
*/
function Seo({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  canonical = true,
  structuredData = [],
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

      {structuredData.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}

export default Seo
