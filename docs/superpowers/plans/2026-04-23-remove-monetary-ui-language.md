# Remove Monetary UI Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove monetary reward wording and currency display from the frontend UI while keeping the current API contracts intact.

**Architecture:** Keep the backend and contract field names as-is, but adapt frontend copy and presentation so money-like values are either hidden or shown as neutral progress/status indicators. Implement the change in focused UI slices with test-first coverage for user-facing text and route rendering.

**Tech Stack:** React 19, React Router 7, TanStack Query, Zustand, TypeScript, Vitest, Vite

---

### Task 1: Add regression tests for non-monetary labels and route copy

**Files:**
- Create: `apps/web/src/lib/labels.test.ts`
- Modify: `apps/web/src/app/router.test.ts`
- Modify: `apps/web/src/lib/fe2-api.test.ts`

- [ ] **Step 1: Write the failing label regression test**

```ts
import { describe, expect, it } from "vitest";
import { formatEventKind, formatRewardKind, formatRewardType, formatRiskFlag } from "@/lib/labels";

describe("non-monetary labels", () => {
  it("maps reward and event labels without money language", () => {
    expect(formatRewardType("social_ring_reward")).not.toMatch(/кэшбэк|выплат|лимит|денеж|операц/i);
    expect(formatRewardKind("cashback")).not.toMatch(/кэшбэк/i);
    expect(formatEventKind("partner")).not.toMatch(/покупк|операц/i);
    expect(formatRiskFlag("large_amount")).not.toMatch(/операц/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @mtb/web -- src/lib/labels.test.ts`
Expected: FAIL because current labels still include monetary wording.

- [ ] **Step 3: Add route-level copy regression**

```ts
it("does not expose monetary wording in the shell content", () => {
  const html = renderShell("/app/rewards");

  expect(html).not.toMatch(/BYN|кэшбэк|выплат|выручк|банковск/i);
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test --workspace @mtb/web -- src/app/router.test.ts`
Expected: FAIL because current shell-linked copy still contains monetary wording.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/labels.test.ts apps/web/src/app/router.test.ts apps/web/src/lib/fe2-api.test.ts
git commit -m "test: add non-monetary copy regressions"
```

### Task 2: Replace monetary wording in shared labels and rewards surfaces

**Files:**
- Modify: `apps/web/src/lib/labels.ts`
- Modify: `apps/web/src/pages/RewardsPage.tsx`
- Modify: `apps/web/src/pages/AdminKpiPage.tsx`
- Modify: `apps/web/src/pages/AdminRiskPage.tsx`

- [ ] **Step 1: Implement minimal label changes**

```ts
const REWARD_TYPE_LABELS: Record<string, string> = {
  cashback_booster: "бустер орбиты",
  quest_cashback: "усиление за квест",
  quest_limit_boost: "рост доступа за квест",
  social_ring_reward: "импульс Социального кольца",
};
```

- [ ] **Step 2: Remove currency display from rewards/admin pages**

```tsx
<strong className="text-2xl">{formatLedgerEntryCount(group.entries.length)}</strong>
<p className="text-xs text-white/42">{group.statusSummary}</p>
```

```tsx
<strong className="text-lg">{formatStatus(entry.status)}</strong>
```

- [ ] **Step 3: Run targeted tests**

Run: `npm run test --workspace @mtb/web -- src/lib/labels.test.ts src/app/router.test.ts`
Expected: PASS

- [ ] **Step 4: Add or update a focused rendering assertion if needed**

```ts
expect(formatRewardType("quest_cashback")).toBe("усиление за квест");
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/labels.ts apps/web/src/pages/RewardsPage.tsx apps/web/src/pages/AdminKpiPage.tsx apps/web/src/pages/AdminRiskPage.tsx apps/web/src/lib/labels.test.ts apps/web/src/app/router.test.ts
git commit -m "feat: remove monetary language from rewards and admin copy"
```

### Task 3: Replace monetary wording in galaxy, planets, onboarding, and mini-games

**Files:**
- Modify: `apps/web/src/pages/GalaxyPage.tsx`
- Modify: `apps/web/src/components/GalaxyStage.tsx`
- Modify: `apps/web/src/components/OnboardingOverlay.tsx`
- Modify: `apps/web/src/features/planets/screens/PlanetDetailScreen.tsx`
- Modify: `apps/web/src/features/planets/screens/PlanetsMapScreen.tsx`
- Modify: `apps/web/src/lib/fe2-api.ts`
- Modify: `apps/web/src/lib/game-config.ts`
- Modify: `apps/web/src/lib/mini-games.ts`
- Modify: `apps/web/src/pages/CashbackTetrisPage.tsx`
- Modify: `apps/web/src/pages/FintechMatch3Page.tsx`

- [ ] **Step 1: Add the next failing regression if labels still leak through FE2 copy**

```ts
expect(buildMockPlanetsList().some((planet) => /кэшбэк/i.test(JSON.stringify(planet)))).toBe(false);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @mtb/web -- src/lib/fe2-api.test.ts`
Expected: FAIL because FE2 mocks and UI copy still contain cashback wording.

- [ ] **Step 3: Update copy to neutral progress language**

```tsx
<span>Текущее усиление</span>
<strong>{progress.cashback_percent.toFixed(1)}%</strong>
```

```ts
detail: "Собирает линии усиления и открывает короткие бонусные окна."
```

- [ ] **Step 4: Run targeted tests**

Run: `npm run test --workspace @mtb/web -- src/lib/fe2-api.test.ts src/app/router.test.ts src/lib/labels.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/GalaxyPage.tsx apps/web/src/components/GalaxyStage.tsx apps/web/src/components/OnboardingOverlay.tsx apps/web/src/features/planets/screens/PlanetDetailScreen.tsx apps/web/src/features/planets/screens/PlanetsMapScreen.tsx apps/web/src/lib/fe2-api.ts apps/web/src/lib/game-config.ts apps/web/src/lib/mini-games.ts apps/web/src/pages/CashbackTetrisPage.tsx apps/web/src/pages/FintechMatch3Page.tsx apps/web/src/lib/fe2-api.test.ts
git commit -m "feat: remove monetary language from galaxy and planet flows"
```

### Task 4: Verify the frontend is clean and still builds

**Files:**
- Modify: `apps/web/src/...` only if verification exposes missed copy

- [ ] **Step 1: Run the full frontend test suite**

Run: `npm run test --workspace @mtb/web`
Expected: PASS with `0 failed`

- [ ] **Step 2: Run a frontend build**

Run: `npm run build --workspace @mtb/web`
Expected: PASS with exit code `0`

- [ ] **Step 3: Run a source search for forbidden monetary wording**

Run: `Get-ChildItem '.\\apps\\web\\src' -Recurse -Include *.ts,*.tsx | Select-String -Pattern 'BYN|кэшбэк|выплат|выручк|банковск'`
Expected: no user-facing matches in active frontend source, or only intentional internal identifiers/comments.

- [ ] **Step 4: Fix any missed copy and rerun the exact failing command**

```tsx
<p className="text-sm text-white/60">История активности появится после первого синхронизированного события.</p>
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "chore: finalize non-monetary frontend copy"
```
