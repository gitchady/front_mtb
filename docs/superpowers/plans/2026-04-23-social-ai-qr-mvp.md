# Social, AI, QR MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class Friends, QR, and AI MVP modules to MTB Galaxy with real FastAPI-backed behavior and visible web routes.

**Architecture:** Extend the existing FastAPI monolith with three thin domains: friend relationships, QR payload generation/resolution, and a deterministic assistant. Extend the existing React SPA with three new routes wired into the current shell and powered by the same request patterns already used by the app.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, React, React Router, TanStack Query, Vitest, pytest

---

### Task 1: Backend tests for Friends, QR, and Assistant

**Files:**
- Modify: `D:\MTB\apps\api\tests\test_routes.py`
- Test: `D:\MTB\apps\api\tests\test_routes.py`

- [ ] **Step 1: Write failing route tests**

Add tests for:
- friend invite and accept flow
- self-invite rejection
- QR payload generation and resolve
- assistant context and chat

- [ ] **Step 2: Run test to verify it fails**

Run: `.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_routes.py -k "friend or qr or assistant" -v`

Expected: FAIL because routes and schemas do not exist yet.

- [ ] **Step 3: Implement minimal backend to satisfy tests**

Touch:
- `D:\MTB\apps\api\app\models.py`
- `D:\MTB\apps\api\app\schemas.py`
- `D:\MTB\apps\api\app\api.py`

- [ ] **Step 4: Run test to verify it passes**

Run: `.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_routes.py -k "friend or qr or assistant" -v`

Expected: PASS

### Task 2: Frontend tests for API client and route visibility

**Files:**
- Modify: `D:\MTB\apps\web\src\lib\api.test.ts`
- Create: `D:\MTB\apps\web\src\app\router.test.tsx`
- Test: `D:\MTB\apps\web\src\lib\api.test.ts`
- Test: `D:\MTB\apps\web\src\app\router.test.tsx`

- [ ] **Step 1: Write failing frontend tests**

Add tests for:
- QR payload builder or parser helpers if introduced
- new navigation route visibility
- route registration for `/app/friends`, `/app/qr`, `/app/ai`

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace @mtb/web`

Expected: FAIL because new pages, links, or methods are missing.

- [ ] **Step 3: Implement minimal route and API client changes**

Touch:
- `D:\MTB\apps\web\src\lib\api.ts`
- `D:\MTB\apps\web\src\app\router.tsx`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test --workspace @mtb/web`

Expected: PASS

### Task 3: Implement Friends, QR, and AI pages

**Files:**
- Create: `D:\MTB\apps\web\src\pages\FriendsPage.tsx`
- Create: `D:\MTB\apps\web\src\pages\QrPage.tsx`
- Create: `D:\MTB\apps\web\src\pages\AiPage.tsx`
- Modify: `D:\MTB\apps\web\src\app\router.tsx`
- Modify: `D:\MTB\apps\web\src\lib\api.ts`

- [ ] **Step 1: Create FriendsPage**

Include:
- query-backed friend list
- pending invites
- lightweight activity
- CTA to QR and AI

- [ ] **Step 2: Create QrPage**

Include:
- current user payload display
- pasted payload resolve flow
- result CTA block

- [ ] **Step 3: Create AiPage**

Include:
- assistant context query
- quick prompts
- session history state
- assistant response rendering

- [ ] **Step 4: Wire routes and navigation**

Add top-level nav items and lazy routes for all three pages.

- [ ] **Step 5: Run frontend tests**

Run: `npm run test --workspace @mtb/web`

Expected: PASS

### Task 4: Contracts, verification, and docs sync

**Files:**
- Modify: `D:\MTB\packages\contracts\src\generated\api.ts`
- Modify: `D:\MTB\scripts\generate_mtb_plan_doc.py`
- Modify: `D:\MTB\docs\superpowers\specs\2026-04-23-social-ai-qr-mvp-design.md` only if implementation diverges

- [ ] **Step 1: Regenerate API contracts**

Run: `npm run contracts:generate`

- [ ] **Step 2: Run backend verification**

Run: `npm run test:api`

- [ ] **Step 3: Run frontend verification**

Run: `npm run test:web`

- [ ] **Step 4: Run build verification**

Run: `npm run build:web`

- [ ] **Step 5: Refresh Word output if needed**

Run: `python -X utf8 D:\MTB\scripts\generate_mtb_plan_doc.py`

- [ ] **Step 6: Review final diff**

Run: `git -C D:\MTB diff -- apps/api apps/web packages/contracts scripts docs`
