# Mobile-First App Shell Design

## Context

The current `MTB Galaxy` web app already contains a broad desktop-oriented shell with many first-level destinations, analytics-style panels, and several dense dashboard sections. The product now also includes the newer user-facing routes `Friends`, `QR`, and `AI`.

On phones, the current experience remains too close to a compressed desktop layout:

- the header and top navigation compete for horizontal space
- long labels and grouped actions wrap unpredictably
- dashboard sections still prioritize width over touch comfort
- mobile users do not get an app-like navigation pattern

This design defines a mobile-first shell that makes the phone experience feel intentional without splitting the product into a separate mobile application.

Date: `2026-04-23`

## Goals

- Make the phone experience feel app-like instead of like a squeezed desktop page.
- Add a dedicated mobile shell with a compact sticky header and a short bottom navigation.
- Preserve the existing route model and desktop information architecture.
- Reorder page content on mobile around action-first and context-first usage.
- Improve tap comfort, readability, spacing, and overflow behavior across the app.
- Ensure the newer `Friends`, `QR`, and `AI` surfaces feel natural on phones.

## Non-Goals

- No separate native mobile app.
- No new API surface purely for the mobile redesign.
- No full rewrite of desktop page compositions.
- No gesture-heavy drawer system or complex mobile-only interaction model.
- No route restructuring that would diverge mobile and desktop behavior.

## Product Direction

The chosen approach is the balanced `app-like mobile` model:

- desktop and tablet continue to use the current shell structure
- phones switch to a dedicated mobile shell
- the mobile shell keeps the same routes but changes how navigation and page hierarchy are presented

This gives the app a clearer mobile identity without turning it into two separately maintained products.

## Information Architecture

## Mobile shell

Phones should use a dedicated `mobile shell` with:

- a compact sticky header
- a short sticky bottom navigation
- content spacing that accounts for safe areas and bottom navigation height

The shell should focus on current context and primary actions first. Long horizontal top-level navigation should not remain visible on phones.

## Bottom navigation

The mobile bottom navigation should expose only the highest-frequency destinations:

- `Обзор`
- `Друзья`
- `QR`
- `AI`
- `Еще`

The `Еще` destination becomes the mobile entry point for lower-frequency routes:

- `Планеты`
- `Игры`
- `Лидерборд`
- `Квесты`
- `Награды`
- `KPI`
- `Симулятор`
- `Риски`
- `Социальное кольцо`

This keeps thumb navigation short and readable while preserving full product access.

`Еще` should open a lightweight mobile destinations surface owned by the shell, not a separate application variant. In implementation terms, this can be a compact sheet, panel, or menu view, but it must reuse the existing route destinations rather than introduce a second routing model.

## Header behavior

On phones, the header should become:

- sticky
- single-row
- compact in height
- centered around current-page context rather than full navigation exposure

It may include:

- brand or compact product mark
- current page label
- one quick action or menu entry when appropriate

Desktop-style horizontal navigation bands should be hidden in phone layouts.

## User Experience Rules

## Mobile content order

Each mobile page should follow the same priority model:

1. primary action
2. current status or summary
3. useful details
4. secondary content

This means mobile is not just a narrower layout. It is a different content order tuned for small screens and one-handed use.

## Layout rules

Phone layouts should default to:

- one-column content flow
- stacked cards instead of wide panels
- fewer side-by-side sections
- larger tap targets
- more consistent vertical rhythm

Two-up blocks are allowed only where they remain readable, such as compact metric pairs.

## Overflow and text handling

The redesign must explicitly address current overflow issues:

- long navigation labels must not collide
- button groups must wrap cleanly
- badges and chips must allow wrapping or reflow
- metric blocks must avoid clipped titles and values
- there must be no horizontal scrolling in standard phone use

## Page-Level Design

## Overview and dashboard-style pages

Pages that currently behave like dashboards should become vertical section feeds on phones. Large hero areas should be shortened. Wide metric grids should collapse into one-column or limited two-column mobile groupings. Secondary summary panels should move below the primary action and status sections.

