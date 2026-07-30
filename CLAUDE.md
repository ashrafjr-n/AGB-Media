# CLAUDE.md — AGB Media

Single source of truth for every task in this repository. Read this before writing any code.

---

## 1. Project Overview

- **Project:** AGB Media — portfolio website for a TV & artistic production company based in **Doha, Qatar** (agb-media.net).
- **Shape:** **frontend-only.** No API, no server, no data fetching, no auth, no env vars. All copy is hardcoded in the components or in `src/data/`.
- **Stack:** React 19 + Vite 8, React Router 7, Framer Motion, react-icons.
- **Language:** **English throughout, LTR.** All user-facing copy, code, comments, and identifiers are English. There is **no Arabic anywhere in this project** — do not add Arabic copy, Arabic fonts, or RTL handling.
- **Document direction:** `<html lang="en" dir="ltr">` is set in `index.html`.
- **CSS direction:** keep writing **logical properties** (`inset-inline`, `margin-inline`, `padding-inline-start`, `border-inline-end`). Under LTR they resolve to left/right at no cost, and they keep the layout direction-agnostic. `left`/`right` are acceptable where a value is genuinely visual, but prefer the logical form for consistency with existing code.

### Tech stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | React 19.2 | `StrictMode` on — see the StrictMode note under §4 Motion |
| Build | Vite 8 + `@vitejs/plugin-react` | `vite.config.js` is the react plugin and nothing else |
| Routing | React Router 7 (`BrowserRouter`) | one route today; see below |
| Styling | **CSS Modules only** | tokens in `variables.css`, base in `global.css` |
| DOM motion | **Framer Motion 12 — the only animation library** | every animation gates on `useReducedMotion()` |
| WebGL | `three` + `@react-three/fiber` + `@react-three/drei` + `maath` | **one component only** — `shared/FluidLens.jsx`. `ogl` is still installed and now used by nothing; §6 |
| Icons | `react-icons` (Heroicons `hi` outline set) | never hand-build an SVG — §5 |
| Type | Clash Display via Fontshare | sole typeface, §3 |
| Lint | `oxlint` (`npm run lint`) | `.oxlintrc.json`: react hooks rules only |

### Routing, and what is wired ahead of itself

`App.jsx` mounts a `BrowserRouter` with **exactly one route**: `/` → `pages/HomePage.jsx`, which renders `<Header />` then `<main>` with `<Hero />` and `<About />`.

`/about`, `/services` and `/contact` are linked from `navLinks.js`, and About's CTA points at `/about`, but **none of them has a `<Route>`** — following one renders an empty page. The links are deliberately wired ahead of the pages. When adding one of those pages, add the route *and* check nothing in `navLinks.js` needs to change.

### Component inventory

| File | What it is |
| --- | --- |
| `App.jsx` | Router shell. One route. |
| `pages/HomePage.jsx` | The only page: `Header` + `main`(`Hero`, `About`). |
| `components/Header/Header.jsx` | The **fixed** site header — floating glass pill, logo, desktop nav, mobile hamburger + `AnimatePresence` drawer. Hidden for the whole hero via `data-hidden` + `inert`. See §4 "The two headers". |
| `components/Hero/Hero.jsx` | `100svh` landing section: fixed 4K video backdrop under a `--color-scrim` overlay, an `sr-only` `<h1>`, and a bottom metadata ticker built from a local `tickerItems` array (company, founded, HQ, founder, CEO, scope). Its middle is **intentionally empty**. Pauses the video once `viewportProgress >= 1`, and carries `data-offscreen` at the same threshold to stop the animations inside it — see §7. |
| `components/Hero/HeroHeader.jsx` | The hero's own **in-flow** header — large logo + nav, mount-triggered entrance that plays once per session. Lives in `Hero/` because it has no life outside the hero. |
| `components/About/About.jsx` | The "Our Story" section — a micro-label eyebrow with a gold dot, a `--text-4xl` `h2`, **one** paragraph in a local `storyParagraph` string, a `.button-glass` CTA to `/about`, and the circular video window beside it. Owns the section-wide `mousemove` that drives the lens. The reference implementation for `whileInView` reveals. |
| `components/shared/Button.module.css` | **The** button definition — base + **two** glass variants. A module with no `.jsx` sibling, on purpose. |
| `components/shared/FluidBar.jsx` | The hero ticker's water — three drifting gradient masses under an SVG turbulence displacement. **Pure markup + CSS: no canvas, no WebGL, no JS.** The only genuinely moving surface on the site. |
| `components/shared/FluidLens.jsx` | The Story circle's glass lens — R3F `<Canvas>` with the story video as a `VideoTexture` on a frustum-filling plane and a `MeshTransmissionMaterial` lens in front of it. The video is **inside the scene** because transmission can only refract what is in the WebGL buffer. Takes a `pointer` ref (not props) so mousemove does not re-render the canvas. Renders **on demand**, not every frame — see §7. |
| `components/Founder/Founder.jsx` | The founder's page-within-a-section, pinned across About's stage and faded in over the finished zoom. Paints no ground of its own — the blurred frozen frame *is* its background. Passes `paused` to `LogoLoop` while its own opacity is 0. |
| `components/shared/LogoLoop.jsx` | The continuously scrolling strip of production stills. CSS animation, JS only measures. Stops via `data-paused` when the caller says it is invisible **or** its own `IntersectionObserver` says it is off screen — see §7. |
| `hooks/useMediaQuery.js` | Subscribes to a media query from JS, for the case a CSS breakpoint cannot reach: deciding whether to **mount** at all. Exists for the lens — `display: none` would still build the WebGL context, fetch the model and decode a video texture. |
| `hooks/useScrollPosition.js` | Passive, rAF-coalesced scroll reader → `{ scrollY, viewportHeight, viewportProgress }`. **One module-scoped listener and one `scrollY` read per frame** shared by every consumer, so a fourth costs nothing. Takes an **optional selector**, which narrows what is stored in state so a consumer that only wants a threshold does not re-render on every scroll frame; all three current consumers pass the file's own `isPastFirstViewport` export, which *is* the header and video-gate threshold rather than a matching copy of it. |
| `data/navLinks.js` | The nav model, shared by both headers. `Contact` carries `featured: true`. |
| `styles/variables.css` | Design tokens **only** — no selectors beyond `:root`. |
| `styles/global.css` | The `@import`s, reset, base element styles, film-grain overlay, `.noise-overlay` and `.sr-only`. Imported once, by `main.jsx`. |

