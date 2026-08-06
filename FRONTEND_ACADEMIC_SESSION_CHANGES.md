# Academic Session — Backend Changes (2026-07-25)

## Overview
Two backend behavior changes to the Academic Session feature that the frontend needs to account for. No request/response body shapes changed — only new server-side behavior and one new class of validation error.

---

## 1. Sessions can now auto-transition without any admin action

A daily cron job (runs 12:30 AM IST) now does two things automatically:
- Marks the current `Active` session as `Completed` once its `endDate` has passed.
- Activates the next `Upcoming` session once its `startDate` has arrived (only if no session is currently `Active`).

Manual activation (`PUT /api/academic-sessions/:id/activate`) still works exactly as before — this is in addition to it, not a replacement.

### Why this matters for frontend
**The "current active session" can change silently overnight, with no admin interaction.** If the frontend fetches `GET /api/academic-sessions/active` once (e.g. at login) and caches it for the rest of the day/session (Redux store, localStorage, React context, etc.), it can go stale without any signal.

### What frontend should do
- Re-fetch `GET /api/academic-sessions/active` whenever a session-dependent screen is opened (student admission, fee/invoice screens, attendance, promotions) — don't rely on a value cached at login.
- If there's a persistent "Current Session: 2025-26" indicator (e.g. top nav / sidebar), refresh it periodically (e.g. on tab focus, or once per app load) rather than only once per login.
- No response shape change — same fields as before, just needs to be fetched more often.

---

## 2. New validation on session create/update

Endpoints affected:
- `POST /api/academic-sessions`
- `PUT /api/academic-sessions/:id`

Two new validation failures (HTTP 400) that did not exist before:

| Condition | Error message |
|---|---|
| `startDate` is not before `endDate` | `startDate must be before endDate` |
| Date range overlaps an existing session (any status) | `Date range overlaps with existing session "<name>" (<startDate> to <endDate>)` |

### Response shape (standard error format for this API)
```json
{
  "success": false,
  "error": "Date range overlaps with existing session \"2025-26\" (2025-04-01 to 2026-03-31)"
}
```

### What frontend should do
- Make sure the create/edit Academic Session form surfaces the `error` field from the response as a toast or inline field error — confirm it's not being swallowed by a generic "Something went wrong" handler.
- Optional (nice-to-have, not required since backend enforces it either way): pre-validate on the client by fetching `GET /api/academic-sessions` and warning the admin before submit if the chosen dates overlap an existing session — saves a round trip.

---

## No changes to
- Request/response field shapes of any `/api/academic-sessions/*` endpoint.
- Auth/permissions — still admin-only for create/update/delete/activate, admin+teacher for read endpoints.

---

## Quick test checklist for frontend
- [ ] Create a session with dates overlapping an existing one → error toast shows the new overlap message (not a generic error).
- [ ] Create a session with `startDate` after `endDate` → error toast shows "startDate must be before endDate".
- [ ] Confirm the "current session" indicator (wherever shown in the UI) updates without requiring logout/login or a hard page reload, once a session has auto-transitioned server-side.

## Backend files changed (for reference)
1. `src/modules/academicSession/academicSession.service.js` — added `autoTransitionSessions()`, `assertNoOverlap()`, date-range validation in `createSession`/`updateSession`.
2. `src/modules/academicSession/academicSession.cron.js` — new daily cron (12:30 AM IST) running the auto-transition.
3. `src/app.js` — registers the new cron on startup.
