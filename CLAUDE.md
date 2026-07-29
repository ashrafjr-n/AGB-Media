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
| `--color-black` | `#000000` | Pure black. The dominant background. |
| `--color-black-rich` | `#150802` | Rich black — pure black with a trace of the logo's rust. **Type only, never a surface**; use where flat `#000` reads washed out over footage (the hero wordmark). |
| `--color-gold` | `#C97014` | **Signature accent**, sampled from the logo's midtone. Headings, highlights, borders, interactive states. |
| `--color-gold-light` | `#E09A3C` | Hover / focus / raised state of the accent. |
| `--color-gold-deep` | `#8F2804` | Rust from the logo's lower band. Gradient endpoint only. |
| `--color-navy` | `#0A0E1A` | Very dark navy. Card backgrounds, section separators, secondary surfaces. **Used sparingly — never dominant.** |
| `--color-text` | `#F5F5F0` | Warm off-white. Body text. |
| `--color-text-muted` | `rgba(245,245,240,0.65)` | De-emphasized text. |

The gold was sampled directly from `/public/assets/images/agb-logo.png`. Do not re-derive it.

### Background noise

A subtle film-grain overlay is applied globally via `body::after` in `global.css` (SVG `feTurbulence`, opacity `--noise-opacity: 0.04`). It is `position: fixed`, `inset: 0`, `pointer-events: none`. A `.noise-overlay` utility class exists for applying the same texture to an individual surface.

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

Framer Motion is the only animation library. Section reveals use `whileInView` with `viewport={{ once: true, amount: 0.3 }}` so content animates in a single time on first scroll-in.

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
