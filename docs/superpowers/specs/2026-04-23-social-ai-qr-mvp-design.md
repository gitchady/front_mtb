# Social, AI, QR MVP Design

## Context

The current `MTB Galaxy` web MVP already implements the main galaxy flow, planets, mini-games, quests, rewards, referrals, leaderboard, and admin tooling. The original Word plan, however, explicitly called out three additional user-facing modules that are still missing as first-class product surfaces:

- `Friends`
- `AI`
- `QR`

This design defines how to add those missing modules as a coherent MVP without introducing fake integrations, disconnected placeholder screens, or a second UI paradigm.

Date: `2026-04-23`

## Goals

- Add a dedicated `Friends` screen as a first-class route in the current app shell.
- Add a dedicated `QR` screen that both generates a personal code and resolves incoming codes.
- Add a dedicated `AI` screen that behaves like a useful in-product assistant without depending on an external LLM.
- Keep all three modules connected so they feel like one product capability rather than unrelated demos.
- Preserve the current visual language, routing model, and backend architecture.
- Implement the feature as a real backend-backed MVP, not local-only mock pages.

## Non-Goals

- No external AI provider integration in this iteration.
- No camera-based QR scanning in this iteration.
- No complex social graph, chat, notifications, or friend recommendations.
- No redesign of the overall shell or replacement of existing referral flows.
- No attempt to merge these modules into hidden subfeatures inside existing pages.

## Product Direction

The chosen approach is the recommended “Assistant Hub” model:

- `Friends`, `QR`, and `AI` are separate routes in the main app navigation.
- The modules are linked through clear actions:
  - `Friends` can generate/share a friend QR flow.
  - `QR` can resolve friend, referral, action, and assistant-related payloads.
  - `AI` can explain QR content and recommend next actions based on user state.

This keeps the feature set visible, product-shaped, and aligned with the original plan.

## Information Architecture

### New routes

- `/app/friends`
- `/app/qr`
- `/app/ai`

### Navigation

Add explicit top-level entries to `appLinks` in the existing shell:

- `Друзья`
- `QR`
- `AI`

These routes should be visible alongside the existing app routes, not nested under hidden secondary navigation.

### Existing route responsibilities

- `ReferralsPage` remains focused on referral mechanics and campaign-like invite behavior.
- `FriendsPage` becomes the user-facing social relationship screen: friend list, pending invitations, simple activity, and quick actions.

## User Experience

## FriendsPage

### Purpose

Act as the social hub for user-to-user relationships in the MVP.

### Core UI blocks

- Summary header with counts:
  - accepted friends
  - pending invites
  - recent social activity
- Friend list
- Pending invite list
- Activity stream
- Quick actions:
  - invite manually
  - show my QR
  - open AI suggestions

### MVP behaviors

- User can send a friend invite.
- User can accept an incoming pending invite.
- User can open the QR screen with friend-invite context.
- User can open the AI screen to get social recommendations.

### Empty states

- No friends yet
- No pending invites
- No social activity yet

## QrPage

### Purpose

Support both outbound and inbound QR-based flows on one screen.

### Core UI blocks

- `Мой QR` section:
  - generated payload for current user
  - rendered code or shareable encoded value
  - quick description of what the code does
- `Сканировать / вставить код` section:
  - text area/input for payload
  - resolve button
  - parsed result panel

### Supported payload types

- `friend_invite`
- `referral_invite`
- `deep_link_action`
- `ai_context`

### MVP behaviors

- Generate a personal payload for current user.
- Paste a payload and resolve it via API.
- Show normalized result:
  - type
  - title/description
  - validity
  - suggested CTA
- Allow transition to next action:
  - add friend
  - open referral flow
  - go to a deep-linked feature
  - open AI explanation

### Non-goals for this iteration

- No device camera scanner.
- No native share flow requirement.

## AiPage

### Purpose

Provide a useful in-product assistant backed by application rules and current user data.

### Positioning

This is not a general-purpose chatbot and not an LLM façade. It is a product assistant that produces contextual advice from backend data already available in the system.

### Core UI blocks

- Session message history
- Quick action prompts
- Recommendation cards
- Context summary:
  - profile
  - weak planet / progress gaps
  - near-complete quests
  - social suggestions
  - QR interpretation when relevant

### Quick prompts in MVP

- What should I do next?
- Which quest is closest to completion?
- Which planet needs attention?
- Explain this QR code.
- How can I use friends/referrals better?
- Why did a risky event appear?

### MVP behaviors

- User sends a text prompt or taps a quick prompt.
- Backend returns:
  - answer text
  - optional action suggestions
  - optional related entities
- AI can explain QR payloads and connect the user to the right next step.

## Backend Design

## Friends domain

### New persistence

Add a friend relationship model separate from the existing referral model.

Suggested fields:

- `friendship_id`
- `requester_user_id`
- `target_user_id`
- `status` with values `pending | accepted`
- `source` with values `manual | qr | referral`
- `created_at`
- `accepted_at`

### Core rules

