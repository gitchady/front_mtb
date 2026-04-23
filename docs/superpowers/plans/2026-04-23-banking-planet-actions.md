# Banking Planet Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace abstract planet action copy with concrete bank actions while preserving current game logic.

**Architecture:** The visible action labels and descriptions come from `PLANET_ACTIONS` in the shared game config. A focused render test on the overview surface will lock the new banking copy and prevent regressions without changing API behavior or event wiring.

**Tech Stack:** TypeScript, React, Vitest, Vite

---

### Task 1: Lock Banking Copy In Tests

**Files:**
- Modify: `apps/web/src/components/OverviewCopy.test.tsx`
- Test: `apps/web/src/components/OverviewCopy.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
expect(html).toContain("Оплатить покупку у партнера");
expect(html).toContain("Оплатить обычную покупку картой");
expect(html).toContain("Внести платеж вовремя");
expect(html).toContain("Проверить кредитный лимит");
expect(html).toContain("Пригласить друга");
expect(html).toContain("Отправить перевод по номеру");
expect(html).not.toContain("Запустить партнерский сигнал");
expect(html).not.toContain("Запустить свободный сигнал");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/OverviewCopy.test.tsx`
Expected: FAIL because current render still contains abstract action labels.

- [ ] **Step 3: Write minimal implementation**

```ts
title: "Оплатить покупку у партнера"
detail: "Фиксирует оплату у партнера банка и усиливает прогресс в Орбите покупок"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/OverviewCopy.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/OverviewCopy.test.tsx apps/web/src/lib/game-config.ts
git commit -m "feat: use banking actions for planet controls"
```

### Task 2: Verify App Integrity

**Files:**
- Modify: `apps/web/src/lib/game-config.ts`
- Test: `apps/web/src/components/OverviewCopy.test.tsx`

- [ ] **Step 1: Run the full relevant checks**

```bash
npm test -- src/components/OverviewCopy.test.tsx src/pages/GalaxyPage.test.tsx
npm run build
```

- [ ] **Step 2: Confirm the overview still renders with the new action copy**

Expected:
- tests pass
- build succeeds
- overview shows bank-action labels without changing navigation or rewards

- [ ] **Step 3: Commit if not already committed**

```bash
git status --short
```
