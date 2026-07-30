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

This is the **real FellowshipRing app** (`web/`), not a standalone prototype — it already has react-router-dom routing, Supabase auth/data, React Query, react-hook-form + zod, and a YouVersion Bible SDK integration wired in. This design system is layered on top of that existing app; it does not replace its architecture.

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22.x | Runtime |
| npm | (repo convention — root `package.json` uses npm workspaces) | Package manager |
| Vite | 5.x → migrating to v4-compatible Tailwind tooling | Build tool & dev server |
| TypeScript | 5.5+ | Type safety |
| React | 19 | UI framework |
| Tailwind CSS | v4 (migrated from v3) | Utility styling |
| react-router-dom | v6 | Routing (kept — see [Application Shell & Routing](#5-application-shell--routing)) |
| @tanstack/react-query | v5 | Server state / caching |
| Supabase | — | Auth, Postgres (RLS), edge functions |

> **Note:** Earlier drafts of this document assumed `pnpm`. The repo's root `package.json` declares an npm workspace (`"workspaces": ["web"]`) and `scripts/build.sh`/`scripts/dev.sh` both call `npm`. Use `npm` for all commands below.

### Installing the baseline

```bash
# Install all dependencies (already in package.json)
npm install --workspace web
```

### Adding future libraries

When adding new runtime libraries, install with npm and import from the package root:

```bash
# Example: adding recharts for a more elaborate severity chart
npm install --workspace web recharts

# Example: adding framer-motion for richer page transitions
npm install --workspace web framer-motion

# Example: adding a date formatting library
npm install --workspace web date-fns
```

Before using any unfamiliar package, confirm the import path from its `package.json` `exports` field or its TypeScript types. Do not guess import paths.

### Dev server

```bash
npm --workspace web run dev   # start dev server
npm --workspace web run build # production build (tsc -b && vite build)
```

---

## 2. Design Tokens & Theme

All color tokens are defined as CSS custom properties on `:root` in `web/src/styles/index.css`. Use these everywhere — never scatter raw hex values across components.

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

Two Google Fonts are used. They are imported at the top of `web/src/styles/index.css` (before any other CSS):

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

The two font stacks are wired as Tailwind utility classes via `web/src/styles/index.css`:

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

### `web/src/styles/index.css` — full structure

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

The app has been migrated from Tailwind v3 (config-file based) to **Tailwind CSS v4**:
- `web/tailwind.config.js`, `web/postcss.config.js`, and the `autoprefixer` devDependency have been removed.
- `@tailwindcss/vite` is added as a Vite plugin in `web/vite.config.ts` — no PostCSS setup required.
- All configuration (tokens, fonts) lives in `web/src/styles/index.css` via `@theme inline { … }`.
- Custom color tokens added to `@theme inline` become available as Tailwind utility classes (e.g. `--color-teal-500` → `bg-teal-500`).

---

## 5. Application Shell & Routing

The app keeps its existing **react-router-dom (v6)** routing — there is no custom `page`-state router. This design system is a visual reskin layered on top of the real route tree, auth guard, and data layer; it does not replace them.

### Route map (`web/src/app/router.tsx`)

| Route | Page component | Notes |
|-------|----------------|-------|
| `/` | `HomePage` (merged Dashboard + New Entry) | Protected. Hero + confession form + recent-entries preview. |
| `/entries` | `EntriesListPage` | Protected. History page. |
| `/entries/:entryId` | `EntryDetailPage` | Protected. Entry View page. |
| `/account` | `AccountPage` (merged Settings + Assessment self-report + profile) | Protected. |
| `/login` | `LoginPage` | Public. Rendered when a signed-out user is redirected from a protected route or clicks the header's Account link while signed out. |
| `/settings`, `/assessment`, `/entries/new` | — | Redirect to `/account` / `/`, kept only for backwards compatibility with any existing links. |
| `/ppg` | `PpgPlotterPage` | Protected. Out of scope for this design pass — left unstyled. |

`ProtectedRoute` (in `router.tsx`) already checks `useAuth().session` and redirects to `/login` — that guard is unchanged.

### Data model note

There is no client-only `Entry`/`SeverityRecord`/`aiGuidance` mock shape — all data is persisted in Supabase and fetched via React Query hooks. See [Data Model](#9-data-model) for the real schema and edge-function contracts.

### Navigation pattern

Use react-router's `<Link>`/`useNavigate()`/`useLocation()` directly in components — there is no shared `navigate(page, entryId)` helper. To reproduce the design doc's "scroll to top on navigation" behavior (see [section 8](#8-interactions-animations--transitions-reference)), a small `ScrollToTop` component listens to `useLocation().pathname` and calls `window.scrollTo({ top: 0, behavior: 'smooth' })`, mounted once near the router.

### Adding a new page

1. Create the page component inside the relevant `web/src/features/<feature>/` folder.
2. Add a route entry (wrapped in `ProtectedRoute` if it requires auth) to `web/src/app/router.tsx`.
3. Add a nav entry in `Header.tsx` if it should appear in primary navigation.

---

## 6. Component Library

### Header

**File:** `web/src/components/Header.tsx`

**Purpose:** Persistent navigation bar, sticky at the top of every page. Contains the brand lockup, desktop nav links, and a mobile hamburger menu.

**Behavior (react-router based, no props needed):**
- Uses `useLocation()` to determine the active route for the underline indicator (instead of a `currentPage` prop).
- Uses `useAuth()` to decide whether the "Account" nav item links to `/account` (signed in) or `/login` (signed out), and to expose a sign-out action.
- Uses `<Link>` for all nav items instead of calling a `navigate()` prop.

**Layout:** `position: sticky; top: 0; z-index: 50`. Height is 56px (`h-14`). Background: `var(--sg-teal)`. Max content width: `max-w-2xl mx-auto`.

**Desktop nav** (visible at `sm:` breakpoint and above):
- Home, History, Account as `<Link>`s
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
- Contains nav buttons as a flat list, plus a sign-out action
- Closes on any navigation action

**CrossIcon SVG** (inside brand lockup):
```tsx
// 18×22 viewport, two rounded-rect bars forming a cross
<rect x="7.5" y="0" width="3" height="22" rx="1.5" fill="white" opacity="0.9" />  // vertical
<rect x="0"   y="5" width="18" height="3" rx="1.5" fill="white" opacity="0.9" />  // horizontal
```

> **Note:** The earlier "About" dropdown nav item has been dropped — the real app has no About/info content to link to. If informational pages are added later, reintroduce a dropdown following the same outside-click-close and chevron-rotation patterns described in [section 8](#8-interactions-animations--transitions-reference).

---

### GuidanceCard

**File:** `web/src/features/confessions/EntryDetailPage.tsx` (inline, local to the entry view)

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

**File:** `web/src/features/account/AccountPage.tsx` (inline)

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

**File:** `web/src/components/UrgeDots.tsx` (shared component — used by both the History page and Entry View page)

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

**File:** `web/src/features/dashboard/HomePage.tsx` (inline)

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

**File:** `web/src/features/dashboard/HomePage.tsx` (inline)

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

**File:** `web/src/features/dashboard/HomePage.tsx` (merges the former `DashboardPage` + `NewEntryPage`/`NewEntryForm`)

**Purpose:** Primary entry point at `/`. Users write a new confession, rate urge intensity, and submit to receive AI guidance; also shows a preview of recent entries with a link to full History.

**Data & state (real hooks, not mock state):**
- Confession form uses the **existing** `react-hook-form` + zod validation and `useCreateConfessionEntry` mutation (carried over from `NewEntryForm.tsx`) — not a bare `useState` string.
- `submitting` maps to the mutation's `isPending`.
- Recent-entries preview uses `useConfessionEntries` (and optionally `useRecentGuidance`), showing ~3 most recent as compact History-style cards.

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
    <section [recent entries preview] /> ← ~3 recent entry cards
    <a [view all history] href="/entries" />
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

`submitting` is driven by `useCreateConfessionEntry().isPending` — there is no simulated `setTimeout` latency; the button stays in the submitting state for the real duration of the Supabase insert.

**Submit → navigation flow (unchanged from the pre-redesign app — must be preserved exactly):**
1. `useCreateConfessionEntry` mutation inserts the `confession_entries` row.
2. On success, `useNavigate()` sends the user to `/entries/:entryId` with `{ state: { justCreated: true } }`.
3. `EntryDetailPage` sees `justCreated` and calls `useEntryGuidanceOrchestrator().trigger(entryId)`, which streams the AI guidance generation (see [Entry View Page](#entry-view-page)).

---

### Account Page

**File:** `web/src/features/account/AccountPage.tsx` (merges the former `SettingsPage` + `SelfReportPage`/`SelfReportForm` + profile display; the `LoginPage` is restyled to match and is what a signed-out user sees when the header's Account link routes them to `/login`)

**Purpose:** Profile management. Five sections: Profile (email display), Security (change password), Addiction Severity (self-report + trend), Addiction Severity Timeline (full history), Preferences (gender).

**Data & state (real hooks, not a mock `onSelfReport` prop):**
- Profile/email: `useAuth().user.email`.
- Security/password: local form state (`currentPw`/`newPw`/`confirmPw`/`showPasswordForm`/`pwSaved`) as described below; the Save action calls `useAuth().updatePassword(newPw)`, which re-verifies `currentPw` via `supabase.auth.signInWithPassword` before calling `supabase.auth.updateUser({ password })`.
- Addiction Severity: reuses `useProfile()` (pre-populates the selector) and `useSubmitSelfReport()` (inserts an `addiction_assessments` row with `source: 'self_report'`) in place of a bare `onSelfReport(score)` callback.
- Addiction Severity Timeline: `useSeverityHistory()` (in `web/src/features/assessment/hooks/`, queries `addiction_assessments` for the current user ordered by `created_at desc`) — the same query instance backs both the `SeverityMiniChart` (most recent 8, reversed to chronological order) and the full timeline list below it. A `SeverityHistoryRecord`'s `source` (`'self_report'` → "Self-Reported", `'ai'` → "AI Recommended") and `severity_level` drive the row label and score.
- Preferences (gender): reuses `useUpdateGender()`.

**Password flow:**
1. User sees a "Change password" button row (collapsed state)
2. Clicking it sets `showPasswordForm = true`, revealing three `PasswordInput` fields
3. Validation: `newPw !== confirmPw` shows an inline error message in red
4. Save button is disabled (background `#a8d9d3`, `cursor: not-allowed`) until all three fields are filled and passwords match
5. On save: calls `useAuth().updatePassword(newPw)`; on success `pwSaved = true` (button shows "✓ Saved"), then after 2 seconds resets to `false` and `showPasswordForm = false`; on failure (e.g. wrong current password) shows an inline error instead

**Severity selector:**
- Five buttons in a `flex flex-wrap gap-2` row
- Each button shows the numeric score and its label (Minimal → Severe)
- Selected state: border and text in `severityColors[n]`, background `${severityColors[n]}18`
- Unselected state: `var(--sg-border)` border, `var(--sg-text-muted)` text
- On save: calls `useSubmitSelfReport().mutate(selfSeverity)`, which inserts an `addiction_assessments` row with `source: 'self_report'`

**Addiction Severity Timeline section (separate `Section`, below Addiction Severity):**
- Uses the same `TrendIcon` as the mini chart heading
- Lists every `addiction_assessments` row from `useSeverityHistory()`, most recent first, each row: `flex items-center justify-between py-3.5` with a top divider (`1px solid var(--sg-border)`) between rows
- Left: bold type label ("Self-Reported" or "AI Recommended", derived from the row's `source`) + date in muted text
- Right: type badge (amber tinted for `self_report`, teal tinted for `ai`) + score number in severity color + severity label below
- Empty state: "No severity records yet." in muted text

**SeverityMiniChart (embedded below the severity selector):**

**File:** `web/src/features/account/AccountPage.tsx` (inline)

**Purpose:** A compact SVG sparkline showing the severity trend across the last 8 records, displayed directly beneath the Addiction Severity self-report controls so the user can see how their new rating fits historical trend. Fed by the same `useSeverityHistory` hook used by the Addiction Severity Timeline section below — pull the most recent 8 records from it rather than maintaining a separate query.

**Implementation approach:**
- Uses a raw `<svg viewBox="0 0 100 100" preserveAspectRatio="none">` (absolutely positioned to fill an `h-16` container) for the grid lines and trend `<polyline>` only — it scales to fill its container width without distorting the line's shape
- `vectorEffect="non-scaling-stroke"` on the grid lines and polyline stroke keeps line widths constant regardless of the non-uniform scale
- Y axis: severity 5 maps to y=0, severity 0 maps to y=100 → `y = ((max - score) / max) * 100`
- X axis: evenly distributed; `x = i * (100 / (count - 1))`
- Grid lines: 4 horizontal lines at `y = 20, 40, 60, 80` with `rgba(43,191,176,0.08)` stroke
- Trend line: `<polyline>` with `stroke="var(--sg-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"`
- **Dots are rendered as absolutely-positioned HTML `<span>` elements (not SVG `<circle>`s)**, sized `h-2 w-2 rounded-full` and positioned with `left: {x}%; top: {y}%; transform: translate(-50%, -50%)`. This avoids the distortion that occurs when SVG circles are scaled non-uniformly: the chart container is much wider than it is tall (`h-16` against a full-width card), and `preserveAspectRatio="none"` stretches the `0 0 100 100` viewBox to fit — `vector-effect: non-scaling-stroke` only protects stroke *width*, not a circle's radius, so plain `<circle r="4">` elements render as ellipses. HTML dots have a fixed, independent aspect ratio and stay perfectly round regardless of the chart's width.
- Dot border color depends on record source — teal for `source: 'ai'`, amber for `source: 'self_report'`; fill stays white
- Container height: `h-16` (64px); uses `position: relative` with the `<svg>` and dots both absolutely positioned inside

---

### History Page

**File:** `web/src/features/confessions/EntriesListPage.tsx`

**Data (real hooks, not props):**
- Entries: `useConfessionEntries()`.
- Navigation: `<Link to={`/entries/${entry.id}`}>` instead of a `navigate` prop.

**Layout structure:**
```
<div class="max-w-2xl mx-auto px-4">
  [Page header — title + entry count]

  [Section: Confession Entries]
    [JournalIcon + "Confession Entries" label]
    <div> [entry cards, flex-col gap-3] </div>
</div>
```

**Entry card:**
- Full-width `<Link>` (`w-full text-left block`) — the entire card is tappable, routes to `/entries/:entryId`
- Hover: `backgroundColor: 'var(--sg-teal-50, #f0fdfb)'`, transition `150ms`
- Top row: date (teal, `font-700`) + time (muted) + `<UrgeDots value={entry.urge_intensity} />` (right-aligned)
- Body: `line-clamp-2` truncation of confession text
- Footer: "Urge: N/5" on left, "View guidance →" teal link on right

> **Note:** The Addiction Severity Timeline previously shown on this page has moved to the [Account Page](#account-page), directly below the Addiction Severity self-report controls, alongside the `SeverityMiniChart`.

---

### Entry View Page

**File:** `web/src/features/confessions/EntryDetailPage.tsx`

**Data (real hooks/params, not props):**
- `entryId` comes from `useParams<{ entryId: string }>()`, entry data from `useConfessionEntry(entryId)`.
- Back navigation uses `<Link to="/entries">` instead of a `navigate('history')` callback.
- All AI guidance content and its independent loading/success/error states come from `useEntryGuidanceOrchestrator()` (streaming NDJSON, see [Data Model](#9-data-model)) merged with whatever's already persisted (`useReadingPlanForEntry`, `useGuidanceRecordForEntry`, `useGuidedPrayerForEntry`, `useAssessmentForEntry`) — this is real, incrementally-arriving data, not a single static `entry.aiGuidance` object. **Every `GuidanceCard` must keep reflecting its own `loading`/`success`/`error`/`idle` status independently** — do not collapse this into one all-or-nothing spinner.
- The reading-plan card renders the existing `ReadingPlanCard` (YouVersion `BibleCard` SDK, versioned `plan_json` v1/v2) wrapped in the `GuidanceCard` chrome below — it is **not** replaced by a plain static numbered list of verse strings.
- The severity section renders the existing accept/record flow (`entryAssessment` vs. `SeverityRecommendationCard`) inside the gradient banner styling below.

**Layout structure:**
```
[Back button → '/entries']
[Date + "Confession Entry" heading]

<GuidanceCard label="Your confession">   confession text
<GuidanceCard label="Urge intensity">    <UrgeDots value={entry.urge_intensity} />

[AI Guidance divider — horizontal rule with centered label]

[Severity assessment banner]             gradient bg, score + label (entryAssessment or SeverityRecommendationCard accept flow)
<GuidanceCard label="An encouraging word">   guidanceRecord.content (motivational)
<GuidanceCard label="Personalized reading plan">  ReadingPlanCard (YouVersion BibleCard)
<GuidanceCard label="Guided prayer">     guidedPrayer.content, in green-tinted box

[Collapsed "Developer tools" disclosure — existing debug-prompts aid, visually tucked away]
```

**Back button:**
```tsx
<Link to="/entries"
  className="flex items-center gap-1.5 mb-6 text-sm font-display font-700 transition-opacity hover:opacity-70"
  style={{ color: 'var(--sg-teal)' }}>
  <ChevronLeft />
  Back to history
</Link>
```

**Severity assessment banner:**
- Not a `GuidanceCard` — styled distinctly as a status indicator
- Background: `linear-gradient(135deg, {color}12, {color}06)` — very subtle gradient tint
- Border: `1.5px solid {color}30`
- Left: a square tile `w-14 h-14 rounded-2xl` showing the numeric score large + "/5" small
- Right: bold label + source attribution in muted text (recorded `entryAssessment.source` — `'ai'` → "accepted AI recommendation", `'self_report'` → "your own report" — or, if not yet recorded, the in-flight `guidance.severity` recommendation with its accept action)

**Reading plan card:**
- Keep the existing `ReadingPlanCard`/YouVersion `BibleCard` rendering; wrap it in the `GuidanceCard` chrome (icon, uppercase purple-accented label, `rounded-3xl` container) rather than reverting to a plain numbered verse-string list

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

Not currently used (the About dropdown was dropped — see [Header](#header)), but kept here as the reference pattern if a future dropdown is added:

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

Since routing uses react-router (not a custom `navigate()` helper), this is implemented as a small component mounted once near the router root, reacting to route changes:

```tsx
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])
  return null
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

All data is persisted in Supabase (Postgres + RLS) and fetched via typed React Query hooks — there is no client-only mock state or `localStorage` fallback. Types are generated into `supabase/types/database.types.ts`.

### confession_entries

```ts
interface ConfessionEntry {
  id: string             // UUID
  user_id: string
  content: string        // The confession text
  urge_intensity: number // 1–5 integer
  created_at: string
  updated_at: string
}
```

Maps to the design doc's "confession" + "urge intensity" concepts. Created via `useCreateConfessionEntry` from the Home page form.

### addiction_assessments

```ts
type AssessmentSource = 'self_report' | 'ai'

interface AddictionAssessment {
  id: string
  user_id: string
  source: AssessmentSource
  severity_level: number          // 1–5
  addiction_type: string | null
  notes: string | null
  based_on_entry_id: string | null // FK to confession_entries, when tied to a specific entry
  created_at: string
}
```

This is the real backing table for what the design doc calls a "SeverityRecord": `source: 'self_report'` rows come from the Account page's severity selector (`useSubmitSelfReport`); `source: 'ai'` rows are created only after the user explicitly accepts an AI recommendation on the Entry View page (`SeverityRecommendationCard`) — the recommendation itself (`recommend-severity` edge function) is not persisted until accepted. `useSeverityHistory` queries this table (ordered by `created_at desc`) to feed both the Account page's `SeverityMiniChart` and its Addiction Severity Timeline list. `severityColors`/`severityLabels` (section 2) index by `severity_level`.

### guidance_records, reading_plans, guided_prayers

```ts
interface GuidanceRecord {   // motivational encouragement
  id: string; user_id: string; confession_entry_id: string
  assessment_id: string | null; content: string; created_at: string
}

interface ReadingPlan {
  id: string; user_id: string; confession_entry_id: string
  title: string; description: string | null
  plan_json: { version: 1; passages: { reference: string }[] }
            | { version: 2; passages: { number: number; reference: string; summary: string }[] }
  created_at: string
}

interface GuidedPrayer {
  id: string; user_id: string; confession_entry_id: string
  content: string
  desperation_level: number | null // 1–10; 1–3 joyful, 4–7 peaceful, 8–10 zealous tier
  created_at: string
}
```

`ReadingPlanCard` renders `plan_json` via the YouVersion `BibleCard` SDK component and must tolerate both v1 and v2 shapes — it is not a plain array of verse-reference strings as an earlier draft of this doc suggested.

### profiles

```ts
interface Profile {
  user_id: string
  current_severity_level: number | null
  current_addiction_type: string | null
  gender: 'male' | 'female' | 'none' | null
  updated_at: string
}
```

Backs the Account page's Preferences (gender) section and pre-populates the severity selector via `useProfile`.

### Entry guidance generation (real, streaming — not a synchronous stub)

Submitting a confession does **not** synchronously attach a static `aiGuidance` object. Instead, `EntryDetailPage` calls `useEntryGuidanceOrchestrator().trigger(entryId)` (when navigated to with `{ state: { justCreated: true } }`), which POSTs to the `generate-entry-guidance` edge function and reads back **newline-delimited JSON** progress events as each of the following resolves, independently:

- `assess-desperation` → `{ desperationLevel: 1–10 }` (ephemeral, drives the guided-prayer tier, not persisted itself)
- `generate-reading-plan` → inserts a `reading_plans` row
- `generate-motivational` → inserts a `guidance_records` row
- `recommend-severity` → `{ recommendedSeverity: 1–5 }` (not persisted until the user accepts it)
- `generate-guided-prayer` → runs once desperation resolves; inserts a `guided_prayers` row

Each `GuidanceCard` on the Entry View page reflects its own `idle`/`loading`/`success`/`error` state from this stream (see the `EntryGuidanceState` shape in `useEntryGuidanceOrchestrator.ts`). Revisiting an already-guided entry instead just reads whatever's already persisted via the `useReadingPlanForEntry`/`useGuidanceRecordForEntry`/`useGuidedPrayerForEntry`/`useAssessmentForEntry` queries.

---

## 10. Extending the App

The items below are genuinely still open — AI guidance generation, authentication, reading-plan display, and URL routing (formerly listed here as "future work") are already implemented in the real app and are described throughout this document instead.

### Adding richer page transitions (framer-motion)

```bash
npm install --workspace web framer-motion
```

Since routing is react-router-based, wrap the routed content (e.g. in `AppRouter` or a shared layout) rather than a `page` state switch:
```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useOutlet } from 'react-router-dom'

const location = useLocation()
const element = useOutlet()

<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
  >
    {element}
  </motion.div>
</AnimatePresence>
```

### Hard-deleting the legacy redirect routes

Once you've confirmed nothing links to them, remove the `/settings`, `/assessment`, and `/entries/new` redirect routes from `web/src/app/router.tsx` entirely (see [section 5](#5-application-shell--routing)).

### Extending the reading plan display further

`reading_plans.plan_json` already carries structured passages (v2: `{ number, reference, summary }`). Future iterations could add per-passage completion tracking or link out to a full YouVersion reading-plan experience beyond the single-passage `BibleCard`.