### Assets

| Path | What | Status |
| --- | --- | --- |
| `public/assets/images/agb-logo.png` | 360×672 **portrait** mark, 256 KB. Referenced as `/assets/images/agb-logo.png` from `Header`, `HeroHeader` and `About`. | in use |
| `src/assets/abdullah/*.jpg` | 1280×720 originals. Only `abdullah.jpg` is imported (the portrait, drawn at ~440×350). The six numbered stills are **not** — nothing imports them, so Vite does not bundle them. | source only |
| `src/assets/abdullah/strip/*.jpg` | 640×360 cuts of the same six, 368 KB the set against 1.8 MB. What `Founder` actually imports. LogoLoop draws them at most 152px tall, so these are 2× and nothing is softer; the originals stay put to re-cut from. | in use (the work strip) |
| `src/assets/videos/hero.webm` | **3.7 MB.** Vite-imported, so it is bundled and hashed rather than served from `public/`. | in use (Hero backdrop) |
| `src/assets/videos/story.webm` | **4.7 MB.** Also Vite-imported and bundled. | in use (Story circle, via `FluidLens` or the plain `<video>` fallback) |
| `public/assets/3d/lens.glb` | The lens mesh, fetched at runtime from `public/` rather than bundled. `FluidLens` reads node `Cylinder` and **guards for its absence** — a re-export under a different node name renders no lens rather than throwing. | in use |

Because the logo is portrait, **anything sizing it must drive `block-size` and leave `inline-size: auto`** — width has to derive from the capped height, not the reverse. There are no icon sprites; the one 3D model is `lens.glb`.

**Both videos have since been compressed** — the pair is ~8.4 MB where it was ~100 MB, and the "compress `story.webm`" note that used to live here is done. They are still Vite-imported, so both land in the bundle rather than being streamed from `public/`; a production build emits them as two hashed assets. Any request that adds another video, or that removes the playback gate in `Hero.jsx`, still has to account for two simultaneous decodes on the home page.

The lens chunk is ~1.49 MB (421 KB gzipped), essentially all of it `three` + `@react-three/*`, and `About.jsx` **already `React.lazy`-splits it** — the main chunk is ~388 KB (125 KB gzipped). `useMediaQuery` additionally keeps phones from mounting the lens at all.

---

## 2. Design System

### Direction

**Dark cinematic, in glass and water.** The fluid/gold direction that was "in flight" has landed; it is the current direction, not a pending one.

The ground is still a flat `#010101`, the accent is still the one gold sampled from the logo, Clash Display is still the only typeface, and film grain still covers the viewport. What changed is the surfaces on top of it: nothing that sits above the page is a flat fill any more. Every raised surface is **glass** — a `--color-black` alpha, a `backdrop-filter` blur, a lit rim — and the material is given structure by **SVG turbulence displacement** rather than by gradients alone.

Four surfaces carry it, and they are meant to read as one material at different scales:

| Surface | Where | Treatment |
| --- | --- | --- |
| Hero metadata ticker | `shared/FluidBar.jsx` | Three drifting gradient masses under a turbulence displacement. **The only thing on the site that genuinely flows.** |
| Hero nav "Contact" | `.button-featured` | The same material held still — a *frozen* turbulence texture — plus a gold light travelling the rim. |
| Site header pill | `Header.module.css` | Frozen turbulence again, lighter, built up from white rather than down from the ground. |
| Story section ground | `About.module.css` | Viewport-wide frosted glass: `--section-glass-fill` over a `backdrop-filter` that blurs the hero's fixed footage through it. |