- User cannot invite themself.
- Duplicate active relationships should be rejected.
- Accepting a request changes status from `pending` to `accepted`.
- Activity is lightweight and derived, not a fully separate social feed system.

### API surface

- `GET /friends?user_id=...`
- `POST /friends/invite`
- `POST /friends/accept`
- `GET /friends/activity?user_id=...`

### Activity source

Activity can be derived from existing product data:

- recent game runs
- recent rewards
- referral actions
- quest progress or completion summaries

This keeps MVP scope controlled while still making the screen feel alive.

## QR domain

### Principle

The backend validates and resolves QR payloads; it does not perform image scanning.

### Personal payload generation

The system should be able to generate a structured payload for the current user that can later be encoded/rendered by the UI.

### Payload contract

A normalized payload should include:

- `type`
- `version`
- `issued_for_user_id`
- `source`
- `meta`

The exact serialized representation can be JSON text in MVP.

### API surface

- `GET /qr/me?user_id=...`
- `POST /qr/resolve`

### Resolve response

Return normalized parsed output:

- `resolved_type`
- `valid`
- `title`
- `description`
- `cta_kind`
- `cta_target`
- `raw_payload`

## Assistant domain

### Principle

Use a deterministic rule-based assistant backed by real application context.

### Context inputs

- galaxy profile
- quests
- rewards ledger
- game summary
- referrals
- friends data
- optional QR resolution context
- optional risk/admin-related signals if relevant to the user

### API surface

- `GET /assistant/context?user_id=...`
- `POST /assistant/chat`

### Chat response structure

The response should support:

- `message`
- `suggested_actions`
- `related_modules`
- `context_chips`

### Behavior model

The assistant should answer through product rules, for example:

- identify closest quest to completion
- point out underdeveloped planet
- recommend a game to improve progress
- explain a QR payload in plain language
- recommend inviting or accepting friends
- explain why a risky transaction may have been flagged

This gives the user a useful, credible MVP while preserving a future path to true model-based AI.

## Frontend Design

## Routing and app shell

- Extend `router.tsx` with three new lazy routes:
  - `FriendsPage`
  - `QrPage`
  - `AiPage`
- Add matching top-level navigation items.
- Keep styling aligned with existing shell panels, cards, metric chips, and call-to-action patterns.

## State and API client

- Extend `apps/web/src/lib/api.ts` with friend, QR, and assistant methods.
- Reuse existing request patterns and error handling style.
- Prefer server-driven data over local-only mocks.

## Page-level expectations

### FriendsPage

- Query-backed loading state
- error state
- empty state
- success state with friend list, pending invites, and activity

### QrPage

- Query-backed “my QR” section
- local input state for pasted payload
- mutation-backed resolve flow
- clear result block for valid/invalid payloads

### AiPage

- initial context query
- mutation-backed conversation prompt submission
- in-session local history state on the client
- quick actions that call the same assistant endpoint

## Integration Links

- `FriendsPage` -> `QrPage` with friend invite context
- `QrPage` -> `AiPage` for explanation flow
- `AiPage` -> `FriendsPage`, `QrPage`, or existing routes via suggested actions

## Testing Strategy

## Backend tests

Add tests for:

- friend invite success
- self-invite rejection
- duplicate invite/relationship rejection
- friend accept success
- friends list and activity output
- QR payload generation
- QR resolve success for valid payloads
- QR resolve failure for invalid payloads
- assistant context response
- assistant chat response for supported quick prompts

## Frontend tests

Add tests for:

- route availability for `/app/friends`, `/app/qr`, `/app/ai`
- page rendering in loading, empty, error, and success states
- QR resolve interaction
- AI quick prompt interaction
- social action CTA wiring
- navigation visibility for the new top-level links

## Verification

Before claiming completion, the implementation must pass:

- `npm run test:api`
- `npm run test:web`
- `npm run build:web`
- `npm run contracts:generate`

## Implementation Phases

1. Add backend models, schemas, and routes for friends, QR, and assistant.
2. Add or update API contracts and generated frontend types as needed.
3. Extend web API client methods.
4. Add routes and top-level navigation entries.
5. Implement `FriendsPage`, `QrPage`, and `AiPage`.
6. Wire cross-screen actions and CTA flows.
7. Add backend and frontend tests.
8. Run full verification.
9. Update the Word document so it reflects actual implemented functionality.

## Risks and Guardrails

- Do not fake external AI behavior with misleading UI language.
- Do not bury the new modules behind existing pages; the user must see them as first-class screens.
- Do not introduce camera-scanning scope into this MVP.
- Do not overload referrals to represent all friendship behavior.
- Keep the social activity feed derived and lightweight.

## Acceptance Criteria

- User can open dedicated `Friends`, `QR`, and `AI` screens from main navigation.
- User can send and accept a friend invitation.
- User can view a personal QR payload and resolve an incoming payload.
- User can receive contextual assistant responses based on their real product state.
- QR, friends, and assistant flows are linked through visible CTA actions.
- Existing routes and current functionality remain operational.
