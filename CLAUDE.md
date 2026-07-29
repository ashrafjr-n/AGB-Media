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
| `--color-black` | `#050505` | Near-true-black, exactly neutral — all three channels equal, no steel, slate, or blue lean. **The one and only background colour on the site**, for every section. The lineage runs `#0C0F14` → `#1B1D20` → `#131315` → `#070708` → `#0B0B0C` → here; the early values were set while the grain overlay was still adding luminance on top of them, so the page rendered lighter than its token. The grain has blended in soft-light since `#131315`, so this value is what reaches the screen. **This is the final ground tone — the token is settled and takes no further adjustment.** |
| `--color-raised` | `#0D0D0D` | The ground lifted just enough to separate a surface from it — an 8-point step, same neutral hue. **Retune this whenever `--color-black` moves**, so the lift stays deliberate and never drifts far enough to read as grey. Currently unreferenced — the reveal button paints its panels in `--color-black` on purpose. |
| `--color-gold` | `#C97014` | **Signature accent**, sampled from the logo's midtone. Headings, highlights, borders, interactive states. |
| `--color-gold-light` | `#E09A3C` | Hover / focus / raised state of the accent. |
| `--color-gold-deep` | `#8F2804` | Rust from the logo's lower band. Gradient endpoint only. |
| `--color-navy` | `#0A0E1A` | Very dark navy. **Unused, and out of step with the palette** — lighter than `--color-black` and distinctly bluer, where everything else has settled on neutral. Retune or delete it before using it; `--color-raised` is the neutral lift to reach for instead. |
| `--color-text` | `#F5F5F0` | Warm off-white. Body text. |
| `--color-text-muted` | `rgba(245,245,240,0.65)` | De-emphasized text. |

The gold was sampled directly from `/public/assets/images/agb-logo.png`. Do not re-derive it.

### Translucent surfaces — one tone, no seams

`--color-glass` (0.5), `--color-overlay` (0.72), and `--color-scrim` (0.25) are all `--color-black` at an alpha, written out as literal `rgba(5, 5, 5, …)` because CSS cannot derive an alpha from a hex token. **They must be edited by hand whenever `--color-black` changes** — all four values move together, `theme-color` in `index.html` is a fifth copy, and `--color-raised` needs retuning as a sixth.

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
| `.button .button-quiet` | Gold hairline pill, transparent; hover warms the interior with `--color-gold-veil` and steps edge + label to `--color-gold-light` | Hero — "Contact Us" |
| `.button .button-reveal` | Rectangular; sliding-panel reveal hover | About — "Discover Our Story" |

```jsx
className={`${buttonStyles.button} ${buttonStyles['button-quiet']} ${styles['contact-button']}`}
```

**Two variants because the surfaces differ.** The hero's button sits on moving footage and must stay understated rather than compete with it; the Story section is flat and quiet, so it can carry the louder mechanic. A new surface means a new variant here, not a button styled in a component.

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
    shared/           # reusable primitives (Button, Section, Container…)
  pages/              # route-level components
  styles/
    variables.css     # design tokens ONLY
    global.css        # reset, base element styles, noise overlay
  hooks/
  data/               # static content (copy, project lists)
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

**The hero's entrance is different, and deliberately so:** it is mount-triggered (`initial`/`animate`, never `whileInView`) because it should fire on page load rather than on scroll-in, and it must play **once per session**. `Hero.jsx` guards it with a module-scoped `entrancePlayed` flag; when set, `rise()` returns no animation props at all, so elements render in their natural resting state with no `initial` to animate back from.

Two things about that flag are load-bearing. It lives at **module scope**, not in state — a mount-triggered animation cannot be retriggered by scrolling, but any remount replays it from the top (routing away and back is the obvious case), and a flag inside the component would be reset by exactly that. And it latches on **animation completion, not on mount** — StrictMode deliberately mounts, unmounts and remounts every component in development, so a mount-latched flag would be set by that throwaway first mount and would suppress the entrance before anyone saw it.

**Every Framer Motion animation must gate on `useReducedMotion()`.** The `@media (prefers-reduced-motion: reduce)` block in `global.css` governs **CSS** animations and transitions only — it has no effect on animations Framer Motion drives inline through JS. When the hook returns `true`, render the element in its final state with no transform. See `About.jsx` for the established pattern.

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