Two rules hold this together, and both are load-bearing:

- **Only the ticker flows.** Everything else is the same material caught still. The one deliberate exception is `.button-featured`'s travelling edge light, where the *texture* stays frozen and a light crosses it — argued at the rule itself. Do not add a third moving surface without making that call explicitly.
- **Restraint elsewhere is what makes the glass read.** One emphatic button, one typeface, one accent, one ground colour, no gradient bands at section joins. The material does the work; nothing else competes with it.

`--color-black` is settled and takes no further tuning. Moving it means carrying every copy of the ground tone together — see the translucent-surfaces note below.

### Colors

All colors live as CSS custom properties in `src/styles/variables.css`. **Never hardcode a color in a component.**

| Token | Value | Role |
| --- | --- | --- |
| `--color-black` | `#010101` | Near-true-black, exactly neutral — all three channels equal, no steel, slate, or blue lean. **The one and only background colour on the site**, for every section. The lineage runs `#0C0F14` → `#1B1D20` → `#131315` → `#070708` → `#0B0B0C` → `#050505` → `#030303` → here; the early values were set while the grain overlay was still adding luminance on top of them, so the page rendered lighter than its token. The grain has blended in soft-light since `#131315`, so this value is what reaches the screen. **This is the final ground tone — the token is settled and takes no further adjustment.** |
| `--color-gold` | `#C97014` | **Signature accent**, sampled from the logo's midtone. Headings, highlights, borders, interactive states. |
| `--color-gold-light` | `#E09A3C` | Hover / focus / raised state of the accent. |
| `--color-gold-deep` | `#8F2804` | Rust from the logo's lower band. Gradient endpoint only. |
| `--color-text` | `#F5F5F0` | Warm off-white. Body text. |
| `--color-text-muted` | `rgba(245,245,240,0.65)` | De-emphasized text. |

The gold was sampled directly from `/public/assets/images/agb-logo.png`. Do not re-derive it.

### Translucent surfaces — one tone, no seams

`--color-glass` (0.5), `--color-overlay` (0.72), `--color-scrim` (0.25), `--glass-fill` (0.55), `--glass-fill-light` (0.3) and `--section-glass-fill` (0.75) are all `--color-black` at an alpha, written out as literal `rgba(1, 1, 1, …)` because CSS cannot derive an alpha from a hex token. **They must all be edited by hand whenever `--color-black` changes**, and `theme-color` in `index.html` is a further copy. That is seven places holding one value — the cost of the glass system, and the reason `--color-black` is treated as settled.

**Never darken a surface with raw black** (`#000`, `rgba(0,0,0,…)`) — reach for one of these three, or add a fourth at the alpha you need. Pure black is both deeper and less cool than the ground tone, so a raw-black tint over one section leaves a visible step where it meets the next. The site is one tone end to end.

Shadows are the exception: `--shadow-soft` is legitimately black-based, because a shadow tinted to the surface it falls on stops reading as a shadow.

### Section boundaries over the hero backdrop

The hero's video backdrop is `position: fixed`, so every section below it scrolls *over* the footage. Sections meet that footage **directly**, with no gradient band, shadow, or any other treatment easing the join. An earlier pass faded the `About` edge with a gradient band and it was removed deliberately; **do not reintroduce one.**

What changed is what "directly" means. `About` no longer *covers* the footage — it filters it. `--section-glass-fill` (0.75) plus a viewport-wide `backdrop-filter` blur makes the section frosted glass with the hero's frozen frame visible through it. Two consequences worth knowing before touching either end:

- **The opacity is still load-bearing, for a different reason.** `Hero.jsx` pauses the video at `viewportProgress >= 1` because it treats one scrolled viewport as "covered". That gate is untouched and still correct — it now stops work on something visible but frozen behind glass rather than on something hidden.
- **The blur only reaches the video while nothing between `.about` and the document root establishes a backdrop root.** No ancestor may take `filter`, `opacity < 1`, `mask`, `contain`, or `isolation` — adding `isolation: isolate` to `<main>` would silently flatten the glass to a plain dark panel. `.backdrop` sits at `z-index: 0` and `.about` at `z-index: auto`, so tree order puts the footage underneath; giving `About` a z-index below the backdrop's would break it the same way.

**There is a known seam at the hero's bottom edge.** `.ticker` is painted in **fully opaque `--color-black`** and extends its fill through `.hero`'s block-end padding (`padding-block-end` plus an equal negative `margin-block-end`) specifically so the strip met `About`'s identical opaque black invisibly. That premise is gone — an opaque strip now runs into translucent glass, leaving a step in tone. Closing it means giving the ticker the same glass treatment; it is a Hero decision and has not been made. **Keep the two padding values equal** regardless — they cancel, which is what leaves the metadata sitting where it would without them.

### Background noise

