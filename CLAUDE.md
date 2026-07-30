# CLAUDE.md — AGB Media

Single source of truth for every task in this repository. Read this before writing any code.

---

## 1. Project Overview

- **Project:** AGB Media — portfolio website for a TV & artistic production company (agb-media.net).
- **Stack:** React 19 + Vite 8, React Router 7, Framer Motion, react-icons.
- **Language:** **English throughout, LTR.** All user-facing copy, code, comments, and identifiers are English. There is **no Arabic anywhere in this project** — do not add Arabic copy, Arabic fonts, or RTL handling.
- **Document direction:** `<html lang="en" dir="ltr">` is set in `index.html`.
- **CSS direction:** keep writing **logical properties** (`inset-inline`, `margin-inline`, `padding-inline-start`, `border-inline-end`). Under LTR they resolve to left/right at no cost, and they keep the layout direction-agnostic. `left`/`right` are acceptable where a value is genuinely visual, but prefer the logical form for consistency with existing code.

---

## 2. Design System

### Colors

All colors live as CSS custom properties in `src/styles/variables.css`. **Never hardcode a color in a component.**

| Token | Value | Role |
| --- | --- | --- |
| `--color-black` | `#010101` | Near-true-black, exactly neutral — all three channels equal, no steel, slate, or blue lean. **The one and only background colour on the site**, for every section. The lineage runs `#0C0F14` → `#1B1D20` → `#131315` → `#070708` → `#0B0B0C` → `#050505` → `#030303` → here; the early values were set while the grain overlay was still adding luminance on top of them, so the page rendered lighter than its token. The grain has blended in soft-light since `#131315`, so this value is what reaches the screen. **This is the final ground tone — the token is settled and takes no further adjustment.** |
| `--color-raised` | `#090909` | The ground lifted just enough to separate a surface from it — an 8-point step, same neutral hue. **Retune this whenever `--color-black` moves**, so the lift stays deliberate and never drifts far enough to read as grey. Currently unreferenced — the reveal button paints its panels in `--color-black` on purpose. |
| `--color-gold` | `#C97014` | **Signature accent**, sampled from the logo's midtone. Headings, highlights, borders, interactive states. |
| `--color-gold-light` | `#E09A3C` | Hover / focus / raised state of the accent. |
| `--color-gold-deep` | `#8F2804` | Rust from the logo's lower band. Gradient endpoint only. |
| `--color-navy` | `#0A0E1A` | Very dark navy. **Unused, and out of step with the palette** — lighter than `--color-black` and distinctly bluer, where everything else has settled on neutral. Retune or delete it before using it; `--color-raised` is the neutral lift to reach for instead. |
| `--color-text` | `#F5F5F0` | Warm off-white. Body text. |
| `--color-text-muted` | `rgba(245,245,240,0.65)` | De-emphasized text. |

The gold was sampled directly from `/public/assets/images/agb-logo.png`. Do not re-derive it.

### Translucent surfaces — one tone, no seams

`--color-glass` (0.5), `--color-overlay` (0.72), and `--color-scrim` (0.25) are all `--color-black` at an alpha, written out as literal `rgba(1, 1, 1, …)` because CSS cannot derive an alpha from a hex token. **They must be edited by hand whenever `--color-black` changes** — all four values move together, `theme-color` in `index.html` is a fifth copy, and `--color-raised` needs retuning as a sixth.

**Never darken a surface with raw black** (`#000`, `rgba(0,0,0,…)`) — reach for one of these three, or add a fourth at the alpha you need. Pure black is both deeper and less cool than the ground tone, so a raw-black tint over one section leaves a visible step where it meets the next. The site is one tone end to end.

Shadows are the exception: `--shadow-soft` is legitimately black-based, because a shadow tinted to the surface it falls on stops reading as a shadow.

### Section boundaries over the hero backdrop

The hero's video backdrop is `position: fixed`, so every section below it scrolls *over* the footage. Sections meet that footage **directly** — flat colour against video, with no gradient band, shadow, or any other treatment easing the join. An earlier pass faded the `About` edge with a gradient band and it was removed deliberately; **do not reintroduce one.**

### Background noise

A subtle film-grain overlay is applied globally via `body::after` in `global.css` (SVG `feTurbulence`, `--noise-opacity: 0.03`). It is `position: fixed`, `inset: 0`, `pointer-events: none`. A `.noise-overlay` utility class exists for applying the same texture to an individual surface.

It blends with **`mix-blend-mode: soft-light`, and that is load-bearing.** feTurbulence emits light, semi-transparent noise; under the default normal blend it could only *add* luminance, which lifted the rendered background ~3 points above `--color-black` and made the whole site read lighter than its own token. soft-light pivots around mid-grey, so the texture arrives at roughly net-zero luminance. **Do not return either grain layer to a normal blend** — it silently invalidates the ground colour. Because the grain can no longer lift the base, `--noise-opacity` may go well above the old `0.06` ceiling; on a ground this dark, soft-light compresses the texture hard, so it is very subtle at `0.03`.

