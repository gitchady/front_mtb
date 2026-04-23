# Mobile-First App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing MTB Galaxy web UI into a mobile-first, app-like phone experience with a compact sticky header, short bottom navigation, and phone-optimized layouts for Overview, Friends, QR, and AI.

**Architecture:** Keep the existing React Router route graph and app shell entry point, but split presentation by viewport. The shell owns the mobile header, bottom navigation, and `Еще` surface, while page components keep their data logic and only reorder/reflow their content for phones. Shared CSS primitives in the global stylesheet provide the base responsive behavior so individual pages need only limited markup changes.

**Tech Stack:** React, React Router, TanStack Query, Framer Motion, Tailwind utility classes, global CSS, Vitest

---

### Task 1: Add route metadata and a mobile-aware shell navigation model

**Files:**
- Modify: `D:\MTB\apps\web\src\app\router.tsx`
- Modify: `D:\MTB\apps\web\src\app\router.test.ts`
- Test: `D:\MTB\apps\web\src\app\router.test.ts`

- [ ] **Step 1: Extend the router test with mobile navigation expectations**

Add assertions that the router exports enough metadata to render:
- the short mobile bottom nav with `Обзор`, `Друзья`, `QR`, `AI`, `Еще`
- the grouped overflow destinations for `Еще`
- the unchanged desktop/admin route links

Expected checks:
- `appLinks` still includes the full desktop destinations
- a new mobile nav descriptor groups low-frequency routes without removing them from routing
- `Friends`, `QR`, and `AI` remain first-class routes

- [ ] **Step 2: Run the router test to confirm the new expectations fail**

Run: `npm run test --workspace @mtb/web -- src/app/router.test.ts`

Expected: FAIL because the mobile navigation metadata does not exist yet.

- [ ] **Step 3: Add shell-level navigation metadata in the router**

In `D:\MTB\apps\web\src\app\router.tsx`:
- keep `appLinks` for desktop navigation
- introduce route metadata for mobile shell consumption, for example:
  - a primary mobile nav list with `Обзор`, `Друзья`, `QR`, `AI`, `Еще`
  - an overflow list for the `Еще` surface
- add any small helper needed to derive the current page label from the active pathname

Keep all route objects and paths unchanged.

- [ ] **Step 4: Run the router test to confirm the metadata now passes**

Run: `npm run test --workspace @mtb/web -- src/app/router.test.ts`

Expected: PASS

### Task 2: Implement the mobile shell, sticky header, bottom navigation, and `Еще` surface

**Files:**
- Modify: `D:\MTB\apps\web\src\app\router.tsx`
- Modify: `D:\MTB\apps\web\src\styles.css`
- Test: `D:\MTB\apps\web\src\app\router.test.ts`

- [ ] **Step 1: Add a focused failing shell test for mobile shell rendering rules**

Add a test that covers the shell contract at the metadata level:
- mobile shell can render a current page label
- bottom nav has exactly 5 entries
- overflow routes are available through `Еще`
- desktop links remain available for larger layouts

If a component-level shell test is cheaper than pure metadata, place it in `router.test.ts` and render `ShellLayout` through a memory router.

- [ ] **Step 2: Run the focused shell test and verify it fails**

Run: `npm run test --workspace @mtb/web -- src/app/router.test.ts`

Expected: FAIL because `ShellLayout` still renders only the desktop-first header/nav.

- [ ] **Step 3: Update `ShellLayout` to support mobile and desktop navigation without changing routes**

In `D:\MTB\apps\web\src\app\router.tsx`:
- keep the current desktop shell structure for tablet/desktop
- add mobile shell elements:
  - compact sticky header with brand and current page label
  - sticky bottom nav using the new mobile nav metadata
  - `Еще` trigger and a lightweight mobile destinations surface
- ensure active states still work for nested routes like `/app/game/*` and `/app/planets/*`
- ensure main content gets a stable wrapper class that can reserve space under the bottom nav

- [ ] **Step 4: Add the mobile shell styles**

In `D:\MTB\apps\web\src\styles.css`:
- define CSS variables for mobile header height, bottom nav height, and safe-area padding
- add classes for:
  - mobile shell header
  - current page label
  - bottom nav bar and items
  - `Еще` sheet/panel/backdrop
  - content bottom inset
- hide desktop nav bands at `767px` and below
- keep desktop header behavior intact above that breakpoint

- [ ] **Step 5: Run the shell/router test again**

Run: `npm run test --workspace @mtb/web -- src/app/router.test.ts`

Expected: PASS

### Task 3: Add shared mobile-first responsive primitives in the global stylesheet

**Files:**
- Modify: `D:\MTB\apps\web\src\styles.css`

- [ ] **Step 1: Identify the shared desktop-first primitives to retune**

Update the rules around these existing classes:
- `.hero-panel`
- `.surface-panel`
- `.metric-chip`
- `.list-row`
- `.top-shell`
- `.nav-link`
- `.primary-button`
- `.secondary-button`
- any shell content wrapper class added in Task 2