A subtle film-grain overlay is applied globally via `body::after` in `global.css` (SVG `feTurbulence`, `--noise-opacity: 0.03`). It is `position: fixed`, `inset: 0`, `pointer-events: none`. A `.noise-overlay` utility class exists for applying the same texture to an individual surface.

It blends with **`mix-blend-mode: soft-light`, and that is load-bearing.** feTurbulence emits light, semi-transparent noise; under the default normal blend it could only *add* luminance, which lifted the rendered background ~3 points above `--color-black` and made the whole site read lighter than its own token. soft-light pivots around mid-grey, so the texture arrives at roughly net-zero luminance. **Do not return either grain layer to a normal blend** — it silently invalidates the ground colour. Because the grain can no longer lift the base, `--noise-opacity` may go well above the old `0.06` ceiling; on a ground this dark, soft-light compresses the texture hard, so it is very subtle at `0.03`.

### Buttons — one definition

**`src/components/shared/Button.module.css` is the only place a button is styled.** **Never restyle a button inside a section module** — add a variant beside the existing ones instead.

A call site applies the base **and exactly one variant**, plus a local class carrying *only* spacing:

| Classes | Look | Used by |
| --- | --- | --- |
| `.button .button-featured` | Glass over a **frozen turbulence texture**, `--radius-md` corners, `--color-text` label, faint rim; a gold light travels the inside of the rim and pauses on hover | Hero header — the nav's own "Contact" entry |
| `.button .button-glass` | The same glass body with a **drifting two-layer gold sheen** instead of the texture, and a brighter rim; the sheen pauses on hover | About — "Discover Our Story" |

There are **two** variants, and both are glass. `.button-quiet` (a gold hairline pill) and `.button-reveal` (a sliding-panel hover) were deleted once the glass pair had replaced them at both call sites — they are in git history if a non-glass surface ever needs a starting point.

```jsx
className={`${buttonStyles.button} ${buttonStyles['button-featured']} ${styles.cta}`}
```

**`.button-featured` is the site's one high-emphasis button**, and that holds only while it stays the only one — a second emphatic call to action anywhere cancels the distinction. It was a solid gold fill with a near-black label before it became glass.

**Contrast is worth stating, because the two variants diverge on it.** Both label in `--color-text` over `--glass-fill-light` (0.3 alpha). On About the backdrop is known, so the composite is fixed and the label sits near 11:1 — safely AA. Over the hero's footage there is *no* fixed ratio: a dark frame is comfortable, a bright one can fall below AA. `--glass-fill-light` is the dial for that, and raising it toward 0.55 restores a predictable floor at the cost of transparency.

**The two variants differ because the surfaces do.** Featured sits over moving footage, where a backdrop blur has real detail to work with and a faint rim is enough to find the edge; glass sits on About's own frosted ground, where the rim does more of the work. A new surface means a new variant here, not a button styled in a component.

- **Layout is not the button's business.** Nothing in this file sets a margin — where a button sits is the calling section's decision.
- **Everything that animates lives on a pseudo-element, never on the button.** Both call sites are `motion.create(Link)` and Framer writes `transform` inline on the anchor; an inline transform on the host does not reach `::before`/`::after`, which is what lets the entrance and the surface effects coexist. For the same reason `.button`'s `transition` is scoped to colour properties and must never be `transform` or `all` — that would smooth over Framer's own per-frame animation and make the entrance drag.
- **`isolation: isolate` + `z-index: -1`, not a lifted label.** The sheen layers sit above the button's fill and below its label by living at `z-index: -1` inside the variant's own stacking context. Lifting the label instead is not an option: `HeroHeader` renders it as a bare text node with no element to lift.
- **`overflow: hidden` is on the variants, not the base.** It clips the oversized sheen layers to the rounded box, and it is what forces `.button-featured`'s glow ring onto the *padding* box — overflow clips at the padding edge, so a ring pushed out to the border box loses its outer edge. The base stays unclipped so a future variant may deliberately paint outside its border box.
- **Both variants pause their motion on hover** (`animation-play-state: paused`), freezing wherever they are rather than resetting. Keep that consistent if a third variant ever animates.
- It is a module with no `.jsx` sibling, the one deviation from §4's file layout. Both call sites need to *be* the animated element, so a wrapper component would sit between Framer Motion and the DOM node for no gain. A `Button.jsx` rendering these classes is a few lines to add when a plain unanimated button appears.

### Spacing, radius, layout

Use the `--space-*`, `--radius-*`, `--header-height`, and `--container-max` tokens rather than raw pixel values.

---

## 3. Typography

**Clash Display is the sole typeface across the entire site.** There is no secondary family — display, headings, body, and UI all resolve to it. Do not introduce another font.

Loaded from **Fontshare** via `@import` at the top of `global.css`:

```css
@import url('https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap');
```

`index.html` preconnects to `api.fontshare.com` and `cdn.fontshare.com` so the request starts during HTML parse.