The mobile experience should prioritize:

- what the user can do next
- what changed recently
- what deserves immediate attention

## Friends page

`Friends` should feel action-first on mobile:

- quick actions at the top
- pending invites next
- friend list after that
- lightweight activity below

The mobile page should avoid burying the main social actions below status summaries.

## QR page

`QR` should present the main scan/share workflow first:

- personal code or encoded payload at the top
- paste/resolve workflow immediately visible
- parsed payload details below the main action area

Supporting details should not push the primary QR action below the fold.

## AI page

`AI` should prioritize:

- quick prompts
- active answer/result state
- recommendation cards
- longer history or supporting context below

This keeps the page useful on phones even in short sessions.

## Less frequent routes

Routes reached through `Еще` should be optimized for readability rather than trying to preserve the exact desktop composition. Administrative and analytics-heavy views may remain information-dense, but they must still:

- collapse into readable mobile cards
- avoid width-driven grouping
- preserve action visibility

## Technical Design

## Breakpoint strategy

The dedicated mobile shell should activate only on phone widths, explicitly `767px` and below. Tablet and desktop should continue using the current layout logic, with only shared overflow and spacing improvements where helpful.

The implementation should remain mobile-first in CSS:

- base styles favor narrow screens
- larger breakpoints progressively enhance the layout

## Shared routing model

Mobile and desktop must continue to use the same route definitions. The redesign changes shell presentation and page composition, not application structure.

## Shell responsibilities

The shell layer should own:

- sticky header behavior
- mobile bottom navigation
- visibility rules between desktop nav and mobile nav
- content insets and bottom padding for safe navigation

Page components should own:

- content priority and section ordering
- card stacking behavior
- local action grouping

## Safe area and fixed UI

Because the mobile shell includes fixed navigation surfaces, the content area must reserve enough space so buttons, forms, and cards are never hidden behind the bottom bar.

The implementation should account for:

- sticky header height
- bottom navigation height
- safe-area inset support where available

## Scope of Code Changes

The redesign should primarily touch:

- app shell and route presentation
- global styles and responsive layout primitives
- mobile treatment for `Overview`, `Friends`, `QR`, and `AI`
- shared panel, card, metric, CTA, and nav overflow behavior

The redesign should avoid:

- backend changes
- route rewrites
- feature-scope expansion unrelated to mobile usability

## Error Handling and Edge Cases

The mobile layout must remain robust when:

- labels are unusually long
- cards contain dynamic values with larger text
- action groups have more than one button
- sections are empty, loading, or error states
- users navigate across routes with fixed header and fixed bottom nav active

Empty and error states should remain readable and tappable within the constrained mobile shell.

## Testing Strategy

## Manual verification

Mobile verification should explicitly cover:

- phone-width navigation without overlap
- no horizontal scrolling
- clear route switching through bottom nav
- correct bottom spacing under fixed navigation
- readable content order on `Overview`, `Friends`, `QR`, and `AI`

## Frontend verification

Frontend verification should cover:

- route rendering with mobile shell enabled
- visibility rules for desktop nav versus mobile nav
- stable loading, empty, error, and success states on phone widths
- no regressions to desktop shell behavior

## Success Criteria

- The phone header and navigation no longer conflict or overlap.
- Core actions are reachable with one-handed, thumb-friendly navigation.
- Pages read naturally on phones without horizontal scrolling.
- `Friends`, `QR`, and `AI` feel like intentional mobile screens, not compressed desktop panels.
- Desktop behavior remains intact.

## Recommended Implementation Order

1. Update the shell so mobile and desktop share routes but render different navigation patterns.
2. Add the mobile sticky header and bottom navigation.
3. Introduce shared responsive layout rules for cards, metrics, buttons, and text wrapping.
4. Reorder and restyle `Overview`, `Friends`, `QR`, and `AI` for mobile priority flow.
5. Validate phone and desktop behavior before any extra polish.
