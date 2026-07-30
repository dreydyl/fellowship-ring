# Solid Ground — Design System & Implementation Guide

A faith-based confession and recovery accountability web app. Mobile-first. Warm, grace-filled, non-judgmental.

---

## Table of Contents

1. [Project Setup & Dependencies](#1-project-setup--dependencies)
2. [Design Tokens & Theme](#2-design-tokens--theme)
3. [Typography](#3-typography)
4. [Global CSS & Tailwind Configuration](#4-global-css--tailwind-configuration)
5. [Application Shell & Routing](#5-application-shell--routing)
6. [Component Library](#6-component-library)
   - [Header](#header)
   - [AboutDropdown](#aboutdropdown)
   - [GuidanceCard](#guidancecard)
   - [Section / Field (Account)](#section--field-account)
   - [UrgeDots](#urgedots)
   - [ThreeCrosses SVG](#threecrosses-svg)
   - [SpinIcon](#spinicon)
7. [Pages](#7-pages)
   - [Home Page](#home-page)
   - [Account Page](#account-page)
   - [History Page](#history-page)
   - [Entry View Page](#entry-view-page)
8. [Interactions, Animations & Transitions Reference](#8-interactions-animations--transitions-reference)
9. [Data Model](#9-data-model)
10. [Extending the App](#10-extending-the-app)

---

## 1. Project Setup & Dependencies

### Toolchain

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22.x (via `.mise.toml`) | Runtime |
| pnpm | 9.x | Package manager |
| Vite | 8.x | Build tool & dev server |
| TypeScript | 5.7 | Type safety |
| React | 19 | UI framework |
| Tailwind CSS | v4 | Utility styling |

### Installing the baseline

```bash
# Install all dependencies (already in package.json)
pnpm install
```

### Adding future libraries

When adding new runtime libraries, install with pnpm and import from the package root:

```bash
# Example: adding recharts for a more elaborate severity chart
pnpm add recharts

# Example: adding framer-motion for richer page transitions
pnpm add framer-motion

# Example: adding a date formatting library
pnpm add date-fns
```

Before using any unfamiliar package, confirm the import path from its `package.json` `exports` field or its TypeScript types. Do not guess import paths.

### Dev server

The Vite dev server runs on the port stored in `$PORT` (default 8443). Hot module replacement is active — changes to any `src/` file reflect immediately without a full page reload.

```bash
pnpm dev   # start dev server
pnpm build # production build
```

---

## 2. Design Tokens & Theme

All color tokens are defined as CSS custom properties on `:root` in `src/index.css`. Use these everywhere — never scatter raw hex values across components.

```css
:root {
  /* Primary palette */
  --sg-teal:       #2bbfb0;   /* Primary brand color — header BG, links, focus rings */
  --sg-teal-dark:  #1fa89a;   /* Hover state for teal surfaces */
  --sg-teal-deep:  #197e75;   /* Active / pressed teal */

  /* Action */
  --sg-green:      #3dbf7e;   /* Submit button, positive confirmations */
  --sg-green-dark: #2da86c;   /* Hover state for green buttons */

  /* Surfaces */
  --sg-white:      #ffffff;
  --sg-surface:    #f7fffe;   /* App background — very slightly tinted, not pure white */

  /* Text */
  --sg-text:       #1a3835;   /* Body copy — dark teal-black */
  --sg-text-muted: #5a8480;   /* Labels, captions, placeholders */

  /* Structure */
  --sg-border:     rgba(43, 191, 176, 0.18);  /* Card borders, dividers */

  /* Font stacks (see Typography section) */
  --font-display:  'Nunito', sans-serif;
  --font-body:     'Open Sans', sans-serif;
}
```

### Color usage rules

| Token | Use |
|-------|-----|
| `--sg-teal` | Header background, interactive links, focus borders, icon fill, active nav underlines |
| `--sg-teal-dark` | Hover background on teal surfaces; `onMouseLeave` targets |
| `--sg-green` | Primary CTA buttons (Submit & Receive Guidance, Save) |
| `--sg-green-dark` | CTA button hover state |
| `--sg-surface` | Page background (`body`, `html`, `#root`) |
| `--sg-white` | Card / panel backgrounds |
| `--sg-text` | All readable body text |
| `--sg-text-muted` | Secondary labels, helper text, captions |
| `--sg-border` | All card borders, section dividers |

### Severity color scale

Severity scores (1–5) use their own dedicated color ramp. Always pull from this array by index:

```ts
const severityColors = ['', '#3dbf7e', '#5cc98a', '#f0a500', '#e07340', '#d94f4f']
//                       ↑ empty slot so index 1 = Minimal, 5 = Severe
const severityLabels  = ['', 'Minimal', 'Mild', 'Moderate', 'Significant', 'Severe']
```

### Urge intensity color scale

Urge (1–5) uses a similar ramp but with a slightly different progression (urge starts brighter green):

```ts
function urgeColor(v: number): string {
  if (v <= 1) return '#3dbf7e'
  if (v <= 2) return '#5cc98a'
  if (v <= 3) return '#f0a500'
  if (v <= 4) return '#e07340'
  return '#d94f4f'
}
```

### Alpha tinting convention

When you need a tinted background version of a color for badges or subtle panels, append a two-digit hex opacity to the hex value:

```ts
// 10% opacity tint of severityColors[n]
backgroundColor: `${severityColors[n]}18`  // 0x18 ≈ 9.4%
backgroundColor: `${urgeColor}18`
// Slightly more visible tint for hover
backgroundColor: 'rgba(43,191,176,0.06)'
```

---

## 3. Typography

### Font families

Two Google Fonts are used. They are imported at the top of `src/index.css` (before any other CSS):

```css
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap');
```

| Role | Family | Weights used |
|------|--------|-------------|
| Display / headings | **Nunito** | 500, 600, 700, 800, 900 |
| Body / reading copy | **Open Sans** | 400, 500, 600 |

**Nunito** is a rounded humanist sans — warm, approachable, not clinical. It carries all headings, labels, navigation items, button text, and field labels.

**Open Sans** is used for longer-form reading copy: confession body text, AI guidance paragraphs, prayer text. Its slightly wider letterforms improve legibility at the small sizes used inside cards.

### Applying fonts in JSX

The two font stacks are wired as Tailwind utility classes via `src/index.css`:

```css
.font-display { font-family: var(--font-display); }
.font-body    { font-family: var(--font-body); }
```

Apply them in JSX:

```tsx
// Headings, labels, buttons — always Nunito
<h1 className="font-display font-900 text-4xl">Solid Ground</h1>
<button className="font-display font-800 text-base">Submit</button>
<label className="font-display font-700 text-sm">Field label</label>

// Reading copy, confessions, guidance text — Open Sans
<p className="font-body text-sm leading-relaxed">The confession text…</p>
<p className="font-body italic">AI encouragement quote…</p>
```

### Type scale

| Use | Size | Weight | Family |
|-----|------|--------|--------|
| Page title | `text-4xl` (36px) | 900 | display |
| Section heading | `text-2xl` (24px) | 900 | display |
| Card heading | `text-xl` (20px) | 800 | display |
| Sub-heading / section label | `text-base` (16px) | 800 | display |
| Nav / button text | `text-sm` (14px) | 700–800 | display |
| Body copy | `text-sm` (14px) | 400 | body |
| Label / caption | `text-xs` (12px) | 600–700 | display |
| Uppercase section labels | `text-xs` + `tracking-wider` + `uppercase` | 700 | display |

---

## 4. Global CSS & Tailwind Configuration

### `src/index.css` — full structure

```css
/* 1. Google Font imports — MUST come first */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap');

/* 2. Tailwind CSS v4 import */
@import 'tailwindcss';

/* 3. Extended Tailwind color tokens (optional, for IntelliSense) */
@theme inline {
  --color-teal-500: #13b3a8;
  /* … etc */
}

/* 4. CSS custom properties */
:root { /* all --sg-* tokens */ }

/* 5. Global reset */
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; padding: 0; }

/* 6. Body defaults */
body {
  font-family: var(--font-body);
  background-color: var(--sg-surface);
  color: var(--sg-text);
  -webkit-font-smoothing: antialiased;
}

/* 7. Scrollbar styling */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(43,191,176,0.3); border-radius: 2px; }

/* 8. Font utility classes */
.font-display { font-family: var(--font-display); }
.font-body    { font-family: var(--font-body); }

/* 9. Range input styling */
input[type='range'] { … }
input[type='range']::-webkit-slider-thumb { … }
input[type='range']::-moz-range-thumb { … }
```

### Range input dynamic fill

The range slider fill is driven by a CSS custom property `--range-pct` that is updated via inline style in React:

```tsx
// Compute percentage from value
const pct = ((urge - 1) / 4) * 100

// Pass to the input via inline style
<input
  type="range"
  style={{ ['--range-pct' as string]: `${pct}%` }}
/>
```

The CSS uses this to paint the filled track:

```css
input[type='range'] {
  background: linear-gradient(
    to right,
    var(--sg-teal) 0%,
    var(--sg-teal) var(--range-pct, 50%),
    #c8eae7 var(--range-pct, 50%),
    #c8eae7 100%
  );
}
```

### Tailwind v4 notes

This project uses **Tailwind CSS v4** (not v3). Key differences:
- No `tailwind.config.ts` is needed; configuration lives in `src/index.css` via `@theme inline { … }`.
- Import via Vite plugin (`@tailwindcss/vite`) configured in `vite.config.ts` — no PostCSS setup required.
- Custom color tokens added to `@theme inline` become available as Tailwind utility classes (e.g. `--color-teal-500` → `bg-teal-500`).

---

## 5. Application Shell & Routing

The app uses **client-side state routing** — no react-router. Page navigation is managed by a single `page` state variable in `App.tsx`. This keeps the bundle small and avoids hash/history complexity for an app that doesn't need deep-linking yet.

### State shape in `App.tsx`

```ts
// Page identifiers
type Page = 'home' | 'account' | 'history' | 'entry'

// A single confession entry
interface Entry {
  id: string
  date: string          // ISO 8601
  confession: string
  urgeIntensity: number // 1–5
  aiGuidance?: {
    encouragement: string
    readingPlan: string[]  // e.g. ['Psalm 34:18', 'Romans 8:38-39']
    prayer: string
    severityLevel: number  // 1–5
    severityLabel: string  // e.g. 'Moderate'
  }
}

// A single severity snapshot
interface SeverityRecord {
  date: string           // YYYY-MM-DD
  score: number          // 1–5
  type: 'self-reported' | 'recommended'
}
```

### Navigation function

```ts
const navigate = (p: Page, entryId?: string) => {
  if (entryId) setSelectedEntryId(entryId)
  setPage(p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
```

Always pass `navigate` down as a prop. Never import `navigate` from a global store — keep data flow explicit so each page can be independently reasoned about.

### Adding a new page

1. Create `src/pages/NewPage.tsx` with a default export.
2. Add the new page key to the `Page` type in `App.tsx`.
3. Add `{page === 'newpage' && <NewPage navigate={navigate} />}` inside `<main>` in `App.tsx`.
4. Add a nav entry in `Header.tsx`.

---

## 6. Component Library

### Header

**File:** `src/components/Header.tsx`

**Purpose:** Persistent navigation bar, sticky at the top of every page. Contains the brand lockup, desktop nav links, the About dropdown, and a mobile hamburger menu.

**Props:**
```ts
interface Props {
  currentPage: Page
  navigate: (p: Page) => void
}
```

**Layout:** `position: sticky; top: 0; z-index: 50`. Height is 56px (`h-14`). Background: `var(--sg-teal)`. Max content width: `max-w-2xl mx-auto`.

**Desktop nav** (visible at `sm:` breakpoint and above):
- Home, History, Account as text buttons
- About as a dropdown trigger (see `AboutDropdown`)
- Active page indicated by a white underline bar (`position: absolute; bottom: -2px; height: 2px; border-radius: full; background: white; opacity: 0.7`)
- Inactive color: `rgba(255,255,255,0.72)` → hover/active: `white`
- Font: `font-display font-600 text-sm`
- Transition: `color` at `150ms`

**Mobile hamburger** (visible below `sm:` breakpoint):
- Three `span` bars, each `w-5 h-0.5 bg-white rounded`
- Animation: top bar rotates `45deg`, middle fades out (`opacity-0`), bottom rotates `-45deg` when open
- Driven by `mobileMenuOpen` boolean state
- CSS: `transition-all duration-200`

**Mobile menu panel** (conditionally rendered below header):
- Background: `var(--sg-teal-dark)`, top border: `1px solid rgba(255,255,255,0.12)`
- Contains nav buttons + About sub-items as a flat list
- Closes on any navigation action

**CrossIcon SVG** (inside brand lockup):
```tsx
// 18×22 viewport, two rounded-rect bars forming a cross
<rect x="7.5" y="0" width="3" height="22" rx="1.5" fill="white" opacity="0.9" />  // vertical
<rect x="0"   y="5" width="18" height="3" rx="1.5" fill="white" opacity="0.9" />  // horizontal
```

---

### AboutDropdown

**File:** `src/components/Header.tsx` (inline, not extracted)

**Purpose:** Flyout menu from the About nav button. Three static info links.

**Behavior:**
- Opens/closes on button click (`open` boolean state, `useState`)
- Closes on outside click — wired with `useEffect` + `document.addEventListener('mousedown', handler)`; the handler checks `ref.current.contains(e.target)` to ignore clicks inside the dropdown

**Positioning:** `position: absolute; right: 0; top: 100%; margin-top: 8px`

**Card styles:**
```css
background: white;
border: 1px solid rgba(43,191,176,0.15);
border-radius: 1rem;  /* rounded-2xl */
box-shadow: 0 10px 40px rgba(0,0,0,0.1);  /* shadow-xl */
```

**Item hover:** `backgroundColor: 'rgba(43,191,176,0.06)'` on `mouseenter`, cleared on `mouseleave`

**Chevron animation:** `rotate-180` class toggled when `open === true`, with `transition-transform duration-200`

---

### GuidanceCard

**File:** `src/pages/EntryViewPage.tsx` (inline)

**Purpose:** Consistent wrapper for each piece of AI guidance content on the Entry View page.

**Props:**
```ts
interface Props {
  icon: React.ReactNode   // SVG icon shown at top-left of card header
  label: string           // Section label text
  accentColor: string     // CSS color string for the label
  children: React.ReactNode
}
```

**Structure:**
```tsx
<div className="rounded-3xl p-5 mb-4 shadow-sm"
     style={{ backgroundColor: 'white', border: '1px solid var(--sg-border)' }}>
  <div className="flex items-center gap-2 mb-3">
    {icon}
    <span className="text-xs font-display font-700 uppercase tracking-wider"
          style={{ color: accentColor }}>
      {label}
    </span>
  </div>
  {children}
</div>
```

**Spacing:** `rounded-3xl` (24px radius), `p-5` (20px padding), `mb-4` between cards, `shadow-sm` for lift.

**When to use:** Any card that holds AI-generated content. Pass `accentColor` matching the content type — teal for confession/encouragement, purple for reading plan, green for prayer.

---

### Section / Field (Account)

**File:** `src/pages/AccountPage.tsx` (inline)

**`Section` props:**
```ts
{ icon: React.ReactNode; title: string; children: React.ReactNode }
```

Renders a `rounded-3xl p-5 shadow-sm` white card with a title row, then children.

**`Field` props:**
```ts
{ label: string; children: React.ReactNode }
```

Renders an uppercase `text-xs tracking-wider` label above the field content. Always wrap inputs with `Field` to maintain consistent label spacing.

**`PasswordInput` component:**
- Wraps an `<input type="password">` with a show/hide toggle button
- Uses local `show` boolean state (`useState(false)`)
- Switches between `EyeIcon` and `EyeOffIcon` SVGs
- Container: `flex items-center rounded-xl px-4` with `var(--sg-surface)` background and border
- Input: `flex-1 py-3 text-sm bg-transparent outline-none font-body`
- No focus ring on the wrapper — keep it minimal

---

### UrgeDots

**File:** `src/pages/HistoryPage.tsx` (inline)

**Purpose:** Compact visual representation of urge intensity (1–5) using five colored dots.

```tsx
function UrgeDots({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: n <= value ? urgeColor(value) : '#d4edea' }}
        />
      ))}
    </div>
  )
}
```

Dots at or below the value are filled with the appropriate urge color; dots above the value are `#d4edea` (light teal-gray). No animation needed here — it's a static indicator in a list.

---

### ThreeCrosses SVG

**File:** `src/pages/HomePage.tsx` (inline)

**Purpose:** Brand illustration in the hero — three crosses of staggered heights, rendered in white at varying opacity to suggest depth.

```
viewBox: 0 0 140 90

Left cross:  vertical bar at x=24, horizontal bar at x=14 — opacity 0.55
Center cross (taller): vertical at x=67, horizontal at x=53 — opacity 0.70
Right cross: vertical at x=108, horizontal at x=99 — opacity 0.50
Ground line: cubic bezier path across the bottom — opacity 0.35
```

All shapes use `rx="2"` for slightly soft corners. The graduated opacity creates perspective: center front, sides receding.

---

### SpinIcon

**File:** `src/pages/HomePage.tsx` (inline)

**Purpose:** Loading indicator shown inside the submit button while AI guidance is being generated.

```tsx
<svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
  <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
</svg>
```

`animate-spin` is a Tailwind utility that applies `animation: spin 1s linear infinite`. The full circle is dimmed; only the arc (quarter-circle arc starting at top) is bright white, giving the standard spinner appearance.

---

## 7. Pages

### Home Page

**File:** `src/pages/HomePage.tsx`

**Purpose:** Primary entry point. Users write a new confession, rate urge intensity, and submit to receive AI guidance. Also provides a shortcut to History.

**State:**
```ts
const [confession, setConfession] = useState('')   // textarea content
const [urge, setUrge] = useState(3)                // 1–5 integer
const [submitting, setSubmitting] = useState(false) // loading state
```

**Layout structure:**
```
<div>                                    ← full-width
  <div>  [Hero panel]                    ← teal gradient, min-height 280px
    <ThreeCrosses />                     ← SVG illustration
    <h1> Solid Ground </h1>
    <p>  Gateway to Accountability </p>
    <div [arch cutout] />                ← absolute, bottom of hero
  </div>

  <div class="max-w-2xl mx-auto px-4">  ← content width cap + gutters
    <div [confession card]>             ← rounded-3xl white card
      <textarea />                      ← confession input
      <div [urge slider]>              ← label + badge + range + ticks
      <button [submit] />
    </div>
    <button [view past entries] />       ← secondary nav shortcut
  </div>
</div>
```

**Hero panel:**
- `background: linear-gradient(160deg, var(--sg-teal) 0%, var(--sg-teal-dark) 100%)`
- `position: relative; overflow: hidden`
- The arch cutout is `position: absolute; bottom: 0; left: 0; right: 0; height: 40px` with `background-color: var(--sg-surface)` and `border-radius: 50% 50% 0 0 / 100% 100% 0 0` — the asymmetric border-radius ellipse creates the curved arch that makes the white content area appear to rise from the teal background

**Confession textarea:**
- `rows={5}`, `resize: none`, `outline: none`
- Border transitions on focus/blur via inline `onFocus`/`onBlur` event handlers:
  ```ts
  onFocus={e => (e.target.style.borderColor = 'var(--sg-teal)')}
  onBlur={e  => (e.target.style.borderColor = 'var(--sg-border)')}
  ```
- Transition applied with Tailwind: `transition-all duration-200`

**Urge intensity badge:**
- A `<span>` showing `{urge} — {urgeText}`
- Background: `${urgeColor}18` (the color at ~9% opacity)
- Text: the urge color directly
- Updates live as the slider moves — no debounce needed since it's purely visual

**Submit button states:**

| State | Background | Cursor | Content |
|-------|-----------|--------|---------|
| Empty confession | `#a8d9d3` (muted teal) | `not-allowed` | "Submit & Receive Guidance" |
| Ready | `var(--sg-green)` | `pointer` | "Submit & Receive Guidance" |
| Hover | `var(--sg-green-dark)` | `pointer` | same |
| Submitting | `#a8d9d3` | `not-allowed` | `<SpinIcon>` + "Receiving guidance…" |

The 900ms `setTimeout` simulates API latency. In production, replace with the actual API call; the `submitting` state should remain `true` until the promise resolves.

**Submit → navigation flow:**
1. `onSubmit(confession, urge)` is called (passed from `App.tsx`)
2. `App.tsx` creates the new entry, generates `aiGuidance`, appends to `entries` state
3. `App.tsx` calls `navigate('entry', newEntry.id)`
4. `EntryViewPage` renders with the new entry

---

### Account Page

**File:** `src/pages/AccountPage.tsx`

**Purpose:** Profile management. Three sections: Profile (email display), Security (change password), Addiction Severity (self-report).

**Props:**
```ts
interface Props {
  onSelfReport: (score: number) => void
}
```

**State:**
```ts
const [showPasswordForm, setShowPasswordForm] = useState(false)
const [currentPw, setCurrentPw]   = useState('')
const [newPw, setNewPw]           = useState('')
const [confirmPw, setConfirmPw]   = useState('')
const [pwSaved, setPwSaved]       = useState(false)
const [selfSeverity, setSelfSeverity] = useState(2)
const [severitySaved, setSeveritySaved] = useState(false)
```

**Password flow:**
1. User sees a "Change password" button row (collapsed state)
2. Clicking it sets `showPasswordForm = true`, revealing three `PasswordInput` fields
3. Validation: `newPw !== confirmPw` shows an inline error message in red
4. Save button is disabled (background `#a8d9d3`, `cursor: not-allowed`) until all three fields are filled and passwords match
5. On save: `pwSaved = true` (button shows "✓ Saved"), then after 2 seconds resets to `false` and `showPasswordForm = false`

**Severity selector:**
- Five buttons in a `flex flex-wrap gap-2` row
- Each button shows the numeric score and its label (Minimal → Severe)
- Selected state: border and text in `severityColors[n]`, background `${severityColors[n]}18`
- Unselected state: `var(--sg-border)` border, `var(--sg-text-muted)` text
- On save: calls `onSelfReport(selfSeverity)` which creates a `SeverityRecord` with `type: 'self-reported'` in `App.tsx`

**SeverityMiniChart (embedded below the severity selector):**

**File:** `src/pages/AccountPage.tsx` (inline)

**Purpose:** A compact SVG sparkline showing the severity trend across the last 8 records, displayed directly beneath the Addiction Severity self-report controls so the user can see how their new rating fits historical trend.

**Implementation approach:**
- Uses a raw `<svg viewBox="0 0 100 100" preserveAspectRatio="none">` so it scales to fill its container
- `vectorEffect="non-scaling-stroke"` on strokes and circles ensures line widths don't scale with the SVG
- Y axis: severity 5 maps to y=0, severity 0 maps to y=100 → `y = ((max - score) / max) * 100`
- X axis: evenly distributed; `x = i * (100 / (count - 1))`
- Grid lines: 4 horizontal lines at `y = 20, 40, 60, 80` with `rgba(43,191,176,0.08)` stroke
- Trend line: `<polyline>` with `stroke="var(--sg-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"`
- Dots: `<circle r="4" fill="white">` with stroke color depending on record type — teal for AI-recommended, amber for self-reported
- Container height: `h-16` (64px); uses `position: relative` with `<svg>` absolutely positioned inside

---

### History Page

**File:** `src/pages/HistoryPage.tsx`

**Props:**
```ts
interface Props {
  entries: Entry[]
  severityHistory: SeverityRecord[]
  navigate: (p: Page, entryId?: string) => void
}
```

**Layout structure:**
```
<div class="max-w-2xl mx-auto px-4">
  [Page header — title + entry count]

  [Section: Confession Entries]
    [JournalIcon + "Confession Entries" label]
    <div> [entry cards, flex-col gap-3] </div>

  [Section: Addiction Severity Timeline]
    [TrendIcon + "Addiction Severity Timeline" label]
    <div [rounded-3xl white card]>
      [divider list of SeverityRecord rows]
    </div>
</div>
```

**Entry card:**
- Full-width button (`w-full text-left`) — the entire card is tappable
- On click: `navigate('entry', entry.id)`
- Hover: `backgroundColor: 'var(--sg-teal-50, #f0fdfb)'`, transition `150ms`
- Top row: date (teal, `font-700`) + time (muted) + `<UrgeDots>` (right-aligned)
- Body: `line-clamp-2` truncation of confession text
- Footer: "Urge: N/5" on left, "View guidance →" teal link on right

**Severity timeline list:**
- Each row: `flex items-center justify-between px-5 py-3.5`
- Left: bold type label ("Self-Reported" or "AI Recommended") + date in muted text
- Right: type badge (amber tinted for self-reported, teal tinted for AI) + score number in severity color + severity label below

---

### Entry View Page

**File:** `src/pages/EntryViewPage.tsx`

**Props:**
```ts
interface Props {
  entry: Entry
  navigate: (p: Page) => void
}
```

**Layout structure:**
```
[Back button → 'history']
[Date + "Confession Entry" heading]

<GuidanceCard label="Your confession">   confession text
<GuidanceCard label="Urge intensity">    filled dot grid

[AI Guidance divider — horizontal rule with centered label]

[Severity assessment banner]             gradient bg, score + label
<GuidanceCard label="An encouraging word">   italic quote
<GuidanceCard label="Personalized reading plan">  numbered list
<GuidanceCard label="Guided prayer">     prayer text in green-tinted box
```

**Back button:**
```tsx
<button onClick={() => navigate('history')}
  className="flex items-center gap-1.5 mb-6 text-sm font-display font-700 transition-opacity hover:opacity-70"
  style={{ color: 'var(--sg-teal)' }}>
  <ChevronLeft />
  Back to history
</button>
```

**Severity assessment banner:**
- Not a `GuidanceCard` — styled distinctly as a status indicator
- Background: `linear-gradient(135deg, {color}12, {color}06)` — very subtle gradient tint
- Border: `1.5px solid {color}30`
- Left: a square tile `w-14 h-14 rounded-2xl` showing the numeric score large + "/5" small
- Right: bold label + source attribution in muted text

**Reading plan list:**
- Each verse in a `rounded-xl px-3 py-2.5` container with `rgba(124,111,205,0.06)` background (soft purple tint)
- Leading number in a `w-5 h-5 rounded-full` purple pill
- Font: `font-display font-600 text-sm` for the verse reference

**AI guidance divider:**
```tsx
<div className="flex items-center gap-3 my-6">
  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--sg-border)' }} />
  <span className="text-xs font-display font-700 uppercase tracking-widest"
        style={{ color: 'var(--sg-text-muted)' }}>
    AI Guidance
  </span>
  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--sg-border)' }} />
</div>
```

---

## 8. Interactions, Animations & Transitions Reference

### Pattern: Button hover via inline style handlers

Tailwind's `hover:` pseudo-classes can conflict with dynamic inline styles. The pattern used throughout this codebase for color transitions is:

```tsx
<button
  style={{ backgroundColor: 'var(--sg-green)' }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--sg-green-dark)')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--sg-green)')}
>
```

Pair with `className="transition-colors duration-150"` or `transition-all duration-200` on the element to get smooth color easing. The transition duration of `150ms` is used for nav items; `200ms` for cards and buttons.

### Pattern: Disabled state without hover

When a button is disabled, the `onMouseEnter`/`onMouseLeave` handlers must guard against firing:

```tsx
onMouseEnter={e => { if (enabled) e.currentTarget.style.backgroundColor = 'var(--sg-green-dark)' }}
onMouseLeave={e => { if (enabled) e.currentTarget.style.backgroundColor = 'var(--sg-green)' }}
```

Where `enabled` is the boolean expression that determines interactivity (e.g. `confession.trim() && !submitting`).

### Pattern: Focus ring on inputs

Inputs use `outline: none` (remove browser default) and instead change `borderColor` on `focus`/`blur`:

```tsx
onFocus={e => (e.target.style.borderColor = 'var(--sg-teal)')}
onBlur={e  => (e.target.style.borderColor = 'var(--sg-border)')}
```

Combined with `transition-all duration-200` on the input element, this produces a smooth border color transition.

### Pattern: Outside-click close for dropdowns

```tsx
const ref = useRef<HTMLDivElement>(null)

useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }
  document.addEventListener('mousedown', handler)
  return () => document.removeEventListener('mousedown', handler)  // cleanup
}, [])
```

Attach `ref` to the outermost container of the dropdown (trigger + panel combined).

### Pattern: Temporary success state

Used after password save and severity save:

```ts
setSaved(true)
setTimeout(() => setSaved(false), 2000)
```

Button text changes to "✓ Saved" while `saved === true`. No extra library needed.

### Pattern: Page scroll reset on navigation

```ts
const navigate = (p: Page, entryId?: string) => {
  if (entryId) setSelectedEntryId(entryId)
  setPage(p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
```

`behavior: 'smooth'` scrolls the user back to top with a brief animation instead of a jarring jump.

### Animation: Spinner

Tailwind's `animate-spin` utility (`animation: spin 1s linear infinite`). Applied to the `<svg>` wrapper of `SpinIcon`. No framer-motion or custom keyframes needed — the Tailwind default is sufficient.

### Animation: Hamburger → X

Three `<span>` bars with `transition-all duration-200`:
- Top bar: `rotate-45 translate-y-1.5` when open
- Middle bar: `opacity-0` when open
- Bottom bar: `-rotate-45 -translate-y-1.5` when open

These are Tailwind utility classes toggled conditionally via template literals:
```tsx
className={`block w-5 h-0.5 bg-white rounded transition-all duration-200 ${open ? 'rotate-45 translate-y-1.5' : ''}`}
```

### Animation: About chevron

```tsx
className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
```

SVG arrow rotates 180° when the dropdown opens.

### Potential future animations (not yet implemented)

| Interaction | Recommended approach |
|-------------|---------------------|
| Page transitions | `framer-motion` `<AnimatePresence>` with `opacity` + `y` slide |
| Confession card submit feedback | `framer-motion` scale pulse on the card before navigating |
| Entry list items | `framer-motion` staggered children with `delay: i * 0.05` |
| Severity chart draw-on | SVG `stroke-dashoffset` animation via CSS `@keyframes` |
| Mobile menu slide | `max-height` transition from `0` to `auto` via CSS, or framer-motion height animation |

---

## 9. Data Model

### Entry

```ts
interface Entry {
  id: string           // Date.now().toString() — replace with UUID in production
  date: string         // ISO 8601: new Date().toISOString()
  confession: string   // Trimmed user input
  urgeIntensity: number // 1–5 integer
  aiGuidance?: {
    encouragement: string   // ~2-3 sentence personalized encouragement
    readingPlan: string[]   // Array of Bible references, e.g. ['Psalm 34:18', 'Romans 8:1']
    prayer: string          // ~3-5 sentence guided prayer
    severityLevel: number   // 1–5 assessed severity
    severityLabel: string   // 'Minimal' | 'Mild' | 'Moderate' | 'Significant' | 'Severe'
  }
}
```

`aiGuidance` is optional — an entry can be saved without it (e.g. if the API call fails). The Entry View page checks `if (aiGuidance)` before rendering the guidance section.

### SeverityRecord

```ts
interface SeverityRecord {
  date: string           // YYYY-MM-DD: new Date().toISOString().slice(0, 10)
  score: number          // 1–5
  type: 'self-reported' | 'recommended'
}
```

Self-reported records are created from Account page. Recommended records are created automatically when a new entry is submitted.

### AI severity inference (current stub)

```ts
severityLevel: urgeIntensity >= 4 ? 3 : urgeIntensity >= 3 ? 2 : 1
```

In production, replace this with a real API call that considers the full confession text, urge intensity, and the user's recent history.

### Persistence

Currently all state lives in React memory — it resets on page refresh. Future options:

| Option | Complexity | Privacy |
|--------|-----------|---------|
| `localStorage` | Low | Client-only, no server needed |
| Supabase (with RLS) | Medium | Server-persisted, per-user isolation |
| Encrypted `localStorage` | Medium | Client-only but protected at rest |

---

## 10. Extending the App

### Adding AI API integration

Replace the stub in `App.tsx`'s `addEntry` function:

```ts
// Current stub (synchronous):
aiGuidance: {
  encouragement: "…",
  readingPlan: ['Psalm 34:18', …],
  …
}

// Replace with:
const aiGuidance = await fetchGuidanceFromAPI({ confession, urgeIntensity })
```

Keep the `submitting` state `true` for the full duration of the API call. Show `SpinIcon` inside the submit button and "Receiving guidance…" as the button label during this time.

### Adding real authentication

1. Integrate Supabase Auth or a similar provider.
2. Gate all pages behind an auth check in `App.tsx`.
3. Store `Entry` and `SeverityRecord` in Supabase tables with row-level security so each user only sees their own data.
4. Update `Account.tsx` to pull the real email from the auth session.

### Adding the reading plan display (future pass)

The `readingPlan` field is already an array of verse references. In a future iteration, each verse could:
- Link out to YouVersion or Bible.com
- Be fetched as full verse text via a Bible API
- Be displayed in an expandable accordion within `EntryViewPage`

### Adding page transitions (framer-motion)

```bash
pnpm add framer-motion
```

Wrap the page content in `App.tsx`:
```tsx
import { AnimatePresence, motion } from 'framer-motion'

<AnimatePresence mode="wait">
  <motion.div
    key={page}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
  >
    {/* current page */}
  </motion.div>
</AnimatePresence>
```

### Adding real URL routing

```bash
pnpm add react-router
```

Replace the `page` state machine with `<BrowserRouter>` + `<Routes>`. Map each page to a path:

| Route | Component |
|-------|-----------|
| `/` | `HomePage` |
| `/account` | `AccountPage` |
| `/history` | `HistoryPage` |
| `/entry/:id` | `EntryViewPage` |

This enables deep-linking, browser back/forward, and bookmarking.