### Buttons — one definition

**`src/components/shared/Button.module.css` is the only place a button is styled.** **Never restyle a button inside a section module** — add a variant beside the existing ones instead.

A call site applies the base **and exactly one variant**, plus a local class carrying *only* spacing:

| Classes | Look | Used by |
| --- | --- | --- |
| `.button .button-featured` | **Solid `--color-gold` fill**, `--radius-md` corners, near-black label; hover brightens to `--color-gold-light` | Hero header — the nav's own "Contact" entry |
| `.button .button-quiet` | Gold hairline pill, transparent; hover warms the interior with `--color-gold-veil` and steps edge + label to `--color-gold-light` | *unused today* |
| `.button .button-reveal` | Rectangular; sliding-panel reveal hover | About — "Discover Our Story" |

```jsx
className={`${buttonStyles.button} ${buttonStyles['button-featured']} ${styles.cta}`}
```

**`.button-featured` is the site's one filled button** — every other button is an outline on transparent, and that contrast is the entire point of it. **Never add a second filled call to action**; a second one cancels the emphasis. Reach for `.button-quiet` or `.button-reveal` instead.

Its label is `--color-black` rather than white on purpose: near-black on this gold is 5.8:1 at rest and 9.3:1 on hover, both clearing WCAG AA for normal text, where white would be about 3.6:1 and fail. Its hover is a colour change only, never a lift — see the transform note below.

**The two outlined variants differ because the surfaces do.** An outline over moving footage must stay understated rather than compete with it; the flat, quiet Story section can carry the louder mechanic. A new surface means a new variant here, not a button styled in a component.

- **Layout is not the button's business.** Nothing in this file sets a margin — where a button sits is the calling section's decision.
- **`.button-reveal`'s mechanic:** at rest two `--color-black` panels (`::before`, `::after`) cover the button *including its border*, so only the gold label shows. On hover the large panel slides up (`translateY(-25px)`) and collapses its height to `0`, while the thin top strip wipes out with `scaleX(0)` on a `0.15s` delay — uncovering the gold outline and leaving the interior transparent. Revealed, not filled. Because the panels are `--color-black` they merge into a flat section; over footage they would read as a dark block, which is the other half of why the hero uses `.button-quiet`.
- **Transforms belong on the pseudo-elements, never on the button element.** Both call sites are `motion.create(Link)` and Framer writes `transform` inline on the anchor; an inline transform on the host does not reach `::before`/`::after`, which is exactly why the reveal is safe here. For the same reason `.button`'s `transition` is scoped to colour properties and must never be `transform` or `all` — that would smooth over Framer's own per-frame animation and make the entrance drag.
- **No `overflow: hidden` on `.button-reveal`.** The panels overhang the box and slide beyond it; clipping destroys the effect. `isolation: isolate` provides the stacking context so `.button-reveal > *` (label *and* icons) rides above the panels at `z-index: 3`. It is rectangular for the same reason — a sliding rectangular panel cannot mask a rounded outline without clipping, which is why the pill radius lives on `.button-quiet` rather than the base.
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
    shared/           # reusable primitives (Button, Section, Container…)
  pages/              # route-level components
  styles/
    variables.css     # design tokens ONLY
    global.css        # reset, base element styles, noise overlay
  hooks/
  data/               # static content (copy, project lists)
    navLinks.js       # the nav model, shared by BOTH headers
  assets/
    images/
    videos/
public/
  assets/images/agb-logo.png
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

Two things about that flag are load-bearing. It lives at **module scope**, not in state — and note `HeroHeader` is re-rendered on every frame of a scroll, because its parent `Hero` watches `viewportProgress` to gate video playback, which is why the flag is read once into a `useRef` rather than read inline — a mount-triggered animation cannot be retriggered by scrolling, but any remount replays it from the top (routing away and back is the obvious case), and a flag inside the component would be reset by exactly that. And it latches on **animation completion, not on mount** — StrictMode deliberately mounts, unmounts and remounts every component in development, so a mount-latched flag would be set by that throwaway first mount and would suppress the entrance before anyone saw it.

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

**The handoff is a single threshold: `viewportProgress >= 1` from `useScrollPosition`.** The hero is exactly `100svh`, so one scrolled viewport *is* the end of the hero. That same comparison already gated the hero's video playback in `Hero.jsx`, and `Header.jsx` now reuses it verbatim to decide whether it is hidden — **keep them identical**, or the site header will arrive a frame out of step with the video pausing.

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

`react` · `react-dom` · `react-router-dom` · `framer-motion` · `react-icons` · `ogl`

`ogl` is the WebGL layer behind `components/shared/Grainient.jsx` (the hero's animated gradient backdrop) and is used for nothing else. Framer Motion remains the only animation library for anything in the DOM — see §4 Motion.

`tailwindcss` and `@tailwindcss/vite` remain in `package.json` but are **disconnected from the build**. They can be uninstalled by the user at any time.