- [ ] **Step 2: Implement the phone-width base rules**

In `D:\MTB\apps\web\src\styles.css`:
- make phone widths the default for spacing-sensitive shell primitives where practical
- increase tap target size for nav items and action buttons
- ensure button groups wrap vertically when needed
- ensure `.list-row`, metric areas, and action cards stack cleanly on narrow widths
- reserve space for the bottom nav with safe-area support
- remove any remaining horizontal-overflow risk from nav, badges, or button groups

- [ ] **Step 3: Rebuild desktop/tablet enhancements through media queries**

Keep or refine larger breakpoint behavior so:
- tablet and desktop still use the existing top-shell navigation
- hero panels and grids regain their wider compositions above the phone breakpoint
- existing large-screen layouts remain visually close to the current product

- [ ] **Step 4: Run a production build to catch CSS/class regressions early**

Run: `npm run build:web`

Expected: PASS

### Task 4: Rework the Overview page for mobile-first hierarchy

**Files:**
- Modify: `D:\MTB\apps\web\src\pages\GalaxyPage.tsx`
- Modify: `D:\MTB\apps\web\src\styles.css`

- [ ] **Step 1: Reorder the hero and metrics for phone use**

In `D:\MTB\apps\web\src\pages\GalaxyPage.tsx`:
- keep the existing data and actions
- make the top section read in this order on phones:
  - current focus/context
  - primary actions
  - compact metrics
- reduce the perceived hero height by tightening copy spacing and metric grouping

- [ ] **Step 2: Collapse wide overview sections into mobile section feeds**

Adjust section wrappers so phone layouts:
- stack `Мастерство планет` and adjacent detail panels vertically
- move secondary summaries below primary actions
- avoid large two-column desktop compositions until larger breakpoints

- [ ] **Step 3: Verify the overview page still preserves desktop layout intent**

Check the `xl:*` compositions remain available for wider screens and no data logic changed.

### Task 5: Rework Friends, QR, and AI pages for phone-first priority flow

**Files:**
- Modify: `D:\MTB\apps\web\src\pages\FriendsPage.tsx`
- Modify: `D:\MTB\apps\web\src\pages\QrPage.tsx`
- Modify: `D:\MTB\apps\web\src\pages\AiPage.tsx`
- Modify: `D:\MTB\apps\web\src\styles.css`

- [ ] **Step 1: Make `FriendsPage` action-first on phones**

In `D:\MTB\apps\web\src\pages\FriendsPage.tsx`:
- keep the existing queries and mutations
- prioritize on phones:
  - quick actions
  - pending invites
  - friend list
  - activity
- reduce hero copy density and ensure invite controls/buttons stack cleanly

- [ ] **Step 2: Make `QrPage` workflow-first on phones**

In `D:\MTB\apps\web\src\pages\QrPage.tsx`:
- keep `Мой QR` and resolver logic
- ensure on phones:
  - personal payload is visible immediately
  - paste/resolve flow stays above secondary details
  - result panel reads clearly without side-by-side compression

- [ ] **Step 3: Make `AiPage` response-first on phones**

In `D:\MTB\apps\web\src\pages\AiPage.tsx`:
- keep assistant context and chat behavior
- ensure on phones:
  - quick prompts are easy to tap
  - active answer/result state appears before longer supporting context
  - history cards and recommendation chips do not overflow horizontally

- [ ] **Step 4: Add any page-specific helper classes needed for stacked mobile layouts**

If repeated wrappers emerge across the three pages, add small shared classes in `D:\MTB\apps\web\src\styles.css` instead of duplicating ad-hoc utility combinations.

### Task 6: Verify mobile shell behavior and prevent regressions

**Files:**
- Modify: `D:\MTB\apps\web\src\app\router.test.ts` if coverage gaps remain after earlier tasks
- Modify: `D:\MTB\apps\web\src\styles.css` only if verification reveals layout bugs

- [ ] **Step 1: Run targeted frontend tests**

Run: `npm run test:web`

Expected: PASS

- [ ] **Step 2: Run a production build**

Run: `npm run build:web`

Expected: PASS

- [ ] **Step 3: Manually verify phone-width behavior in the running app**

Check at approximately `375px` to `430px` widths:
- no header/nav overlap
- bottom nav remains visible and tappable
- `Еще` surface exposes low-frequency routes
- `Overview`, `Friends`, `QR`, and `AI` read vertically with no horizontal scroll

- [ ] **Step 4: Review the final diff for scope discipline**

Run: `git diff -- apps/web/src/app/router.tsx apps/web/src/styles.css apps/web/src/pages/GalaxyPage.tsx apps/web/src/pages/FriendsPage.tsx apps/web/src/pages/QrPage.tsx apps/web/src/pages/AiPage.tsx apps/web/src/app/router.test.ts`

Expected: Only shell, page layout, and responsive behavior changes for the approved mobile redesign.