| Token | Value |
| --- | --- |
| `--font-display` | `'Clash Display', sans-serif` |
| `--font-heading` | alias of `--font-display` |
| `--font-body` | `'Clash Display', sans-serif` |

`--font-heading` is kept as a distinct token so a future pass can split the role off without touching every call site. Today all three are the same face.

### Weight ladder

| Token | Value | Use for |
| --- | --- | --- |
| `--font-weight-light` | `300` | Captions, fine print, the light end of body copy |
| `--font-weight-regular` | `400` | Body text |
| `--font-weight-medium` | `500` | Subheadings, nav links |
| `--font-weight-bold` | `600` | Secondary section titles |
| `--font-weight-heavy` | `700` | Hero headlines, bold section titles |

Applied in `global.css`: `h1`/`h2` → 700, `h3`/`h4` → 600, `h5`/`h6` → 500. Captions (`small`, `figcaption`, `caption`) → 300.

**Only request the six loaded weights** (200, 300, 400, 500, 600, 700). Fontshare serves Clash Display as static instances, not a single variable file — an intermediate value like `450` gets rounded to the nearest loaded weight rather than interpolated. Weight `200` is loaded but unassigned; use it deliberately or not at all.

---

## 4. Code Standards

### File structure

```
src/
  components/
    Header/
      Header.jsx
      Header.module.css
    Hero/
      Hero.jsx
      Hero.module.css
      HeroHeader.jsx        # the hero's own in-flow header (see "The two headers")
      HeroHeader.module.css
    About/
      About.jsx
      About.module.css
    shared/                 # reusable primitives
      Button.module.css     # THE button definition — no .jsx sibling, on purpose
      FluidBar.jsx          # the ticker's water: markup + CSS, no canvas
      FluidLens.jsx         # the story circle's R3F lens — the only WebGL on the site
  pages/                    # route-level components
  styles/
    variables.css           # design tokens ONLY
    global.css              # reset, base element styles, noise overlay
  hooks/
    useMediaQuery.js        # for mount/skip decisions a CSS breakpoint cannot make
    useScrollPosition.js
  data/                     # static content (copy, project lists)
    navLinks.js             # the nav model, shared by BOTH headers
  assets/
    videos/                 # hero.webm, story.webm — bundled, ~100 MB together
public/
  assets/images/agb-logo.png
  assets/3d/lens.glb        # fetched at runtime, not bundled
```

- **One component per file.** The file name matches the component name.
- Each component directory holds the `.jsx` and its `.module.css` side by side.
- New sections get their own directory under `components/`.

### Styling

- **CSS Modules only** (`Component.module.css`). No utility-class frameworks.
- Tailwind is intentionally **not active** — its Vite plugin is removed and its `@import` deleted, because its `@layer base` preflight collides with our own reset. Do not re-enable it.
- Global tokens in `variables.css`; global resets and base element styles in `global.css`. `global.css` imports `variables.css` and is imported once by `main.jsx`.
- **No inline styles** unless the value is genuinely dynamic (a computed transform, a runtime color).

**Global utility classes are not module classes.** `.noise-overlay` and `.sr-only` live in `global.css`, so their names are *not* hashed and they are absent from any `styles` object. Apply them as literal strings — `className="noise-overlay"` — never `styles['noise-overlay']`, which resolves to `undefined`. To combine one with a module class: `` className={`${styles.card} noise-overlay`} ``.

### Motion

Framer Motion is the only animation library. Section reveals use `whileInView` with `viewport={{ once: true, amount: 0.3 }}` so content animates a single time on first scroll-in. `About.jsx` is the reference.

**The hero's entrance is different, and deliberately so:** it is mount-triggered (`initial`/`animate`, never `whileInView`) because it should fire on page load rather than on scroll-in, and it must play **once per session**. `HeroHeader.jsx` guards it with a module-scoped `entrancePlayed` flag; when set, `rise()` returns no animation props at all, so elements render in their natural resting state with no `initial` to animate back from. (It lives in `HeroHeader.jsx` rather than `Hero.jsx` because the hero body is empty — the header is the only animated content in the hero.)

