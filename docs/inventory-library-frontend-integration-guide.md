# Inventory & Library Module — Frontend Integration Guide

**Audience:** frontend engineers building the UI against `src/modules/inventory`.
**Backend reference:** `docs/library-inventory-management-proposal.md` (product spec), `src/modules/inventory/inventory.routes.js` (source of truth for every route/validator), `postman/BrainBuilder_Inventory_Library_Module.postman_collection.json` (importable, runnable examples of every call below).

This doc tells you **what screens to build, in what order to call the APIs, and which business rules the UI must enforce** (not just display). It does not repeat full request/response schemas for every field — for that, run the Postman collection and read the live response, or open `inventory.routes.js` next to this doc.

---

## 1. Before you start

- **Base path:** everything in this module is mounted at `/api/inventory/...` (not `/api/...` — easy mistake, this bit us during our own testing).
- **Auth:** same JWT Bearer pattern as the rest of the app — `Authorization: Bearer <token>` from the existing login flow. No new auth mechanism.
- **Response envelope:** every endpoint returns `{ success: boolean, ... }`. On success you'll additionally get `data` (single resource), or `data` + `total`/`page`/`pages`/`count` (paginated list), or `count` + `data` (unpaginated list). On failure: `{ success: false, error: "message" }` or `{ success: false, message: "message" }` — check both keys defensively when rendering error toasts.
- **Validation errors** come back as HTTP 400 with a single combined `error` string (comma-separated if multiple fields failed) — there's no per-field error array, so you can't highlight individual form fields from the response alone. Validate the obvious required fields client-side before submitting (see each screen's rules below) so users rarely hit this.
- **One public endpoint, no token needed:** `GET /api/inventory/items/public` — everything else requires login.

---

## 2. Who sees what

| Role | What they get |
|---|---|
| **Admin / sub-admin** | Everything. No permission checks apply to them — every guarded endpoint auto-allows admin/sub-admin. |
| **Teacher — with a granted permission** | Only the screens matching what's been granted (see table below). A teacher with zero inventory/library permissions granted sees none of these nav items at all. |
| **Teacher — no permission** | Nothing from this module in their nav, **except** two always-available "my own stuff" screens: "My Issued Items" and "My Pending Requests" (Section 3.6) — every teacher can see these regardless of permissions, since it's just their own history. |
| **Parent** | "My Items" (borrow/purchase history), Wishlist, "My Deposits" — read-only, self-service. Parents never call borrow/buy/return/refund endpoints directly; staff record those on their behalf at the counter. |
| **Public visitor (no login)** | Read-only catalog page — items an Admin explicitly marked public. |

### How to gate the nav: fetch the teacher's permissions once after login

```
GET /api/teachers/my-profile          (role: teacher only)
Authorization: Bearer <token>
```

Response includes the full teacher doc, with a `data.permissions` object. Cache it in your app/auth state right after login (same place you'd cache the logged-in user), and use it to decide which nav items/routes to render. Don't re-fetch per-screen.

| Permission key | Unlocks in the UI |
|---|---|
| `canManageLibraryCatalog` | Create/edit Library-side items (books, toys) — Section 3.2 |
| `canManageLibraryIssue` | The Library Desk — borrow/buy/return/renew — Section 3.7 |
| `canViewLibraryReports` | Read-only library reports |
| `canManageInventoryStockIn` | Stock In screen — Section 3.5 |
| `canManageInventoryStockOut` | Request an item issue — Section 3.6 |
| `canManageInventoryCatalog` | Create/edit Inventory-side items (stationery, uniform) + Categories |
| `canViewInventoryReports` | Read-only inventory reports |

A teacher can have any combination — e.g. only `canManageLibraryIssue` (runs the library counter, can't touch stock or pricing). Design the nav so each permission independently reveals its one screen; don't bundle them.

Since `Item` records can carry **both** consumable and lendable/sellable types on one row (Section 3.2), the backend's write-guard for Item create/edit accepts **either** `canManageInventoryCatalog` **or** `canManageLibraryCatalog` — don't try to split the Item Master screen by permission internally, just gate the whole screen on "has at least one of the two."

---

## 3. Screens & flows

### 3.1 Categories (Admin / catalog-permission teacher)

Simple CRUD list+form. One thing to get right in the form:

- **`directIssueAllowed`** (toggle, default off) — "Should items in this category skip Admin approval when a teacher issues them?" Label it plainly, e.g. *"Let staff issue items in this category without approval."* Most categories should stay off (that's the doc's default stance).
- **`freeForClasses`** (multi-select of classes) — "Which classes get everything in this category for free?" Pull the class list from the existing `GET /api/classes` endpoint you already use elsewhere.

```
GET    /api/inventory/categories             list (any logged-in staff)
GET    /api/inventory/categories/:id         detail
POST   /api/inventory/categories             { name, description, directIssueAllowed, freeForClasses[] }
PUT    /api/inventory/categories/:id         same fields, all optional
DELETE /api/inventory/categories/:id         blocked (400) if any active item still uses it — surface that message as-is, it's already user-readable
```

### 3.2 Item Master (Admin / catalog-permission teacher)

This is the biggest form in the module. Fields and how to present them:

| Field | UI | Notes |
|---|---|---|
| `name`, `category` (select), `unit` | plain inputs | `category` is a dropdown from 3.1's list |
| `itemTypes` | **multi-select checkboxes**: Consumable / Lendable / Sellable | Not radio — an item can be more than one. Send as a real array in JSON, or a comma-separated string if you're using multipart form-data (the backend normalizes both). |
| `currentStock` | **not editable here** | Stock only changes via Stock In (3.5) / Stock Out (3.6) / Lending (3.7). Show it read-only on the edit form with a note ("use Stock In to add stock"). |
| `minStockLevel` | number | drives the low-stock alert/report |
| `sellingPrice` | number | also doubles as the reference value for the deposit safety check (3.7) |
| `securityDepositAmount` | number | informational default only — the deposit actually collected is entered per-borrow, not read from here |
| `availableForSale` | **toggle, default OFF** | Do not default this on. Label: *"Allow parents to buy this item outright."* |
| `directIssueOverride` | **tri-state control** — "Use category default" / "Always direct-issue" / "Always require approval" | Maps to `null` / `true` / `false`. This is the item-level override from Section 4.3 — most items should stay on "use category default." |
| `classPricing.override` + `classPricing.freeForClasses` | toggle + multi-select, shown only when the toggle is on | *"Override this category's free-class list for this specific item."* When off, the category's `freeForClasses` applies automatically — don't duplicate that list into the form by default. |
| `isPublic` | toggle, default off | *"Show on the public website."* |
| `trackByCopy` | toggle, default off | Forward-compatibility flag only — no per-copy screen exists yet, so just persist the toggle, don't build UI around it. |
| photo | file upload | multipart field name is `photo`, same pattern as every other photo upload in this app (advertisements, students, etc.) |

```
GET    /api/inventory/items?search=&category=&itemType=&isActive=&availableForSale=&page=&limit=
GET    /api/inventory/items/:id
POST   /api/inventory/items          multipart/form-data (photo optional)
PUT    /api/inventory/items/:id      multipart/form-data, all fields optional
DELETE /api/inventory/items/:id      SOFT delete ("retire") — item disappears from active lists but transaction history keeps pointing at it. Label the button "Retire," not "Delete."
```

### 3.3 Public Catalog page (no login)

A read-only page/widget for the school's public site.

```
GET /api/inventory/items/public?search=&category=&page=&limit=
```

Returns only `{ id, name, category, itemTypes, photo, price, availableForSale }` — `price` is `null` unless `availableForSale` is true, so render "Contact school" or similar when it's null instead of "₹null". There's no stock count, vendor, or cost in this response by design — don't expect it.

Pair this page with a "Interested? Enquire now" CTA that goes to your existing Enquiry form — that's the intended path from "saw item on public page" → Enquiry → (existing) Convert to Student, per the product doc. No inventory API is involved in that hand-off.

### 3.4 Bulk Upload wizard (Admin / catalog-permission teacher)

Three-step wizard, not a single upload button:

1. **Download template** — `GET /api/inventory/items/bulk/template` returns a binary `.xlsx` (set `responseType: 'blob'` in your HTTP client and trigger a file download). It includes a second sheet listing valid existing category names, to reduce typos.
2. **Upload → Preview** — `POST /api/inventory/items/bulk/preview`, multipart field `file`. Response is `{ rows: [...], totalRows, validCount, errorCount }`, where each row has `isValid` + an `errors[]` array and every parsed field. **Render this as an editable table** — one row per spreadsheet row, error rows highlighted with their specific error messages, so the admin can fix a typo'd category name or missing price inline before committing. This step **saves nothing** yet.
3. **Commit** — `POST /api/inventory/items/bulk/commit` with `{ rows: <the same array, edited> }` in the JSON body (not the file again). Rows still marked `isValid: false` are silently skipped and reported back under `skipped` — show that list to the admin after commit ("3 created, 1 skipped: row 4, missing price").

If a `categoryName` in a row doesn't match an existing category (`categoryExists: false`), the commit step auto-creates that category — mention this in the review table ("this will create a new category").

### 3.5 Stock In (Admin / `canManageInventoryStockIn` teacher)

A simple form, item picker + quantity:

```
POST /api/inventory/stock-in
{ itemId, packetCount, piecesPerPacket, vendorName, vendorContact, billNumber, billDate, totalCost, notes }
```

Let the user enter **either** `quantityAdded` directly, **or** `packetCount` + `piecesPerPacket` (the backend multiplies them if `quantityAdded` is omitted) — a toggle between "I know the total pieces" and "I know packets × pieces-per-packet" covers both real-world cases (loose stock vs. cartons). Show the resulting total live as they type packet/piece counts.

`GET /api/inventory/stock-in?itemId=&page=&limit=` for the history list.

### 3.6 Stock Out / Issue — two different screens

This is the approval workflow (Section 4.3 of the product doc) — **design the default assumption as "this will need approval,"** not the other way round.

**Teacher's screen — "Request an Item":**
```
POST /api/inventory/stock-out
{ itemId, quantity, issuedToTeacherId, classId, purpose }
```
The response tells you what happened — check `data.status`:
- `"issued"` → done immediately, show a success toast ("Issued — no approval needed").
- `"pending"` → show "Sent to Admin for approval," and the item stays out of the teacher's hands until approved.

Don't try to predict client-side whether an item is exempt — just submit and branch on the response status. (If you want to show a hint beforehand, the item's `directIssueOverride` and its populated `category.directIssueAllowed` are both in the Item detail response — resolve them the same way the backend does: item override wins if not null, else category default.)

Every teacher (regardless of permissions) can see their own:
```
GET /api/inventory/stock-out/my-items       — issued to them
GET /api/inventory/stock-out/my-requests    — still pending
```

**Admin's screen — "Approval Queue":**
```
GET   /api/inventory/stock-out?status=pending
PATCH /api/inventory/stock-out/:id/approve   { note }
PATCH /api/inventory/stock-out/:id/reject    { note }
```
A simple list with two buttons per row. `note` is optional on both — make it a small textarea, not required.

### 3.7 Library Desk — Borrow / Buy / Return / Renew (Admin / `canManageLibraryIssue` teacher)

**This screen is staff-operated, at a counter — parents never call these endpoints themselves.** Design it like a point-of-sale screen: pick parent/student → pick item → choose Borrow or Buy → confirm.

**Borrow:**
```
POST /api/inventory/lending/borrow
{ itemId, parentId, studentId, quantity, dueDate, depositCollected, depositPaymentMode, depositTransactionRef, notes }
```

Two rules the UI **must** enforce before submit, not just let the API reject:

1. `dueDate` is required — default it to "today + N days" (pick a sensible default like 14 days, editable) rather than leaving it blank.
2. **The deposit safety check.** Look up the item's `sellingPrice` (from the item you already fetched to build the picker) and compare live against whatever the staff types into `depositCollected`. If it's short, show an inline red warning **before** they hit submit: *"This item is worth ₹250 — collect at least ₹250 deposit."* Still let them submit (the backend is the real gate and will 400 with the same message if they ignore the warning) — the point is to save them a round trip, not to be the only place this is checked.
3. If `depositCollected > 0`, `depositPaymentMode` becomes required (enum: `cash | upi | bank_transfer | cheque | card | other`) — show that field only once an amount is entered, and mark it required at that point.

**Buy:**
```
POST /api/inventory/lending/purchase
{ itemId, parentId, studentId, quantity, notes }
```
Only show "Buy" as an option for items where `availableForSale === true` — filter the item picker accordingly, don't show a Buy button that will 400.

**Return:**
```
PATCH /api/inventory/lending/:id/return
{ returnCondition: "good" | "damaged" | "lost" }
```
Make this a 3-way choice, not a plain "mark returned" button — the condition matters:
- `good`/`damaged` → item goes back on the shelf, **deposit is NOT auto-refunded** (stays held — that's Section 3.8's job).
- `lost` → item does **not** go back on the shelf, and the linked deposit is **automatically forfeited**, no extra staff action. Say so in the confirmation dialog ("Marking this lost will forfeit the ₹250 deposit automatically") so it isn't a surprise.

**Renew:**
```
PATCH /api/inventory/lending/:id/renew
{ newDueDate }
```
A simple date-picker action from the active-loans list.

**Listing:**
```
GET /api/inventory/lending?status=&itemId=&parentId=&page=&limit=
```
Every row includes `isOverdue: boolean` (computed by the backend) — use it to color/badge overdue rows red without doing date math yourself.

### 3.8 Security Deposits (Admin / `canManageLibraryIssue` teacher)

A ledger screen — **do not build this as part of the fee/payment UI**, it's intentionally a separate ledger (see the product doc's explanation of why deposits aren't merged with the fee wallet).

```
GET /api/inventory/deposits?status=held&parentId=&page=&limit=
GET /api/inventory/deposits/summary          — { totalHeld, depositsHeldCount, byParent: [...] }
```
Build the "kiska kitna deposit hai" view straight off `/summary`'s `byParent` array — that's already grouped and sorted by amount held.

**Refund** (only enabled once the linked lending transaction is `returned` — the API 400s otherwise, so check `deposit.lendingTransaction.status` before enabling the button):
```
PATCH /api/inventory/deposits/:id/refund
{ mode, transactionRef, deductionAmount, deductionReason, note }
```
`deductionAmount` + `deductionReason` are for the "damaged, keep ₹50 for repair" case — make this an optional expandable section in the refund form, not two always-visible fields; if the staff enters a deduction amount without a reason, the API rejects it, so make the reason field required-once-touched client-side too.

**Forfeit** (manual — for scenarios other than "reported lost," which already auto-forfeits):
```
PATCH /api/inventory/deposits/:id/forfeit
{ reason }
```

### 3.9 Parent Portal — My Items, Wishlist, My Deposits

Three self-service, read-mostly screens.

```
GET  /api/inventory/lending/my-history       — { transactions: [...], wishlist: [...] } in ONE call
GET  /api/inventory/wishlist/my-list
POST /api/inventory/wishlist                 { itemId }
DELETE /api/inventory/wishlist/:itemId
GET  /api/inventory/deposits/my
```

`lending/my-history` already returns the wishlist alongside transactions — if your "My Items" screen has a Wishlist tab, you can render both from that single call rather than firing a second request, unless you need the wishlist independently elsewhere (e.g. an item detail page's "♥ Wishlist this" button, which should use the plain `wishlist/my-list` + POST/DELETE instead).

Add a heart/wishlist icon on the public catalog page and any parent-facing item view — `POST /wishlist` with just the `itemId`; toggle to `DELETE` if already wishlisted (check membership against `wishlist/my-list`).

### 3.10 Reports & Dashboard (Admin / report-permission teacher)

```
GET /api/inventory/reports/dashboard        — the one-screen overview: stock value, category breakdown, pending approvals, active/overdue borrows, top borrowed + top wishlisted
GET /api/inventory/reports/overdue
GET /api/inventory/reports/low-stock
GET /api/inventory/reports/monthly-expense?month=&year=
```
`dashboard` is a good landing screen for this whole module (put a "Inventory & Library" tile on the admin home screen that links here). The other three are drill-downs you can either link to from dashboard tiles or list as separate report pages.

---

## 4. State machines to design around

**StockIssue** (internal issue to a teacher):
```
pending ──approve──▶ issued
   └──────reject───▶ rejected
(direct-issue-exempt requests skip straight to "issued", never touch "pending")
```

**LendingTransaction** (`transactionType: "borrow"`):
```
active ──return(good/damaged)──▶ returned   (deposit stays "held")
active ──return(lost)──────────▶ returned   (linked deposit auto → "forfeited")
```
(`transactionType: "purchase"` transactions go straight to `completed`, no return flow.)

**SecurityDeposit:**
```
held ──refund──▶ refunded
held ──forfeit (manual, or auto on "lost" return)──▶ forfeited
```
A deposit only reaches `held` in the first place if `depositCollected > 0` on the borrow — free/no-deposit borrows have `securityDeposit: null` on the transaction; check for that before rendering a "view deposit" link.

---

## 5. Enum reference

| Field | Values |
|---|---|
| `Item.itemTypes[]` | `consumable`, `lendable`, `sellable` |
| `StockIssue.status` | `pending`, `issued`, `rejected`, `cancelled` |
| `LendingTransaction.transactionType` | `borrow`, `purchase` |
| `LendingTransaction.status` | `active`, `returned`, `completed`, `cancelled` |
| `LendingTransaction.returnCondition` | `good`, `damaged`, `lost` |
| `SecurityDeposit.status` | `held`, `refunded`, `forfeited` |
| `paymentMode` (deposit collect + refund) | `cash`, `upi`, `bank_transfer`, `cheque`, `card`, `other` |

---

## 6. Full endpoint reference

| Method | Path | Who |
|---|---|---|
| GET | `/items/public` | anyone |
| GET, POST, PUT, DELETE | `/categories`, `/categories/:id` | catalog-permission staff |
| GET, POST, PUT, DELETE | `/items`, `/items/:id` | catalog-permission staff |
| GET | `/items/bulk/template` | catalog-permission staff |
| POST | `/items/bulk/preview`, `/items/bulk/commit` | catalog-permission staff |
| POST, GET | `/stock-in` | `canManageInventoryStockIn` |
| POST, GET | `/stock-out` | `canManageInventoryStockOut` |
| GET | `/stock-out/my-items`, `/stock-out/my-requests` | any teacher |
| PATCH | `/stock-out/:id/approve`, `/stock-out/:id/reject` | admin/sub-admin only |
| POST | `/lending/borrow`, `/lending/purchase` | `canManageLibraryIssue` |
| PATCH | `/lending/:id/return`, `/lending/:id/renew` | `canManageLibraryIssue` |
| GET | `/lending` | `canManageLibraryIssue` or `canViewLibraryReports` |
| GET | `/lending/my-history` | parent |
| GET, POST, DELETE | `/wishlist/my-list`, `/wishlist`, `/wishlist/:itemId` | parent |
| GET | `/deposits`, `/deposits/summary` | `canManageLibraryIssue` or `canViewLibraryReports` |
| GET | `/deposits/my` | parent |
| PATCH | `/deposits/:id/refund`, `/deposits/:id/forfeit` | `canManageLibraryIssue` |
| GET | `/reports/*` | report-permission staff |

All prefixed with `/api/inventory`.

---

## 7. Business rules the frontend must not skip

These are enforced server-side too, but showing them client-side is what makes the UI feel correct instead of "submit and see":

1. **Deposit ≥ item price**, checked live in the borrow form (3.7).
2. **Available-for-sale defaults off** — don't let a new item accidentally show a "Buy" button.
3. **Approval is the default**, exemption is the opt-in — phrase toggles as "let them skip approval," not "require approval."
4. **Item-level settings override category-level ones** for both direct-issue and class-pricing — when an item has its own override on, gray out or hide the inherited category value so it's clear which one is live.
5. **Lost → auto-forfeit, no separate step.** Don't build a "now go forfeit the deposit" follow-up prompt after marking an item lost — it already happened.
6. **Item delete = retire, not erase.** Reflect that in the button label and confirmation copy.
