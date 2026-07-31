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
| WebGL | **none.** | There is no WebGL, no canvas and no 3D library on this site, and none is installed. The Story circle's lens is `shared/CssLens.jsx` — a div. |
| Icons | `react-icons` (Heroicons `hi` outline set) | never hand-build an SVG — §5 |
| Type | Clash Display via Fontshare | sole typeface, §3 |
| Lint | `oxlint` (`npm run lint`) | `.oxlintrc.json`: react hooks rules only |

### Routing, and what is wired ahead of itself

`App.jsx` mounts a `BrowserRouter` with **exactly one route**: `/` → `pages/HomePage.jsx`, which renders `<Header />` then `<main>` with a `.stage` wrapper holding `<HeroBackdrop />`, `<Hero />` and `<About />`, followed by `<Founder />` and `<WhyAgb />`. There is no placeholder section any more — `WhyAgb` took that slot. `HomePage.module.css` went with it and has since come back, for the stage — see §7.

`/about`, `/services` and `/contact` are linked from `navLinks.js`, and About's CTA points at `/about`, but **none of them has a `<Route>`** — following one renders an empty page. The links are deliberately wired ahead of the pages. When adding one of those pages, add the route *and* check nothing in `navLinks.js` needs to change.

### Component inventory

| File | What it is |
| --- | --- |
| `App.jsx` | Router shell. One route. |
| `pages/HomePage.jsx` | The only page. Owns **`.stage`** — the wrapper holding `HeroBackdrop`, `Hero` and `About`, which is what scopes the sticky footage to those two sections (§7). Holds **one boolean**, reported by `About` and consumed by a component that knows nothing of it: whether the Story section is half on screen (→ `Header`'s `visible`, §4). It held a second until the backdrop became sticky and made the question unnecessary. |
| `components/Header/Header.jsx` | The **fixed** site header — floating glass pill, logo, desktop nav, mobile hamburger + `AnimatePresence` drawer. Hidden via `data-hidden` + `inert` until its `visible` prop says otherwise; it reads no scroll position of its own. See §4 "The two headers". |
| `components/Hero/Hero.jsx` | `100svh` landing section: an `sr-only` `<h1>`, its own header, and a bottom metadata ticker built from a local `tickerItems` array (company, founded, HQ, founder, CEO, scope). Its middle is **intentionally empty**. **Takes no props and holds no video** — it carries `data-offscreen` at `viewportProgress >= 1` to stop the animations inside it, and nothing else. |
| `components/Hero/HeroBackdrop.jsx` | The 4K footage under a `--color-scrim` overlay — **`position: sticky`, and a sibling of `Hero` and `About` rather than a child of either**, because the pinning spans both and a sticky box is constrained by its containing block. Owns the play/pause gate and the unmute-on-first-gesture effect. Lives in `Hero/` because the footage is the hero's, like `HeroHeader.jsx`. See §7. |
| `components/Hero/HeroHeader.jsx` | The hero's own **in-flow** header — large logo + nav, mount-triggered entrance that plays once per session. Lives in `Hero/` because it has no life outside the hero. |
| `components/About/About.jsx` | The "Our Story" section — a micro-label eyebrow with a gold dot, a `--text-4xl` `h2`, **one** paragraph in a local `storyParagraph` string, a `.button-glass` CTA to `/about`, and the circular video window beside it. Owns the section-wide `mousemove` that drives the lens. Reveals on the shared ladder in `useSectionReveal`. Its ground is a **full-height** `::before`, not the section's own background — §7. **Observes its own box twice** — at `0.2` for its video, and at `0.5` for the site header's arrival (`onHalfVisibleChange`, §4, reported to `HomePage` rather than used here). There was a third, for the hero's backdrop, until sticky made it unnecessary — §7. |
| `components/shared/Button.module.css` | **The** button definition — base + **two** glass variants. A module with no `.jsx` sibling, on purpose. |
| `components/shared/FluidBar.jsx` | The hero ticker's water — three drifting gradient masses under an SVG turbulence displacement. **Pure markup + CSS: no canvas, no WebGL, no JS.** The only genuinely moving surface on the site. |
| `components/shared/CssLens.jsx` | The Story circle: the looping `<video>`, plus a 140px frosted-glass disc that follows the pointer over it. Pure DOM — a `backdrop-filter: blur() saturate()`, a white tint, a soft radial highlight, a thin rim and one inset shadow. A **perfect circle at every moment**; nothing distorts its geometry. Takes a `pointer` ref (not props) so mousemove does not re-render it, and a `wakeRef` so About can restart its follow loop. **It does not bend the footage** — see §7. |
| `components/Founder/Founder.jsx` | The founder's page-within-a-section — an ordinary section after About, whose **four areas** reveal on the shared ladder (intro, career line, photo strip, works strip). Its ground is a **still image** (`founder.webp`) filling **one screen** under a frosted pane of the **light** glass pair — `--section-glass-fill-light` / `--section-glass-blur-light` — both at a negative `z-index` so the in-flow copy stays on top, and both pinned to the section's **block end** because that edge is a seam — §7. It was `story.webm` under the strong pair; it holds **no video** and no longer claims a playback slot — see §7. Runs **two** LogoLoops, deliberately opposed in direction. The portrait sits in a `.portrait-frame` that exists only to clip it — §7. |
| `components/WhyAgb/WhyAgb.jsx` | The closing section — "Why AGB Media", six reasons in a **2 × 3 grid** on one screen, over a drifting field of outlined wordmarks. Each cell is an oversized gold numeral (8%) sitting *behind* its title, with one hairline down the grid's centre and no other rule, border or fill. Copy lives in a local `reasons` array — `title` + `description` only, no per-row label. Its ground is `why.webp`, the second half of the Founder's image, under the same light glass pair pinned to the section's **block start** — the two grounds are one picture cut across the section boundary, §7. It was four radial gradients, a block-axis mask and a local grain layer. The field is three rows of `-webkit-text-stroke` text drifting on pure CSS keyframes, middle row opposed — see §2 and §7. |
| `components/shared/LogoLoop.jsx` | The continuously scrolling strip — **of stills or of text**, one entry being either `{ src, alt }` or `{ label }`. CSS animation, JS only measures. Stops via `data-paused` when its own `IntersectionObserver` says it is off screen; the `paused` prop is part of its contract but no caller passes it today — see §7. |
| `hooks/useExclusiveVideo.js` | The page-wide **one-video-at-a-time** registry. Module-scoped claims, one `resolve()` that pauses every loser before playing the winner, and a DEV-only assertion that the invariant holds. `PLAYBACK_PRIORITY` names the order. Hero is deliberately not a claimant — see §7. |
| `hooks/useSectionReveal.js` | **The** scroll-in entrance, as a ladder of steps. All three scrolling sections reveal from it, so retuning the feel is one edit rather than two that drift. Returns `revealAt(step)` — steps are indices, not seconds — and carries its own `prefers-reduced-motion` branch, so call sites never check. See §4 Motion. |
| `hooks/useMediaQuery.js` | Subscribes to a media query from JS, for the case a CSS breakpoint cannot reach: deciding whether to **mount** at all. Exists for the lens, from when that meant a WebGL context, a model fetch and a video texture that `display: none` would still have paid for. It is far cheaper to mount now, but the gate is kept: a pointer-following disc has almost nowhere to travel in a ~300px circle and there is usually no pointer to follow. |
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
| `public/assets/videos/hero.webm` | **3.7 MB, and the one asset deliberately NOT Vite-imported.** `index.html` preloads it by name with `fetchpriority="high"`, and a preload hint cannot name a content-hashed URL that does not exist until the build runs — so this has to be served from a stable path. `Hero.jsx` references it as the literal `HERO_VIDEO`; keep the two in step by hand, because there is no import to fail loudly. The trade is no cache-busting: **rename the file (and both references) when the footage changes.** | in use (Hero backdrop) |
| `src/assets/videos/story.webm` | **4.7 MB.** Vite-imported and bundled, and it wants the opposite treatment to the hero's. **Imported once**, by `About` for the Story circle — `Founder` imported it too, for its background, until that ground became a still image. `CssLens` sets `preload="metadata"` so it fetches a first frame rather than 4.7 MB while the hero needs the bandwidth. | in use (Story circle) |
| `src/assets/images/founder.webp` | **21 KB**, 834×680 — the Founder's ground: a studio still with a director's chair, lit from the upper right. Vite-imported, so it is hashed and bundled. It replaced `f.png` (3.3 MB, 2122×1186, a PNG of a photographic image), which is where the "re-encode this one" note that used to live here went. | in use (Founder ground) |
| `src/assets/images/why.webp` | **25 KB**, 834×630 — WhyAgb's ground, and **the same picture continued**: same source width as `founder.webp`, and its first row is the row below that file's last. The pair is laid out so the join lands exactly on the section boundary — the arithmetic is in both stylesheets and in §7. **They must stay the same width**; a re-cut that changes one changes both. | in use (WhyAgb ground) |

Because the logo is portrait, **anything sizing it must drive `block-size` and leave `inline-size: auto`** — width has to derive from the capped height, not the reverse. There are no icon sprites and **no 3D models** — `public/assets/3d/lens.glb` was the lens mesh and went with the WebGL lens.

**Both videos have since been compressed** — the pair is ~8.4 MB where it was ~100 MB, and the "compress `story.webm`" note that used to live here is done. They are still Vite-imported, so both land in the bundle rather than being streamed from `public/`; a production build emits them as two hashed assets. Any request that adds another video, or that removes the playback gate in `Hero.jsx`, still has to account for two simultaneous decodes on the home page.

**The JS is one chunk of ~390 KB (126 KB gzipped)**, and there is no code splitting anywhere. It was 1.86 MB across two chunks — a ~1.49 MB lazy chunk that was essentially all `three` + `@react-three/*`, plus the main one — until the WebGL lens was replaced by `shared/CssLens.jsx`. Nothing left in the tree is large enough for a split to pay for its own round trip.

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
| Story section ground | `About.module.css` | Frosted glass over the **section's full height**: `--section-glass-fill` over a `backdrop-filter` that blurs the hero's fixed footage through it. A `::before`, not the section's own background, and it may not stop short of the section's bottom — §7. |
| Founder section ground | `Founder.module.css` | The same idiom at **half strength** — a still image under `--section-glass-fill-light` / `--section-glass-blur-light`. The **strong** pair is for a *video* ground and stays reserved for one; the light pair is for a still worth looking at. Do not collapse them back into one. |
| WhyAgb section ground | `WhyAgb.module.css` | The Founder's pane again, at the same two tokens, over the continuation of the Founder's image. **The match is not a coincidence and is not free to break:** the two sections share a seam, and glass is part of what the eye compares across one. The pair is one decision written in two files. |

Two rules hold this together, and both are load-bearing:

- **Two surfaces flow, and the second was added deliberately.** The ticker is the original: genuine fluid motion under a displacement filter. **WhyAgb's wordmark field is the second** — three rows of outlined "AGB MEDIA" drifting horizontally behind the closing grid, the middle row against the other two. This rule required that call to be made explicitly, so here it is: it is admissible because it is *not the same material*. The ticker and the buttons are glass, and the rule protecting them is that glass reads as glass only when it is still; the field is not a surface at all but a texture painted **on** the ground, at a stroke so faint (`--color-gold` at 5%, a measured RGB(11, 7, 2) against a (1, 1, 1) section) that it carries no material reading to break. It also never shares a screen with the ticker. **A third moving surface still needs its own argument, and "WhyAgb has one" is not it.**
- The other standing exception is `.button-featured`'s travelling edge light, where the *texture* stays frozen and a light crosses it — argued at the rule itself.
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

The hero's video backdrop is `position: sticky` and pinned to the top of the viewport, so the Story section scrolls *over* the footage. Sections meet that footage **directly**, with no gradient band, shadow, or any other treatment easing the join. An earlier pass faded the `About` edge with a gradient band and it was removed deliberately; **do not reintroduce one.**

What changed is what "directly" means. `About` no longer *covers* the footage — it filters it. `--section-glass-fill` (0.75) plus a viewport-wide `backdrop-filter` blur makes the section frosted glass with the hero's frozen frame visible through it. Two consequences worth knowing before touching either end:

- **The opacity is still load-bearing, for a different reason.** `Hero.jsx` pauses the video at `viewportProgress >= 1` because it treats one scrolled viewport as "covered". That gate is untouched and still correct — it now stops work on something visible but frozen behind glass rather than on something hidden.
- **The blur only reaches the video while nothing between `.about` and the document root establishes a backdrop root.** That chain is now `.stage-content` → `.stage` → `<main>`, and none of them may take `filter`, `opacity < 1`, `mask`, `contain`, or `isolation` — adding `isolation: isolate` to any one would silently flatten the glass to a plain dark panel. `.backdrop` sits at `z-index: 0` and `.about` at `z-index: auto`, so tree order puts the footage underneath; giving `About` a z-index below the backdrop's, or giving either wrapper a z-index, would break it the same way.

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
      HeroBackdrop.jsx      # the sticky footage — a sibling of Hero, not a child (see §7)
      HeroBackdrop.module.css
      HeroHeader.jsx        # the hero's own in-flow header (see "The two headers")
      HeroHeader.module.css
    About/
      About.jsx
      About.module.css
    Founder/
      Founder.jsx
      Founder.module.css
    shared/                 # reusable primitives
      Button.module.css     # THE button definition — no .jsx sibling, on purpose
      FluidBar.jsx          # the ticker's water: markup + CSS, no canvas
      CssLens.jsx           # the story circle: the video, and a glass disc over it
      LogoLoop.jsx          # the founder's scrolling strips — stills, and titles
  pages/                    # route-level components
    HomePage.jsx            # owns .stage, and wires About's report to Header
    HomePage.module.css     # .stage and .stage-content — the sticky backdrop's scope
  styles/
    variables.css           # design tokens ONLY
    global.css              # reset, base element styles, noise overlay
  hooks/
    useExclusiveVideo.js    # the page-wide one-video-at-a-time registry
    useSectionReveal.js     # THE scroll-in entrance, shared by both sections
    useMediaQuery.js        # for mount/skip decisions a CSS breakpoint cannot make
    useScrollPosition.js
  data/                     # static content (copy, project lists)
    navLinks.js             # the nav model, shared by BOTH headers
  assets/
    videos/story.webm       # bundled; hero.webm is in public/, see Assets
    abdullah/               # the portrait, plus six 1280x720 originals nothing imports
      strip/                # 640x360 cuts of those six — what LogoLoop actually shows
    images/                 # founder.webp + why.webp — one picture cut in two, see §7
public/
  assets/images/agb-logo.png
  assets/videos/hero.webm   # served from a stable path so index.html can preload it
```

- **One component per file.** The file name matches the component name.
- Each component directory holds the `.jsx` and its `.module.css` side by side.
- New sections get their own directory under `components/`.

### Styling

- **CSS Modules only** (`Component.module.css`). No utility-class frameworks.
- Tailwind is intentionally **not active** — it is uninstalled, its Vite plugin is absent and its `@import` deleted, because its `@layer base` preflight collides with our own reset. Do not re-enable it.
- Global tokens in `variables.css`; global resets and base element styles in `global.css`. `global.css` imports `variables.css` and is imported once by `main.jsx`.
- **No inline styles** unless the value is genuinely dynamic (a computed transform, a runtime color).

**Global utility classes are not module classes.** `.noise-overlay` and `.sr-only` live in `global.css`, so their names are *not* hashed and they are absent from any `styles` object. Apply them as literal strings — `className="noise-overlay"` — never `styles['noise-overlay']`, which resolves to `undefined`. To combine one with a module class: `` className={`${styles.card} noise-overlay`} ``.

### Motion

Framer Motion is the only animation library.

**Every scroll-in reveal on the site comes from `hooks/useSectionReveal.js` — About, Founder and WhyAgb — and a new section reveals from it too.** It is one ladder — `revealAt(0)`, `revealAt(1)`, … — with the travel (12px), the duration (0.58s), the stagger (0.09s), the easing (`[0.16, 1, 0.3, 1]`, a long flat-tailed decelerating curve) and `viewport: { once: true, amount: 0.25 }` all set in that one file. Steps are **indices, not delays**, so re-ordering a ladder is renumbering it. Do not write a `whileInView` transition inline in a section — two sections tuned separately stop reading as one gesture, which is the whole reason this was hoisted out of `About.jsx` and `Founder.jsx`.

`once: true` is not a preference: it is what stops a ladder replaying on every scroll past. The hook also carries the `prefers-reduced-motion` branch (it returns `{}` per step, so elements render in their final state with no `initial`), which is why no call site checks the preference for a reveal.

**The hero's entrance is different, and deliberately so:** it is mount-triggered (`initial`/`animate`, never `whileInView`) because it should fire on page load rather than on scroll-in, and it must play **once per session**. `HeroHeader.jsx` guards it with a module-scoped `entrancePlayed` flag; when set, `rise()` returns no animation props at all, so elements render in their natural resting state with no `initial` to animate back from. (It lives in `HeroHeader.jsx` rather than `Hero.jsx` because the hero body is empty — the header is the only animated content in the hero.)

Two things about that flag are load-bearing. It lives at **module scope**, not in state: any remount replays the entrance from the top (routing away and back is the obvious case), and a flag inside the component would be reset by exactly that. (`Hero` no longer re-renders on every scroll frame — it subscribes to a boolean through `useScrollPosition`'s selector — so `HeroHeader` is no longer re-rendered per frame either. The flag is still read into a `useRef` rather than inline, which costs nothing and keeps the read independent of render count.) And it latches on **animation completion, not on mount** — StrictMode deliberately mounts, unmounts and remounts every component in development, so a mount-latched flag would be set by that throwaway first mount and would suppress the entrance before anyone saw it.

**Every Framer Motion animation must gate on `useReducedMotion()`.** The `@media (prefers-reduced-motion: reduce)` block in `global.css` governs **CSS** animations and transitions only — it has no effect on animations Framer Motion drives inline through JS. When the hook returns `true`, render the element in its final state with no transform. Scroll-in reveals get this for free from `useSectionReveal`; anything else — the lens's follow loop, the hero's entrance — checks for itself.

### The two headers

There are **two** headers, and they are never on screen at the same time.

| | `Header/Header.jsx` | `Hero/HeroHeader.jsx` |
| --- | --- | --- |
| Position | `fixed`, floating glass pill | **in flow**, inside `.hero`, scrolls away with it |
| Visible | from the Story section's midpoint down | only while you are in the hero |
| Layout | logo left, nav right, capped pill width | logo hard against the inline start, nav hard against the inline end, full bleed, no `--container-max` cap |
| Children | logo, nav, mobile toggle + drawer | **two only** — logo and nav. There is no separate CTA: the nav's `featured` entry renders as the filled button |
| Block alignment | centred in the pill | **top-aligned**; the nav sits flush at the row's top with no offset of its own, and the logo takes a small negative `margin-block-start` so it stays the higher of the two |
| Logo | `2.25rem` / `2.625rem` | far larger: `5.5rem` / `6.5rem`, inset from the bled edge by `--space-sm` / `--space-md` |
| Nav underline | Framer Motion variants | CSS `scaleX` on `::after` |

**The two are separated by a wide margin, not by a shared threshold.** `HeroHeader` is in flow at the top of the page and is off screen after roughly 120px of scrolling. `Header` does not appear until **half of the Story section is on screen** — half a viewport — so there is about half a screen of scrolling in which neither is visible, and no arrangement in which both are.

**The site header's cue is `HEADER_REVEAL_AMOUNT` in `About.jsx`** — `useInView(aboutRef, { amount: 0.5 })`, reported up through `HomePage.jsx` and or-ed there with `isPastFirstViewport` before being passed to `Header` as its `visible` prop.

**That `||` is load-bearing, and removing it is a bug that has already happened once.** An intersection is a *window*, not a threshold: `amount: 0.5` is true while at least half the section is on screen and false again the moment it has scrolled away — which is exactly where the Founder starts, so on its own it hid the header for the whole rest of the page. Or-ing it with "the hero is behind us" turns the pair into a threshold, and the two windows genuinely overlap (Story reaches half-visible at half a viewport, before the hero flag flips at one), so the header cannot flicker in a seam between them. It deliberately does **not** latch permanently: scrolling back up into the hero has to hide it again, or the fixed pill lands on top of `HeroHeader`'s logo and nav. It is measured against **that section's own box**, deliberately: `.about` is `min-block-size: 100vh`, a floor rather than a height, so a threshold written in viewport multiples drifts from the section's real midpoint on exactly the windows where the section is not one viewport tall.

It used to be `isPastFirstViewport` — the header arrived only once the Story section had taken the screen outright. **That export still exists and is still shared, but it is now purely the video threshold**: `Hero.jsx` pauses its backdrop on it, and `About.jsx` and `Founder.jsx` fold it into their own playback intent. All three pass it to the hook as a **selector**, so they share one function rather than three copies of `viewportProgress >= 1`, and none of them re-renders on the frames in between. A new *video* consumer should pass the same selector; anything that wants a **section's** geometry should observe that section, not add a viewport multiple.

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

`react` · `react-dom` · `react-router-dom` · `framer-motion` · `react-icons`

That is the whole runtime. **There is no 3D or WebGL library in this project.** `three`, `@react-three/fiber`, `@react-three/drei` and `maath` were uninstalled when `shared/FluidLens.jsx` was replaced by `shared/CssLens.jsx`; they existed for that one component and nothing else ever imported them. Do not reach for them again without a reason that survives §7's account of what the WebGL lens actually cost.

**Framer Motion is the only animation library, full stop** — see §4 Motion. The one thing outside it is CssLens's follow loop, which is a bare `requestAnimationFrame` writing a `transform`; it is not a second animation system, and the argument for it is at the file.

**`ogl`, `tailwindcss` and `@tailwindcss/vite` were uninstalled on 2026-07-31.** `ogl` was the WebGL layer behind the deleted `shared/Grainient.jsx` and nothing had imported it since; the Tailwind pair had been disconnected from the build for as long. None of them was ever in the bundle, so removing them changed the output by zero bytes — the saving is install footprint and one less thing to mistake for a live dependency.

`@types/react` and `@types/react-dom` stay. This is a JS project with no TypeScript, so nothing consumes them at build time — they are there for editor IntelliSense against the JSDoc the hooks are annotated with, and they cost nothing shipped.

`oxlint` is the linter (`npm run lint`). `.oxlintrc.json` enables the `react` and `oxc` plugins with `react/rules-of-hooks` and **`no-undef`** as errors and `react/only-export-components` as a warning, under `env: { browser, es2024 }`.

**`no-undef` is not optional and was added after it was needed.** A regex edit deleted a whole import block out of `Founder.jsx` and *both `npm run build` and `npm run lint` passed* — Vite does not resolve identifiers and the rule was off, so the first sign of trouble was a black screen and `ReferenceError: portrait is not defined` in the browser. The `env` block is what makes it usable: without it every `window`, `document`, `IntersectionObserver` and `performance` in the codebase is an error. It is not a formatter, and there is no Prettier config; match the surrounding file's style by hand.

---

## 7. Unused, and stale — as of 2026-07-31

A second cleanup pass ran on 2026-07-31. What it found and did:

- **`ogl`, `tailwindcss`, `@tailwindcss/vite` uninstalled.** None was imported by anything; none was in the bundle. Output unchanged to the byte — see §6.
- **Four redundant `.gitkeep` files removed** (`hooks/`, `data/`, `components/shared/`, `assets/videos/`), each in a directory that has held real files for some time. `src/assets/images/.gitkeep` **stayed**, that directory being genuinely empty at the time; it now holds the two section grounds and the file is no longer doing anything. A stray `.DS_Store` under `src/assets/abdullah/` went with them.
- **Four stale comments fixed**, all of which had become actively misleading: `useScrollPosition.js` naming the site header as a consumer it no longer has; `Hero.module.css` claiming `--glass-sheen` was still referenced by the glass buttons; `HeroHeader.jsx` describing Hero as re-rendering every scroll frame (it has not since the selector landed) and the Contact button as a solid gold fill (it has been glass since the glass pass).
- **Audited and found clean:** every class in every CSS Module is referenced by its component (checked mechanically, comments stripped); every `addEventListener` is removed on cleanup and every scroll listener is `passive`; every `will-change` is paired with a rule that drops it when the animation stops; no effect has a wrong dependency array; no orphaned components, assets or refs remain from the zoom-transition removal or the FluidLens→CssLens migration.

**Fifteen design tokens in `variables.css` are unreferenced, and are deliberately kept:** `--color-gold-deep`, `--color-border`, `--color-border-subtle`, `--color-overlay`, `--color-glass`, `--glass-sheen`, `--glass-sheen-warm`, `--header-blur`, `--text-lg`, `--text-xl`, `--text-2xl`, `--tracking-widest`, `--radius-sm`, `--duration-slow`, `--ease-in-out`. They are listed here rather than deleted, per this section's own rule. Most are **rungs of a scale** — deleting the unused steps of a type, radius or easing ramp leaves a ramp with holes in it, which is worse than an unused custom property that costs nothing at runtime. The palette entries are the same argument: they are what a new surface is built from. `--glass-sheen` is the newest arrival, orphaned when the hero ticker moved to `FluidBar`; `--color-glass` and `--header-blur` were orphaned when the header pill went to white glass.

**The `src/assets/abdullah/00X.jpg` originals (1.8 MB) are unimported and stay that way.** Nothing references them, so Vite never bundles them; they are the source the 640×360 strip cuts came from and are there to re-cut from — see the Assets table in §1.

---

An earlier pass on 2026-07-30 cleared this section. Everything it used to list — `Grainient.jsx` and its stylesheet, `story.png`, `zero.png`, the `.button-quiet` and `.button-reveal` variants, the `--color-raised` / `--color-navy` / `--color-surface` / `--text-5xl` / `--duration-morph` / `--shadow-gold` / `--z-modal` tokens, the vestigial `data-docked` attribute, and four stale comments — has been deleted or fixed. Lint is clean and the build passes.

**`--shadow-soft` was on that list and is NOT unused** — `About.module.css` applies it to the story circle, where it registers properly now that the section is glass rather than flat black. It was kept.

Two things that look like duplication and are deliberately not:

- **Three SVG turbulence filters** — `FluidBar.jsx`, `HeroHeader.jsx` (`#hero-cta-turbulence`) and `Header.jsx` (`#site-header-turbulence`). Structurally near-identical, every number different. (There was a fourth, `CssLens.jsx`'s `#css-lens-distortion`; it warped the disc's rim out of round and was deleted — see the lens note below.) `feTurbulence`'s `baseFrequency` is in **user-space units, not units of the element**, so a field tuned for one box size produces a visibly different texture on another — what reads as water across a 1500px strip is sandpaper on a 140px button. Sharing also saves nothing at render time, since a filter is evaluated per element it is applied to. Each carries a comment saying so; keep them separate.
- **Two `@keyframes` per animated module** — `fluid-drift` / `fluid-drift-bob` in `FluidBar.module.css`, `sheen-flow` / `edge-travel` in `Button.module.css`. All four names and bodies are distinct, and CSS Modules scopes `@keyframes` per file anyway. Nothing to hoist into `global.css`.

### The Story section's scroll-zoom was removed — 2026-07-31

The Story section scrolls normally now. Everything that pinned it and grew its circle to fill the viewport is gone, and it is gone from the source rather than merely disabled — **git history is where it lives**.

What went, so nobody hunts for it: `.stage`, `.lead`, `.runway`, `.hold` and `.founder-layer` in `About.module.css`; `position: sticky` on `.about`; `.zoom-layer`, `.media` and `.scrim` and the three `[data-zoom='on'] … { will-change }` rules; all of About's `useScroll`/`useTransform` work (`easedProgress`, `coverScale`, the counter-scales, the elliptical radius, the blur and its bleed, `--frame-scale`) and the constants that tuned it; the video-aspect measurement `loadedmetadata` fed; and CssLens's `lensOpacity`, `lensCounterScale`, `onMetadata` props with the `.lens-counter` wrapper they drove.

Consequences worth knowing:

- **`.circle` draws the circle again.** The round clip, rim, fill and shadow moved back onto it from `.zoom-layer`, which existed only to give the zoom an untransformed parent to measure. It takes `--shadow-soft` as the token, so **the project no longer duplicates a design token's numbers anywhere**.
- **`Founder` is a sibling, not a child.** It renders from `HomePage.jsx` after `<About />`, paints its own opaque `--color-black` ground, and arrives with an ordinary `whileInView` reveal. It is `position: relative` + `--z-base` for the same reason `.about` and `.placeholder` are: Hero's fixed `.backdrop` at `z-index: 0` would otherwise paint over a static in-flow section.
- **The story video's second gate changed** — see below.

### The section grounds, and why only one of them is a screen tall — 2026-07-31

`min-block-size: 100vh` is a **floor, not a height**. Both scrolling sections are centred inside that floor and both overflow it on a short window, and their backgrounds used to grow with them — About's glass was the section's own `background-color` + `backdrop-filter`, and the Founder's `<video>` and `.glass` were `inset: 0`. That meant a 16:9 source stretched over an ever-taller box, and a viewport-wide backdrop-filter re-blurring more area than a screen. Both grounds were cut to a flat `block-size: 100vh` pinned to an edge of their section — About's and WhyAgb's to the top, the **Founder's to the bottom**, because that is the edge its image has to meet WhyAgb's on.

**That was correct for the Founder and a bug for About**, and About's has been put back to the section's full height (`block-size: 100%`, with `min-block-size: 100vh` under it). The two sections differ in what a gap in the ground falls through to:

- **Founder** paints an opaque `--color-black` on `.founder` itself, so content past the first screen lands on that. Its ground can be a screen tall because the section has a floor underneath it. **Keep it at 100vh**, and keep it pinned to the block **end** — the two are what put the last row of `founder.webp` exactly on the boundary whatever height the section grows to. **WhyAgb** is the same construction mirrored: an opaque black floor, a one-screen ground pinned to the block **start**, and `object-position` cropping the far end. The two are `center bottom` and `center top` respectively and have to stay mirror images.
- **About paints no background at all**, and must not — an opaque fill on `.about` would be painted *beneath* `.about::before` and would become what the glass samples, flattening the Story effect. So whatever the panel does not cover is not dark, it is transparent, and Hero's **fixed** footage shows through it raw. On a phone the stacked layout runs ~930px against an ~844px screen, which put a ~90px band of bare, unfrosted hero video across the bottom of the Story section, immediately above the Founder — reading exactly like a fixed video that had failed to scroll away. The panel is the section's real height again.

The cost is real and accepted: on the windows where About overflows, its `backdrop-filter` covers a taller box than the viewport. Only the on-screen part is rasterised each frame, so the per-frame cost is unchanged; what grows is the region the compositor may allocate for.

**The two are built differently, and neither may take the other's form:**

- **Founder** uses two absolutely positioned layers at `z-index: -2` / `-1`, contained because `.founder` is a stacking context (`position: relative` + `--z-base`).
- **About uses `.about::before` with no z-index at all**, and `.inner` takes `position: relative` so the copy paints over it. It cannot use a negative index: that only stays inside a section that is a stacking context, and the moment `.about` has a z-index its glass is a member of *that* context rather than a box painting in document order against the hero's sticky backdrop — which is the one thing About's glass has to reach. The Founder can afford it because what its glass samples is a sibling inside the section.

### The founder's portrait is clipped by a frame, not sized by itself — 2026-07-31

A dark hairline ran down the **trailing edge** of the portrait. It was not in the source (a clean 1280×720 with a soft vignette, measured) and not a `cover` failure — the image is proportionally wider than its box, so it crops horizontally and always covered.

It was **fractional layout**. `.identity` is an `fr` track, so its width is routinely fractional (~361.6px at a 1024px window); an image at `inline-size: 100%` of that ends on a half pixel, the browser antialiases the last column, and the image's own alpha falls off across it — so the section's ground shows through. The **one-sidedness is the tell**: the track starts on a whole pixel and only its end is fractional, so only the trailing edge could produce it.

The fix is a `.portrait-frame` that carries the box the image used to have — the height clamp, the radius, `overflow: hidden` — with `.portrait` sized `calc(100% + 2px)` on both axes at `margin: -1px`. The image overhangs 1px on every side and the clip cuts through opaque pixels instead of landing on the raster's own boundary. **`max-inline-size: none` on the image is required, not tidy**: `global.css` sets `img { max-width: 100% }`, which would clamp the width straight back and silently undo it. The visible crop is unchanged to within half a percent.

The same reasoning applies to any full-width image in an `fr` track. There is exactly one on the site.

### The backdrop is `position: sticky`, scoped to a stage — 2026-07-31

**This replaced a JS visibility gate, and the replacement is the point.** Hero's `.backdrop` was `position: fixed`, which put it in the viewport's coordinate space — that is to say everywhere, for the whole length of the document — so something had to keep taking it away again. That something grew into: a `data-hidden` attribute driving `display: none`, a `sampledBelow` prop on `Hero`, a `storyGlassVisible` state on `HomePage`, and a fourth `IntersectionObserver` in `About` (`onGlassVisibilityChange`) reporting its own box at a root margin. The margin was tuned twice and was wrong in one direction or the other both times — too tight and the layer was rebuilt on the frame the glass first sampled it, too loose and a full-viewport 4K texture stayed composited well into the Founder. **All of it is deleted.**

The footage now lives in `components/Hero/HeroBackdrop.jsx` as a `position: sticky` child of `.stage` (`pages/HomePage.module.css`), a wrapper holding exactly `<Hero />` and `<About />`. A sticky box cannot be offset past its own containing block, so the stage's bottom edge — which is the Story section's bottom edge — is the boundary, as a fact of layout. There is no threshold left to get wrong.

**The arithmetic, because it is the design and one number breaks it.** With stage height `H`, backdrop height `100vh` and scroll offset `s`, the box's top is `clamp(s, 0, H - 100vh)`:

- `s ≤ H - 100vh` — the box tracks the viewport exactly. Indistinguishable from `fixed`.
- `s > H - 100vh` — the offset is capped, so the box sits at the stage's last screen and scrolls out **in lockstep with the Story content in front of it**. The two stay aligned to the pixel.
- `s = H` — the box's bottom edge is the viewport's top edge, and Founder begins. Gone, by geometry.

The travel a sticky box gets is `H - h`, and the travel this needs is `H - 100vh`. They are equal only at `h = 100vh` — **shorter and the last phase leaves Story with bare page behind it; taller and it stops tracking early, mid-Story.**

- **The 100vh of flow height it claims is given back by `.stage-content`, NOT by a margin on the backdrop.** This is the one genuine trap, it fails silently, and it was found by measuring rather than by reading. A sticky box is constrained by its containing block **deflated by the box's own margins**, so `margin-block-end: -100vh` *inflates* the constraint rect by a screen and hands the box an extra screen of travel: measured on a 1440×900 window it stayed pinned to the viewport top until 767px past the stage's bottom edge — a full viewport into the Founder, invisible only because that section is opaque. Exactly the bug this refactor exists to prevent, reintroduced by the fix for a layout detail. The negative margin lives on the sibling wrapper instead, so the backdrop's own margins stay zero. **The two values are one number in two files; each names the other.**
- **Nothing between `.backdrop` and `.stage` may take `overflow` other than `visible`, or a `transform`, `filter`, `perspective` or `contain`.** The first makes a scroll container, which becomes what the box sticks to; the rest re-scope its containing block. This is also why the backdrop could not stay inside `.hero` — that section is `overflow: hidden`, so a sticky child of it would not stick at all.
- **`.stage` and `.stage-content` must stay free of `isolation`, `opacity` and `backdrop-filter`.** Those create a backdrop root, and About's frosted ground has to reach *through* both to the footage. Either one would silently flatten the Story section to a plain dark panel.
- **Neither wrapper takes a `position` or `z-index`.** Left static and non-stacking, the backdrop (`z-index: 0`), `.hero` and `.about` (both `z-index: auto`) go on painting in document order in the root stacking context, exactly as they did under `fixed` — which is what About's `backdrop-filter` depends on to find the footage beneath itself.
- **The playback gate stays, and answers a different question.** Sticky stops the element being *seen*; it does not stop the browser decoding 4K frames. `isPastFirstViewport` still pauses at one scrolled viewport and resumes on the way back up.
- **Adding a section below the stage needs nothing — including a translucent one.** That is the whole gain over the old arrangement: there is no flag to opt into, because there is no footage down there to sample.

Measured in Brave over CDP at 1440×900 and 390×844, scrolling down and back up, the backdrop's bottom edge never once passed the stage's bottom edge (max overhang `0px`), including the narrow case where Story overflows a screen (967px against an 844px viewport) — the case the old scroll-threshold arithmetic could not express.

### Only one video decodes at a time

**Two `<video>` elements exist; at most one is ever running.** `hero.webm` in Hero, and `story.webm` in the Story circle (`CssLens`). There were three until the Founder's ground became a still image — that section carried a second `<video>` pointing at the same `story.webm`, which is why this rule needed arbitrating at all.

The rule is enforced in two different ways, and the split is deliberate:

- **Hero vs. everything below is structural.** Hero's video autoplays unconditionally and pauses at `isPastFirstViewport`; both of the others fold that same selector into their own "would I like to play" test, so neither can ask for playback while the hero still has it. There is nothing to arbitrate, and **`Hero.jsx` is not a participant in the machinery below** — nothing may pause or delay the hero.
- **Everything below the hero is arbitrated**, in `hooks/useExclusiveVideo.js` — and **there is one claimant today**, the Story circle. It had to be arbitrated while the Founder was the second: adjacent sections, each at least 100vh, so at the boundary a fifth of both was on screen and both wanted to play. Each registers a claim (a `videoRef`, a priority, a boolean intent); one module-scoped `resolve()` recomputes the whole state from all claims on every change, pauses every loser in a pass of its own, and only then plays the winner. **The registry is kept deliberately** — with one claimant it is a declarative play/pause plus the DEV assertion, and a second video ground is expected (the strong section-glass tokens exist for one), so unwinding it would mean rebuilding the hard part later.

`PLAYBACK_PRIORITY` is document order and holds **one entry**, `story: 0`. The rule that ordered it against the Founder's `founder: 1` is kept written down in that file, because it is what a second entry should be argued against rather than simply appended to: the section showing its footage *sharp* outranks one showing it under a blur and a scrim, since a frozen frame is obvious in the first and very hard to spot in the second. Freeze the one nobody can see freezing.

**The invariant is checked, not assumed.** `resolve()` ends with a `import.meta.env.DEV` assertion that reads every registered element's own `paused` flag and logs an error if more than one is running. Vite replaces the flag with `false` in a production build and the minifier drops the branch, so it costs nothing shipped — and it is why there are no temporary `console.log`s in either call site.

**No `<video>` on the site carries `autoPlay`, including the hero's.** `CssLens` never did; Hero's did, and it was removed because the attribute and the effect disagreed on exactly one case. `useScrollPosition` reads the real offset in its lazy initialiser, so on a reload part-way down the page `isHeroCovered` is already true at first render and the effect's first act is to pause — but `autoPlay` had already spent a decode on a 4K frame behind an opaque section. Playback is driven from the effect alone now, which is the same code path for every entry point. Putting `autoPlay` back on any of them reintroduces a decode nothing asked for. The Founder's also starts at **`preload="none"`**, promoted to `preload = 'auto'` + `load()` by a second `useInView` with a 400px root margin; left at the default it would start buffering during first paint, four viewports below the fold, against the hero's 3.7MB.

**The rule is one-directional: nothing may pause or delay the hero.** The hero also **starts `muted`**, and that is load-bearing rather than a preference: an unmuted autoplay without prior user activation is refused outright, and the rejection was being caught and dropped, so the backdrop simply sat on its first frame. `Hero.jsx` unmutes on the first `pointerdown`/`keydown`/`touchstart` instead — deliberately not on scroll, which is not user activation in Chrome and would burn the one shot.

**The one visible consequence, so nobody re-derives it as a bug:** About's circle reaches the screen about a third of the way down the hero, and the hero's video does not stop until a full viewport has been scrolled — so in between, the circle shows a still frame. That window cannot be closed without either two decodes or freezing the hero, and the hero is full-bleed and is what the visitor is looking at.

**There is exactly one story `<video>` per section, start to finish.** The old WebGL lens kept its footage inside the scene as a texture, so a canvas had to be swapped for a DOM element mid-scroll — which meant a second `<video>` warming up behind the first and a playhead seek at the swap. All of it (the priming window, the handoff effect, the pair of video refs) went with `FluidLens`.

### Always-on animation is paused when nothing can see it

Four CSS animations are infinite, and every one of them used to run from first paint until the tab closed regardless of where the page was scrolled. Three are now gated; the mechanism is an **attribute on an ancestor**, because CSS Modules hashes class names per file and the pausing component is never the one that owns the stylesheet.

| Animation | Gated by | Why it was worth it |
| --- | --- | --- |
| `FluidBar`'s three drifting layers | `data-offscreen` on `.hero` | They sit under `filter: url(#fluid-bar-turbulence)`, and **a transform beneath a filtered ancestor cannot be composited** — every frame re-ran `feDisplacementMap` across the whole strip. The most expensive idle on the site. |
| `.button-featured::after`'s rim light | `data-offscreen` on `.hero` | Animates a registered custom property into a conic-gradient behind two masks composited with `xor`: every frame is a full re-raster, not a compositor transform. |
| `LogoLoop`'s track | `data-paused` — its own `IntersectionObserver` (or a `paused` prop, which no caller passes today) | A `will-change` layer holding a dozen photographs. The observer is enough now that Founder is an ordinary in-flow section; the prop existed because the pinned Founder kept the strip geometrically on screen at `opacity: 0`, where an observer sees nothing wrong. |
| `.button-glass`'s two sheens | **nothing — left running** | Two small pseudo-elements animating `transform` with no filtered ancestor, so they genuinely are compositor work. Gating them would mean freezing a sheen that is partly on screen. |
| WhyAgb's three wordmark tracks | **nothing — left running** | Same category as the sheens, and the reason is the category rather than the size: `transform` only, no filtered ancestor, no `will-change` (an infinite animation never reaches the rule that would drop the hint, and Chromium promotes an animating transform on its own). The tracks are wide — roughly 5,700px each at 1280 — but a compositor only rasterises tiles near the viewport, so off screen this ticks without raster work. If it ever does need gating, the mechanism is LogoLoop's `data-paused` observer, not a scroll threshold. |

Every pause is `animation-play-state: paused`, never `animation: none` — the layers keep their offsets against each other and resume where they stopped, so nothing resyncs into a visible jump. Each also drops its `will-change` in the same rule: the hint is a promise about imminent motion, and on a stopped element it is a compositor layer held for nothing.

### The lens is a div now — what that bought, and what it cost

`shared/CssLens.jsx` replaced `shared/FluidLens.jsx`, and with it the entire WebGL stack came out of the project. What was there: an R3F `<Canvas>`, the story video as a `VideoTexture` on a frustum-filling plane, a lens mesh fetched from `lens.glb`, and drei's `MeshTransmissionMaterial` — which computes refraction by **re-rendering the whole scene into an offscreen buffer every frame** and sampling it through a per-channel offset. For one circle, on one section, on one page.

**The honest difference, so nobody files it as a regression.** Transmission bent the *footage*: the video visibly warped behind the glass with real chromatic dispersion. **Nothing in CSS can do that.** `filter` applies to the element it is set on, not to what is behind it, and `backdrop-filter` only takes blur-and-colour operations — none of them can displace a pixel sideways. Warping the video itself needs either WebGL or a second decoded copy of it inside the disc, and the second copy is exactly the simultaneous decode the section above forbids.

So CssLens is a **lit** glass disc rather than a refracting one, and each part is doing a distinct job:

- `backdrop-filter: blur(--lens-blur) saturate(--lens-saturate)` — the only part that touches the footage, and the whole per-frame cost of the effect. The blur is **10px**, where it was 1px: at 1px the disc was a faint highlight over a sharp picture and read as a smudge on the glass rather than as glass. The `saturate()` is not decoration — blur averages colour toward grey, and putting it back is the difference between frosted glass and a grey smear.
- `--lens-tint` (flat white at 0.04) with a soft radial highlight over it — the pane's body, and the light sitting *on* it. Against a 10px blur the highlight has to stay gentle or it reads as a white blob.
- **one inset shadow, and no outer one.** A drop shadow would say the disc floats above the picture; a faint shadow cast inward from the top rim says the glass has thickness.

**It is a perfect circle, and that is a rule now.** It carried `filter: url(#css-lens-distortion)` — two octaves of SVG turbulence pushing the rim and the highlight out of true. The intent was an organic material; what it produced was an outline that wobbled, read as elliptical at some positions, and changed with the element's size, because `feTurbulence`'s `baseFrequency` is in user-space units. That filter and its inline `<svg>` are gone. **Texture may go in the disc's fill (a noise `background-image`); it may never go in a `filter` that can move the edge.** Two `::before`/`::after` copies offset 1.5px and tinted warm and cool, standing in for the WebGL lens's chromatic dispersion, went with it — at a 10px backdrop blur there is no sharp edge left for a fringe to split.

Three constraints in the file are load-bearing and easy to undo:

- **The follow loop stops when the disc arrives.** A `requestAnimationFrame` that ends at sub-pixel distance from its target, rather than one that runs forever or on a timer. A disc resting under a still cursor costs nothing.
- **Which means `About` has to restart it.** The section-wide mousemove is the only thing that knows the target moved, so it calls the `wakeRef` handle CssLens fills in. Remove that call and the disc stops following after its first rest.
- **The lerp is frame-rate corrected.** `FOLLOW_LERP` is a per-60fps-frame fraction raised to `delta * 60`; a flat multiply would run twice as many steps per second on a 120Hz display and halve the weight of the follow.

The disc mounts and unmounts on `showLens` alone — wide enough, and motion allowed. It used to also be dropped mid-scroll at `LENS_DROP_AT`, which went with the zoom. The video is a **sibling** of the disc inside CssLens, not a child, so `showLens` flipping on a resize never interrupts playback.

### Two more things that are load-bearing and expensive

- **Three viewport-wide `backdrop-filter`s**, `.about`'s, `.founder`'s `.glass` and now `.why`'s, and together they are the most expensive thing in the project. All three stay — the glass *is* those sections' surface (§2). `--section-glass-blur` is the dial, not the fill. They are never both fully on screen but they do overlap at the section boundary, so for part of one scroll both are live. **The two are not equally necessary:** About's has to reach outside itself, through the document to the hero's *fixed* footage, and `backdrop-filter` is the only mechanism that can; Founder's only has a sibling `<video>` behind it, so it could be `filter: blur()` on that video plus a flat fill here for less, at the same visual result. It is written to match About because one glass idiom is worth more than the saving until the saving is measured. That is the first thing to change if the Founder ever feels heavy. **WhyAgb's is the same case as the Founder's and exists for the same two reasons** — it holds the copy off a photograph with a lit wordmark through the middle of it, and it makes its side of the Founder boundary the same material as the other side. It is the light pair (7px, not 20), so it is the cheap variant; but swapping either of the two closing panes for `filter: blur()` on its own image means inflating that image past its box, which changes its rendered width — and equal rendered width is what the seam between them depends on. Change them together or not at all.
- **`body::after`'s `mix-blend-mode: soft-light`** forces the whole page into one blended group. It is what keeps the grain from lifting `--color-black` (§2) and it is not animated, so there is nothing to gate — a `will-change` hint would not make the blend cheaper.

**No layout reads on the pointer path.** `About`'s pointer handler caches `.circle`'s rect and marks it stale from a passive `scroll` listener rather than calling `getBoundingClientRect()` per event — a high-polling mouse fires above the display's refresh rate, and it was flushing layout on every one of them. Anything added here should keep that property: nothing transforms `.circle`, so its box only moves on scroll and resize.

**Naming:** "About" and "the Story section" mean the same component throughout the codebase — the directory is `components/About/`, the `id` is `about`, and the visible title is "Our **Story**". Both names appear in comments; neither is wrong.

Keep this section honest. If something becomes unreferenced, list it here rather than deleting it silently, and note whether it is dead by accident or held on purpose.