Two things about that flag are load-bearing. It lives at **module scope**, not in state: any remount replays the entrance from the top (routing away and back is the obvious case), and a flag inside the component would be reset by exactly that. (`Hero` no longer re-renders on every scroll frame — it subscribes to a boolean through `useScrollPosition`'s selector — so `HeroHeader` is no longer re-rendered per frame either. The flag is still read into a `useRef` rather than inline, which costs nothing and keeps the read independent of render count.) And it latches on **animation completion, not on mount** — StrictMode deliberately mounts, unmounts and remounts every component in development, so a mount-latched flag would be set by that throwaway first mount and would suppress the entrance before anyone saw it.

**Every Framer Motion animation must gate on `useReducedMotion()`.** The `@media (prefers-reduced-motion: reduce)` block in `global.css` governs **CSS** animations and transitions only — it has no effect on animations Framer Motion drives inline through JS. When the hook returns `true`, render the element in its final state with no transform. See `About.jsx` for the established pattern.

### The two headers

There are **two** headers, and they are never on screen at the same time.

| | `Header/Header.jsx` | `Hero/HeroHeader.jsx` |
| --- | --- | --- |
| Position | `fixed`, floating glass pill | **in flow**, inside `.hero`, scrolls away with it |
| Visible | only once the hero is behind you | only while you are in the hero |
| Layout | logo left, nav right, capped pill width | logo hard against the inline start, nav hard against the inline end, full bleed, no `--container-max` cap |
| Children | logo, nav, mobile toggle + drawer | **two only** — logo and nav. There is no separate CTA: the nav's `featured` entry renders as the filled button |
| Block alignment | centred in the pill | **top-aligned**; the nav sits flush at the row's top with no offset of its own, and the logo takes a small negative `margin-block-start` so it stays the higher of the two |
| Logo | `2.25rem` / `2.625rem` | far larger: `5.5rem` / `6.5rem`, inset from the bled edge by `--space-sm` / `--space-md` |
| Nav underline | Framer Motion variants | CSS `scaleX` on `::after` |

**The handoff is a single threshold: `isPastFirstViewport`, exported from `useScrollPosition.js`.** The hero is exactly `100svh`, so one scrolled viewport *is* the end of the hero. `Hero.jsx` gates its video playback on it, `Header.jsx` gates its own visibility on it, and `About.jsx` gates the story video on it — all three pass it to the hook as a **selector**, so they share one function rather than three copies of `viewportProgress >= 1`, and none of them re-renders on the frames in between. A fourth consumer should pass the same selector, not write the comparison out again.

- The site header hides via `data-hidden` on its root, a **CSS transition** (`opacity` + `translateY(-100%)` + `pointer-events: none`) rather than a Framer animation: it is a two-state toggle, not choreography, and CSS transitions are already covered by the `prefers-reduced-motion` block in `global.css`. This matches how `data-menu-open` already drives the pill's corners.
- It also carries **`inert`** while hidden. `pointer-events: none` alone still leaves the links in the tab order, so an invisible nav would be focusable over the hero.
- Its docked-pill look and menu-open corner morph are untouched by the hide — those live on `.bar` and come along with whatever state the header is in.
- **Both render from `src/data/navLinks.js`.** They look different on purpose; they must never offer different destinations. The `Contact` entry carries **`featured: true`** — a hint the hero header honours by rendering it as `.button-featured` instead of a plain link, and the site header deliberately ignores (a filled button would fight its compact glass pill, and there may only be one filled CTA on the site).
- Because the site header is hidden throughout the hero, `.hero`'s `padding-block-start` does not reserve `--header-height` — nothing fixed overlaps the hero. It is `--space-sm` (1rem), tighter than the block-end padding, so the hero header starts high on the page. **That 1rem is also the budget the logo's negative `margin-block-start` pulls against**: `.hero` is `overflow: hidden`, so a pull exceeding it clips the mark instead of raising it. Move the two together.
- **Below `48rem` the hero header shows only the logo and the gold Contact button** — `.nav-link` is `display: none` there, because three plain links plus the button cannot share a row with a logo that size. The nav element itself is never hidden: it holds the CTA, so hiding it would leave the first screen with no way forward. There is still no hamburger in the hero, so on a phone Contact is the only in-hero destination until you scroll past it.

### The hero body is intentionally empty

Between the hero header and the bottom ticker there is nothing — the footage carries the whole middle of the first screen. The location label, large logo, tagline and CTA that used to sit there are gone; the logo and CTA moved into `HeroHeader`.

There is **no spacer element** for that void: `.ticker` takes `margin-block-start: auto`, which absorbs the free space in the hero's column flex container and pins it to the bottom. That replaced the old `flex: 1` content block, which had become an element existing only to be blank.

The hero's `<h1>` is now **visually hidden** (`className="sr-only"`, a global utility, so a literal string — never `styles['sr-only']`). The old h1 was the large logo with `alt="AGB Media"`; that logo now belongs to a navigation row, where marking it up as the document's top-level heading would be wrong. Without the hidden h1 the document's first heading would be About's `h2`.

### Naming

- `PascalCase` — components and their files.
- `camelCase` — functions, variables, props.
- `kebab-case` — CSS class names inside modules (`.nav-link`, `.mobile-menu`).

### Comments

Comment the *why*, not the *what*. This project grows incrementally across many sessions — every component must be readable and modifiable in isolation without reading its neighbors.

---

## 5. Strict Rules

1. **NEVER touch git.** No `git add`, `commit`, `push`, `init`, `checkout`, or any other git command, ever.
2. **NEVER hand-build SVG icons.** Use `react-icons` (already installed). If a custom icon is needed, the user supplies it or explicitly asks for it.
3. **NEVER run `npm run build` or `npm run dev`.** The user handles builds and previews. Write the code only.
4. **NEVER create placeholder images or dummy SVG illustrations.** Leave an empty slot with a comment: `{/* IMAGE: wide cinematic still of the studio floor */}`.
5. **Keep the logo as-is.** It lives at `/public/assets/images/agb-logo.png` (referenced as `/assets/images/agb-logo.png`). Reference it; never recreate, redraw, or re-color it.

---

## 6. Dependencies

Already installed — do not reinstall:

`react` · `react-dom` · `react-router-dom` · `framer-motion` · `react-icons` · `three` · `@react-three/fiber` · `@react-three/drei` · `maath`

**The WebGL stack is `three` + `@react-three/fiber` + `@react-three/drei` + `maath`, and it exists for exactly one component: `shared/FluidLens.jsx`.** drei supplies `MeshTransmissionMaterial`, `useGLTF` and `useVideoTexture`; `maath` supplies `easing.damp3`, which is what makes the lens follow the pointer with weight. Nothing else in the project touches three.js — the hero backdrop is a plain `<video>`, and the ticker and both frosted headers are CSS plus SVG filters with no canvas at all.

**Framer Motion remains the only animation library for anything in the DOM** — see §4 Motion. R3F drives its own render loop inside the lens canvas and does not overlap with it.

**`ogl` is now fully unused.** It was the WebGL layer behind `shared/Grainient.jsx`, which was deleted; R3F replaced it. The package is still in `package.json` and can be uninstalled.

`tailwindcss` and `@tailwindcss/vite` remain in `package.json` but are **disconnected from the build**. They can be uninstalled by the user at any time.

`oxlint` is the linter (`npm run lint`). `.oxlintrc.json` enables the `react` and `oxc` plugins with `react/rules-of-hooks` as an error and `react/only-export-components` as a warning — nothing else. It is not a formatter, and there is no Prettier config; match the surrounding file's style by hand.

---

## 7. Unused, and stale — as of 2026-07-30

A cleanup pass on 2026-07-30 cleared this section. Everything it used to list — `Grainient.jsx` and its stylesheet, `story.png`, `zero.png`, the `.button-quiet` and `.button-reveal` variants, the `--color-raised` / `--color-navy` / `--color-surface` / `--text-5xl` / `--duration-morph` / `--shadow-gold` / `--z-modal` tokens, the vestigial `data-docked` attribute, and four stale comments — has been deleted or fixed. Lint is clean and the build passes.

**`--shadow-soft` was on that list and is NOT unused** — `About.module.css` applies it to the story circle, where it registers properly now that the section is glass rather than flat black. It was kept.

Two things that look like duplication and are deliberately not:

- **Three SVG turbulence filters** — `FluidBar.jsx`, `HeroHeader.jsx` (`#hero-cta-turbulence`) and `Header.jsx` (`#site-header-turbulence`). Structurally near-identical, every number different. `feTurbulence`'s `baseFrequency` is in **user-space units, not units of the element**, so a field tuned for one box size produces a visibly different texture on another — what reads as water across a 1500px strip is sandpaper on a 140px button. Sharing also saves nothing at render time, since a filter is evaluated per element it is applied to. Each carries a comment saying so; keep them separate.
- **Two `@keyframes` per animated module** — `fluid-drift` / `fluid-drift-bob` in `FluidBar.module.css`, `sheen-flow` / `edge-travel` in `Button.module.css`. All four names and bodies are distinct, and CSS Modules scopes `@keyframes` per file anyway. Nothing to hoist into `global.css`.

### Only one video decodes at a time

`hero.webm` and `story.webm` are **mutually exclusive**, and both ends of the switch are the same `isPastFirstViewport` selector. `Hero.jsx` pauses its backdrop when it becomes true; `About.jsx` refuses to start the story video until it does, through `syncPlayback`. `FluidLens` passes `start: false` to `useVideoTexture` and the fallback `<video>` carries no `autoPlay`, so **nothing starts the story video except `syncPlayback`** — adding either back reintroduces two simultaneous decodes across the whole first screen.

The story video's second gate is the transition's own `VIDEO_PAUSE_AT`; both live in one expression on purpose.

**The one visible consequence, so nobody re-derives it as a bug:** About's circle reaches the screen about a third of the way down the hero, and the hero's video does not stop until a full viewport has been scrolled — so in between, the circle shows a still frame. That window cannot be closed without either two decodes or freezing the hero, and the hero is full-bleed and is what the visitor is looking at.

There is still one overlap, deliberately: during the priming window (progress `0` → `LENS_DROP_AT`) the lens's texture video and the DOM fallback both play. Both are *story* video, the hero is already paused, and the overlap is what stops the canvas→DOM handoff cutting to an unrelated frame. Priming the fallback paused would need a seek at the swap, which is exactly the visible jump priming exists to prevent.

### Always-on animation is paused when nothing can see it

Four CSS animations are infinite, and every one of them used to run from first paint until the tab closed regardless of where the page was scrolled. Three are now gated; the mechanism is an **attribute on an ancestor**, because CSS Modules hashes class names per file and the pausing component is never the one that owns the stylesheet.

| Animation | Gated by | Why it was worth it |
| --- | --- | --- |
| `FluidBar`'s three drifting layers | `data-offscreen` on `.hero` | They sit under `filter: url(#fluid-bar-turbulence)`, and **a transform beneath a filtered ancestor cannot be composited** — every frame re-ran `feDisplacementMap` across the whole strip. The most expensive idle on the site. |
| `.button-featured::after`'s rim light | `data-offscreen` on `.hero` | Animates a registered custom property into a conic-gradient behind two masks composited with `xor`: every frame is a full re-raster, not a compositor transform. |
| `LogoLoop`'s track | `data-paused` — `paused` prop **or** its own `IntersectionObserver` | A `will-change` layer holding a dozen photographs. Both signals are needed: on the pinned path the strip is geometrically on screen the whole time at `opacity: 0`, so only `Founder`'s prop catches it; in flow on a phone only the observer does. |
| `.button-glass`'s two sheens | **nothing — left running** | Two small pseudo-elements animating `transform` with no filtered ancestor, so they genuinely are compositor work. Gating them would mean freezing a sheen that is partly on screen. |

Every pause is `animation-play-state: paused`, never `animation: none` — the layers keep their offsets against each other and resume where they stopped, so nothing resyncs into a visible jump. Each also drops its `will-change` in the same rule: the hint is a promise about imminent motion, and on a stopped element it is a compositor layer held for nothing.

### The lens's render budget — held on purpose

`FluidLens.jsx` carries four constraints that exist only to keep the WebGL cost down. None of them changes how the lens looks; all four are easy to undo by accident.

- **`frameloop="demand"`.** The canvas renders when something asks. Three things ask: a decoded video frame, a lens still travelling toward the pointer, and R3F itself on any store change (which covers the canvas resizing under About's zoom). Between them it runs at the display's rate while something moves and at the video's rate while nothing does. **Firefox has no `requestVideoFrameCallback`**, so there is no signal to drive the loop and it falls back to `"always"` — that branch is not optional, and removing it freezes the canvas on Firefox.
- **The `IntersectionObserver` gate.** About is on the home page, so the lens is alive from first paint while the visitor is still a screen above it on the hero. The gate stops the *rendering*, not the video — the footage stays warm and in sync so arriving at the section shows motion rather than a first frame.
- **The pointer wakes the loop from outside.** With the story video paused for most of the time the section is approaching, there are no video frames to drive the canvas — so `About`'s mousemove has to ask for a frame itself, through the `invalidateRef` handle `InvalidateHandle` fills in. The `IntersectionObserver` invalidates on re-entry for the same reason.
- **`resolution={512}` and `samples={4}` on the material, applied *after* the `{...materialProps}` spread** so a call site cannot restore drei's defaults through `lensProps`. Omitted, `resolution` makes drei allocate two **full-canvas half-float** buffers and re-size them from a layout effect on every canvas resize; `samples` defaults to 10, which is thirty dependent texture fetches per pixel of glass. `samples={4}` is only lossless while `roughness` is 0 — the argument is at the constant, and raising roughness at a call site invalidates it.

The biggest remaining cost is not in this file: About's zoom animates `width`/`height`, which are **layout** properties, so the frame relayouts and the R3F canvas re-sizes once a frame for the first ~39% of the runway. That is a deliberate design decision (the frame *uncrops* rather than scaling — see the note on `zoomWidth` in `About.jsx`), not an oversight, and the lens teardown at `LENS_DROP_AT` is what bounds it.

### Two more things that are load-bearing and expensive

- **`.about`'s viewport-wide `backdrop-filter`** is still the single most expensive declaration in the project, and it stays — it *is* the section's surface (§2). `--section-glass-blur` is the dial, not the fill. Note it cannot be switched off once the zoom frame covers the viewport either: the frame keeps its 20px corners, and those four wedges are exactly where the section's glass shows through.
- **`body::after`'s `mix-blend-mode: soft-light`** forces the whole page into one blended group. It is what keeps the grain from lifting `--color-black` (§2) and it is not animated, so there is nothing to gate — a `will-change` hint would not make the blend cheaper.

**No layout reads on the scroll or pointer path.** `About`'s pointer handler caches `.circle`'s rect and marks it stale from a passive `scroll` listener rather than calling `getBoundingClientRect()` per event — a high-polling mouse fires above the display's refresh rate, and Framer writes `width`/`height` inline on `.zoom-layer` from its own frame loop, so every one of those reads was flushing layout for the whole document. Anything added here should keep that property: `.circle` is the untransformed parent precisely so its box only moves on scroll and resize.

**Naming:** "About" and "the Story section" mean the same component throughout the codebase — the directory is `components/About/`, the `id` is `about`, and the visible title is "Our **Story**". Both names appear in comments; neither is wrong.

Keep this section honest. If something becomes unreferenced, list it here rather than deleting it silently, and note whether it is dead by accident or held on purpose.
