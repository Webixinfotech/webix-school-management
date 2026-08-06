# Software Requirement Specification (SRS) & Technical Implementation Document

## Feature: Attendance Correction & Billing Sync (Flexi-Hours Integrity)

**Project:** Brain Builder International — Backend API (`brainbuilder_backend`)
**Module:** `src/modules/attendance`
**Document Version:** 1.0
**Status:** Ready for Development
**Author:** Product / Tech Analysis (based on client brief "Attendance Correction & Billing Sync")

---

## 1. Executive Summary

Today, attendance is captured two ways: a live **QR scan** at the gate/classroom and **manual entry** by admin/teacher. Billing for extended stay ("Flexi-Hours") is only ever derived from the **Center Session gate flow** (`centerCheckIn` / `centerCheckOut`). Manual attendance entries — including corrections to a teacher's mistake — are saved but are **never validated against the class timetable and never affect Flexi-Hours billing**.

This feature gives admin (and sub-admin) safe, auditable tools to:

1. Correct/add any attendance record for any date, validated against the timetable exactly like a live scan.
2. Reassign a record that landed on the wrong student (e.g., scanned wrong QR) in one guided action — fixing **both** children's attendance and billing together.
3. Void a mistaken record, automatically reversing only the billing that record contributed.
4. Repeat corrections without the Flexi-Hours balance drifting or being double-counted.
5. See, before saving, who originally marked a record and when, plus a mandatory reason kept as a permanent correction trail.

It also fixes a known **Flexi-Hours display bug** where a fully depleted plan still showed hours as "available" instead of switching to an "Extra Stay" view.

Crucially, **none of this changes the existing QR scan, gate check-in/out, or already-recorded history**. Corrections only apply when an admin actually touches a record.

---

## 2. Business Objective

| Objective | Description |
|-----------|-------------|
| Accuracy | Manual corrections must be judged by the **same timetable rule** as real scans (class-time vs. Flexi-Time). |
| Billing Integrity | Flexi-Hours must be **recomputed from the full picture** for `student + day`, never naively added on top. Repeated corrections cannot inflate/deflate a balance. |
| Correctness on error | Wrong-student scans and mistaken records can be cleanly fixed/voided without orphaned billing. |
| Traceability | Every admin override of someone else's entry leaves a clear trail: who marked originally, who changed it, when, and why. |
| Trust | Parents/teachers can get a factual answer when they question a charge. |
| Non-regression | The existing QR scan and gate flows keep working exactly as today. |

---

## 3. Current System Behavior (as implemented)

> Mapped from the actual codebase so developers understand what must stay intact.

**Attendance capture**
- `scanAttendance(body, user)` — QR scan, always marks `Present`. Looks up student by `qrCode`, resolves class context, upserts one record per `(studentId, attendanceDateKey, sessionLabel)`. Does **not** compute Flexi billing at scan time. (`attendance.service.js:1604`)
- `manualMarkAttendance(body, user)` — admin/teacher manual entry. Saves the record but **intentionally does NOT compute `stayMinutes` / `flexiHoursDeducted`** (comment at `attendance.service.js:1889`): *"Manual entries intentionally do NOT get computed stayMinutes/flexiHoursDeducted (only verified center_session data should affect billing)."*
- `updateAttendance(id, updateData, user)` — generic edit; no timetable validation, no billing recompute. (`attendance.service.js:2131`)
- `centerCheckIn` / `centerCheckOut` — gate session flow via `CenterSession`. On check-out, computes:
  - `totalStayMinutes = outTime - inTime`
  - `classMinutesInSession` = overlap of the session with each Present record's class `startTime`/`endTime`
  - `idleMinutes = max(0, totalStayMinutes - classMinutesInSession)`
  - if `idleMinutes > GRACE_PERIOD_MINS (15)` → `deductedHours = idleMinutes/60`, then **`$inc consumedFlexiHours`** on the Student. (`attendance.service.js:2532`)

**Data model (key fields)**
- `Attendance` (`attendance.model.js`): `studentId, attendanceDateKey, sessionLabel, status, method [qr|manual|system], markedBy, markedByRole, markedByTeacherId, markedAt, checkInTime, checkOutTime, isAutoCheckedOut, stayMinutes, scheduledMinutes, extraMinutes, flexiHoursDeducted, checkoutSource [center_session|manual|cron_auto|null]`.
- Unique index: `(studentId, attendanceDateKey, sessionLabel)`.
- `Student` (`student.model.js`):
  - Per-class `classTimings` map: `startTime, endTime, paidFlexiHours, freeFlexiHours, consumedFlexiHours, assignedHours`.
  - Aggregated top-level: `paidFlexiHours, freeFlexiHours, consumedFlexiHours`.
- `feeSettings`: `flexiHourlyRate` (default 100), `flexiGracePeriodMinutes` (default 15).
- `CenterSession` (`centerSession.model.js`): `studentId, dateKey, inTime, outTime, status [ACTIVE|COMPLETED|MISSED_CHECKOUT], totalStayMinutes, deductedFlexiHours, notes`.

**Audit**
- `AuditLog` (`audit.model.js`) with `actor, actorRole, action, target{model,id}, changes{before,after,fields}, metadata, status`. Service `audit.service.js` exposes `logCreate/logUpdate/logDelete`.

---

## 4. Problems in the Existing System

| # | Problem | Impact |
|---|---------|--------|
| P1 | Manual corrections are saved but **never validated against the timetable** and **never billed**. | Admin fixing a teacher's error can create records that are inconsistent with real scans and that silently fail to bill (or over/under-bill later). |
| P2 | `consumedFlexiHours` is mutated by **incremental `$inc`** in `centerCheckOut`. Any correction to the source data does not "undo" the earlier increment. | Fixing a record after billing has already run leaves the balance wrong; repeated edits drift. |
| P3 | No clean way to move a record off the **wrong student** when the wrong QR was scanned. | Both the wrong child (billed/attended) and the correct child (missing attendance) stay wrong. |
| P4 | No first-class "void" action. Deleting a record is the only option and leaves its billing contribution in place. | Mistaken records can't be removed cleanly without corrupting the balance. |
| P5 | When admin overrides a teacher's entry, **nothing records that it was an override, who/why/when**. | No traceability for parent/teacher disputes. |
| P6 | Flexi-Hours **display** can show hours as "available" even after the plan is fully consumed (no "Extra Stay" switch). | Parents/admins see misleading balances. |

---

## 5. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Admin/sub-admin can **add or correct** any attendance record for **any date**, for **any student**, including records marked days earlier. |
| FR-2 | Every manual entry/correction is **validated against the class timetable at the exact time it applies to**, applying the same class-time vs Flexi-Time rule used for real scans. |
| FR-3 | Flexi-Hours billing is **always recalculated cleanly from the full picture** for `(student, day)` — never added on top. Repeated corrections cannot double-count or cancel out. |
| FR-4 | Admin can **reassign** a record to the correct student in one guided action; both students' attendance and billing are corrected together. |
| FR-5 | Admin can **void** a record; any billing that record contributed is automatically reversed. The rest of that day's attendance/billing for the student is untouched. |
| FR-6 | Each correction **replaces the previous one cleanly**; the student's Flexi-Hours always reflects only the latest correct information. |
| FR-7 | When admin changes something originally entered by someone else, the system shows **who marked it originally and when**, and stores a **reason** + trail. |
| FR-8 | Flexi-Hours display (Paid / Free / Used / Left, or Extra Stay) always reflects corrected, up-to-date numbers, including the depleted-plan → Extra Stay fix. |
| FR-9 | Existing QR scan and gate check-in/out flows are **unchanged** in behavior and feel. |
| FR-10 | Already-recorded history is **not** bulk-recalculated; corrections apply only when admin touches a record. |

---

## 6. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | **Non-regression:** all existing attendance endpoints continue to pass current tests/behaviour. |
| NFR-2 | **Atomicity:** a correction + its billing recompute + audit writes must be wrapped in a MongoDB session/transaction where possible; partial failure must not leave inconsistent billing. |
| NFR-3 | **Performance:** reconciliation for a single `(student, day)` must complete well under 1s (bounded queries, indexed fields). |
| NFR-4 | **Auditability:** every correction/void/reassign is irreversibly logged. |
| NFR-5 | **Security:** only `admin`/`sub-admin` may correct/void/reassign; teachers keep their current `canMarkAttendance` permission for normal marking only. |
| NFR-6 | **Idempotency:** re-running reconciliation for the same day yields the same `consumedFlexiHours`. |
| NFR-7 | **Backward compatibility:** new fields are additive (defaulted) so old records remain valid. |

---

## 7. User Roles & Permissions

| Role | Can mark (QR/manual) | Can correct/void/reassign | Notes |
|------|----------------------|---------------------------|-------|
| `admin` | Yes | **Yes** | Full correction authority. |
| `sub-admin` | Yes | **Yes** | Same correction authority as admin (per current roleGuard). |
| `teacher` | Yes (with `canMarkAttendance`) | No | Only normal marking; cannot override/correct others. |
| `parent` | No | No | Read-only own children. |

Permission enforcement reuses existing `authGuard` + `roleGuard("admin","sub-admin","teacher")` and `getTeacherAccessContext(..., { requireMarkPermission: true })`. Correction/void/reassign routes use `roleGuard("admin","sub-admin")`.

---

## 8. Complete Feature Breakdown

### 8.1 Admin Correction (manual add/edit with validation)
- Endpoint: `POST /api/attendance/:id/correct` (id = existing record) and `POST /api/attendance/correct` (create new if none).
- Validates inputs, checks timetable, records audit snapshot, recomputes day billing.

### 8.2 Fix Wrong Student (reassign)
- Endpoint: `POST /api/attendance/reassign`.
- Moves a record's content onto the correct student; voids the original (marked `reassigned`); reconciles **both** students' `(day)` billing.

### 8.3 Void
- Endpoint: `POST /api/attendance/:id/void`.
- Marks record `isVoided`, stores who/why/when, reconciles the day so only this record's billing is reversed.

### 8.4 Flexi-Hours Reconciliation Engine
- Internal service `reconcileStudentDayFlexi(studentId, dateKey, actor)` = **single source of truth** for `consumedFlexiHours` for a day.
- Computes the full picture, **SETS** (not increments) `consumedFlexiHours`, and records per-record `flexiHoursBilled`.

### 8.5 Timetable Validation
- Internal `validateRecordAgainstTimetable(record)` → `timetableStatus` ∈ `{within_class, outside_class, no_class}`.
- Stored on the record as `validatedAgainstTimetable=true` + `timetableStatus`.

### 8.6 Correction Trail / Audit
- Embedded `correctionHistory[]` on the record + a global `AuditLog` entry per action.

### 8.7 Flexi-Hours Display (Extra Stay fix)
- Endpoint: `GET /api/attendance/flexi-summary/:studentId?dateKey=YYYY-MM-DD`.
- Returns `paid, free, used(consumed), left, isExtraStay` computed correctly even when depleted.

---

## 9. Business Rules

1. **Same rule as scans:** A correction is judged "class time" if its `checkInTime`–`checkOutTime` (or session overlap) intersects the student's enrolled class timetable for that day; otherwise it is "Flexi-Time" (extra stay) and billable.
2. **Full-picture billing:** `consumedFlexiHours(day)` = Σ over all **non-voided, Present** records for that student+day of their individual `flexiHoursBilled`. Never computed by incrementing.
3. **Per-record billing attribution:** Each Present record carries `flexiHoursBilled`. Voiding removes only that record's contribution; the rest of the day is untouched.
4. **Reassign = move + void:** The original record becomes `isVoided` with reason "Reassigned to correct student" and `reassignedToStudentId` set; the target student gets a new/corrected record carrying the same business data.
5. **Grace period:** Idle/extra minutes under `flexiGracePeriodMinutes` (from `feeSettings`, fallback 15) are **not** billed.
6. **No retro bulk recompute:** Only the day(s) touched by an admin action are reconciled.
7. **Original entry preservation:** On the **first** admin correction of a teacher/system entry, the original `markedBy/markedByRole/markedByTeacherId/markedAt/method` are snapshotted into `originalEntry` and never overwritten.
8. **Reason required:** `reason` is mandatory for correct/void/reassign.
9. **Extra Stay view:** When `left <= 0` (plan fully consumed) the display switches to "Extra Stay" and further extra time is shown as billable/negative-eligible per `feeSettings.flexiHourlyRate`.
10. **Gate flow untouched:** `centerCheckIn/Out` and `scanAttendance` keep their current behaviour. They MAY call the reconciliation engine as a post-step, but must remain behaviour-compatible.

---

## 10. Validation Rules

| Field | Rule |
|-------|------|
| `studentId` / `targetStudentId` | Must resolve to an existing, **Active** student (`ensureStudentIsActive`). |
| `attendanceDate` | `YYYY-MM-DD` (reuse `normalizeAttendanceDate`). |
| `status` | One of `Present, Absent, Late, Leave`. |
| `sessionLabel` | One of `FULL_DAY, MORNING, AFTERNOON, EVENING`. |
| `checkInTime` / `checkOutTime` | Valid ISO date; `checkOutTime >= checkInTime` when both provided; `null` clears the field (existing `$unset` behaviour preserved). |
| `reason` | Required, non-empty, ≤ 500 chars for correct/void/reassign. |
| Duplicate guard | Reject if a non-voided record already exists for `(targetStudentId, attendanceDateKey, sessionLabel)` (reuse existing duplicate check). |
| Access | Admin/sub-admin only for correction/void/reassign; teacher-class scoping preserved for normal marking. |

---

## 11. Edge Cases

| # | Edge Case | Handling |
|---|-----------|----------|
| E1 | Correcting a record changes its **date** to another day. | Reconcile **both** the old and new day for that student. |
| E2 | Reassign target already has a record for that day/session. | Merge into the existing target record (overwrite business fields) rather than creating a duplicate; void the source. |
| E3 | Reassigning to a student with **no enrolled class** that day. | `timetableStatus = no_class`; any extra time is Flexi-Time billable per rules. |
| E4 | Voiding a record that was the **only** billed contributor for the day. | Day recomputes to 0 billed; `consumedFlexiHours(day)` resets; student aggregate reflects it. |
| E5 | Record was already `isVoided`. | Void/correct on a voided record is rejected (or un-void with reason) — choose **reject** to keep history immutable. |
| E6 | Teacher marks Present, then admin corrects to Absent. | Absent contributes **0** flexi billing; reconciliation recomputes accordingly. Original entry retained for audit. |
| E7 | `feeSettings` missing. | Fallback `grace=15`, and billing uses timetable-only logic; log a warning. |
| E8 | Multiple corrections same day by different admins. | Each appends to `correctionHistory`; final state is the latest; billing is always recomputed from data, not stacked. |
| E9 | Center session exists for the day but no attendance records (e.g., gate-only). | Reconciliation uses `CenterSession` idle math as today; attendance-only extra time also considered. Keep current gate math as baseline. |
| E10 | Clock/timezone: all date keys use `DEFAULT_TIMEZONE`/`Asia/Kolkata` (existing `getDateKeyFromParts`). No change. |
| E11 | Parent/teacher tries correction endpoint. | `roleGuard` rejects with 403. |
| E12 | Fully depleted plan but extra stay occurs. | `left = 0`, `isExtraStay = true`; display shows Extra Stay, fee module already charges negative hours (`fee.service.js:251`). |

---

## 12. Database Changes

### 12.1 `Attendance` schema additions (`attendance.model.js`)
Additive fields (all defaulted → non-breaking):

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `isVoided` | Boolean | `false` | Soft-delete for mistaken records. |
| `voidedBy` | ObjectId→User | `null` | Who voided. |
| `voidedAt` | Date | `null` | When voided. |
| `voidReason` | String | `""` | Why voided. |
| `reassignedToStudentId` | ObjectId→Student | `null` | Link from voided original → new correct record. |
| `originalEntry` | Object `{ markedBy, markedByRole, markedByTeacherId, markedAt, method }` | `null` | Snapshot of who originally created the record (filled on first admin correction). |
| `validatedAgainstTimetable` | Boolean | `false` | True if judged by timetable rule. |
| `timetableStatus` | String enum `within_class|outside_class|no_class|null` | `null` | Class-time vs Flexi-Time classification. |
| `flexiHoursBilled` | Number | `0` | This record's contributed Flexi-Hours (so void reverses exactly this). |
| `correctionHistory` | Array of subdocs (see below) | `[]` | Per-change trail. |

`correctionHistory` subdocument:
```js
{
  correctedBy:   { type: ObjectId, ref: "User" },
  correctedByRole: String,
  correctedAt:   { type: Date, default: Date.now },
  reason:        String,
  changeType:    { type: String, enum: ["correct","void","reassign","unvoid"] },
  before:        mongoose.Schema.Types.Mixed, // snapshot of changed fields
  after:         mongoose.Schema.Types.Mixed,
}
```

Indexes: add `isVoided` to queries; consider partial unique index to ignore voided duplicates:
`AttendanceSchema.index({ studentId:1, attendanceDateKey:1, sessionLabel:1, isVoided:1 }, { partialFilterExpression:{ isVoided:false }, ... })` — but keep the **existing** unique index intact for backward compatibility; implement duplicate guards in code instead of changing the unique constraint.

### 12.2 `Student` schema
- No new top-level fields required. `consumedFlexiHours` becomes **driven** by reconciliation (still a Number). Per-class `classTimings.consumedFlexiHours` may optionally be reconciled later; v1 reconciles the **aggregated** `consumedFlexiHours`.
- Add a virtual/method `getFlexiSummary()` (or compute in service) returning `{ paid, free, used, left, isExtraStay }`.

### 12.3 No new collection required
Reuse `AuditLog` for global audit; keep detailed per-record trail in `correctionHistory`. (Optional: a dedicated `AttendanceCorrectionLog` collection can be added later if query volume demands; not required for v1.)

---

## 13. API Requirements

> Base path: `/api/attendance` (mounted in `attendance.routes.js`). All correction routes require `authGuard` + `roleGuard("admin","sub-admin")`.

### 13.1 Correct / Add a record
`POST /api/attendance/:id/correct`  (existing record)
`POST /api/attendance/correct`       (create if none — body includes `studentId`)

**Request (correct existing):**
```json
{
  "status": "Present",
  "attendanceDate": "2026-07-07",
  "sessionLabel": "FULL_DAY",
  "checkInTime": "2026-07-07T09:00:00.000Z",
  "checkOutTime": "2026-07-07T12:30:00.000Z",
  "remarks": "Corrected teacher scan error",
  "reason": "Teacher scanned wrong status; fixing to actual Present"
}
```
**Response 200:**
```json
{
  "success": true,
  "message": "Attendance corrected successfully",
  "data": {
    "attendance": { "_id": "...", "status": "Present", "timetableStatus": "within_class",
                    "validatedAgainstTimetable": true, "flexiHoursBilled": 0,
                    "originalEntry": { "markedByRole": "teacher", "markedAt": "..." },
                    "correctionHistory": [ { "correctedByRole": "admin", "reason": "...", "changeType": "correct" } ] },
    "billing": { "dayConsumedFlexiHours": 0.5, "studentConsumedFlexiHours": 12.5, "reconciled": true }
  }
}
```

### 13.2 Fix Wrong Student (Reassign)
`POST /api/attendance/reassign`
```json
{
  "attendanceId": "664...",
  "targetStudentId": "665...",
  "reason": "Teacher scanned Aarav's QR but marked Kabir"
}
```
**Response 200:**
```json
{
  "success": true,
  "message": "Record reassigned to correct student",
  "data": {
    "source": { "_id":"664...", "isVoided": true, "reassignedToStudentId":"665...", "voidReason":"Reassigned to correct student" },
    "target": { "_id":"NEW...", "studentId":"665...", "status":"Present", "timetableStatus":"within_class" },
    "billing": {
      "sourceStudent": { "dayConsumedFlexiHours": 0, "studentConsumedFlexiHours": 10.0 },
      "targetStudent": { "dayConsumedFlexiHours": 0.5, "studentConsumedFlexiHours": 12.5 }
    }
  }
}
```

### 13.3 Void
`POST /api/attendance/:id/void`
```json
{ "reason": "Duplicate entry created by mistake" }
```
**Response 200:**
```json
{
  "success": true,
  "message": "Record voided; billing reversed",
  "data": {
    "attendance": { "_id":"...", "isVoided": true, "voidReason":"Duplicate entry created by mistake",
                    "correctionHistory": [ { "changeType":"void", "reason":"..." } ] },
    "billing": { "dayConsumedFlexiHours": 0, "studentConsumedFlexiHours": 10.0, "reversedFlexiHours": 0.5 }
  }
}
```

### 13.4 Flexi-Hours Summary (display fix)
`GET /api/attendance/flexi-summary/:studentId?dateKey=2026-07-07`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "studentId": "665...",
    "dateKey": "2026-07-07",
    "paid": 20, "free": 5, "used": 25, "left": 0,
    "isExtraStay": true,
    "dayFlexiHoursBilled": 0.5,
    "records": [ { "_id":"...", "status":"Present", "timetableStatus":"within_class", "flexiHoursBilled":0.5 } ]
  }
}
```

### 13.5 Existing GET detail enhancement
`GET /api/attendance/:id` (or list items) should now include `originalEntry`, `isVoided`, `voidReason`, `timetableStatus`, `validatedAgainstTimetable`, `flexiHoursBilled`, `correctionHistory` (already returned by `enrichAttendanceQuery` since these are document fields).

---

## 14. Backend Logic & Workflow

### 14.1 Reconciliation Engine — `reconcileStudentDayFlexi(studentId, dateKey, actor)`
Single source of truth. Pseudo-logic:
```
1. Load student (with classIds, classTimings) and all NON-VOIDED attendance for (studentId, dateKey).
2. Load CenterSession for (studentId, dateKey) (ACTIVE/COMPLETED/MISSED_CHECKOUT).
3. Compute for the day:
   - For each Present record with checkoutSource in {center_session, manual} AND checkOutTime set:
       scheduledMins = class overlap for that record (timetable)
       recordStayMins = checkOutTime - checkInTime
       recordExtraMins = max(0, recordStayMins - scheduledMins)
   - Also incorporate CenterSession idle math (existing gate logic) as a baseline when no per-record times exist.
   - dayExtraMins = max over the consistent full-picture calc (avoid double counting: if a CenterSession already produced a deduction, attribute it to the matching Present record rather than adding again).
   - graceMins = feeSettings.flexiGracePeriodMinutes || 15
   - billableExtraMins = max(0, dayExtraMins - graceMins)
   - dayFlexiHours = round(billableExtraMins / 60, 2)
4. SET student.consumedFlexiHours = student.consumedFlexiHoursAggregateRecomputed? 
   -> IMPORTANT: consumedFlexiHours is aggregate across ALL days. Therefore:
      newAggregate = (oldAggregate - previouslyReconciledDayHours) + dayFlexiHours
      i.e. track a per-day reconciled value to avoid losing other days' billing.
   Implementation: store `lastReconciledDayHours` on a per-day ledger OR recompute day from attendance each call and maintain `consumedFlexiHours = sum(reconciledDayHours over days)`. 
   Simplest robust approach: keep a derived map `student.flexiDayLedger: { [dateKey]: hours }`; 
   newAggregate = sum(values of flexiDayLedger) + (any legacy non-ledger consumed). 
   For v1: maintain `student.flexiDayLedger` (Map) and set `consumedFlexiHours = Σ ledger`.
5. Write each Present record's `flexiHoursBilled` = its share of dayFlexiHours (proportional or attributed to the record whose extra time drove it).
6. Persist student + records in a transaction; write AuditLog + correctionHistory entry.
```
> **Non-regression note:** Until admin touches a day, `flexiDayLedger` is empty for that day, so the engine must **seed** the ledger from the existing `consumedFlexiHours` baseline on first reconcile (capture "legacy consumed" and subtract day-by-day as days get reconciled). This guarantees existing balances are never wiped.

### 14.2 `validateRecordAgainstTimetable(record, student, dateKey)`
```
- Resolve class context for the record (classId or student.className/section).
- If no enrolled class for that day → timetableStatus = "no_class" (all time = Flexi-Time).
- Else compute class window [startTime, endTime] (FLEX_TIME uses student.classTimings).
- If record's [checkInTime, checkOutTime] intersects the class window → "within_class" (class time, not billed).
- Else → "outside_class" (Flexi-Time, billable extra).
```

### 14.3 `correctAttendance(id|null, body, user, reason)`
```
- Load record (or none → create path with studentId).
- Access check (admin/sub-admin; teacher-class scope not required for admin corrections).
- If record exists and originalEntry is null → snapshot current markedBy* into originalEntry.
- Validate against timetable → set validatedAgainstTimetable, timetableStatus.
- Apply update (reuse existing $set/$unset checkInTime/checkOutTime logic).
- Push correctionHistory { changeType:"correct", reason, before, after }.
- reconcileStudentDayFlexi(studentId, dateKey). If date changed → also reconcile old dateKey.
- Write AuditLog UPDATE.
```

### 14.4 `voidAttendance(id, user, reason)`
```
- Load record; reject if already isVoided.
- Snapshot originalEntry if missing.
- Set isVoided=true, voidedBy, voidedAt, voidReason, flexiHoursBilled contribution cleared.
- Push correctionHistory { changeType:"void", reason }.
- reconcileStudentDayFlexi(studentId, dateKey) → automatically reverses this record's share.
- AuditLog UPDATE/DELETE.
```

### 14.5 `reassignAttendance(attendanceId, targetStudentId, user, reason)`
```
- Load source record; reject if voided.
- Resolve target student (must be Active).
- Snapshot source.originalEntry if missing.
- Build target record payload from source business fields (status, times, class context of TARGET student, timetableStatus for target).
- Find existing target record for (targetStudentId, dateKey, sessionLabel):
    - If exists (non-voided) → update it (overwrite) and void the source.
    - Else → create new target record; void the source (set reassignedToStudentId, voidReason="Reassigned to correct student").
- reconcileStudentDayFlexi(sourceStudent, dateKey) AND reconcileStudentDayFlexi(targetStudent, dateKey).
- Push correctionHistory on both; AuditLog entries for both.
```

---

## 15. Frontend/UI Changes (guidance for client app)

| Screen | Change |
|--------|--------|
| Edit attendance (by someone else) | Show banner: *"Originally marked by {role} on {date}"* before save; require **Reason** field. |
| Record actions | Add **"Fix wrong student"** (search + select correct child) and **"Void"** (confirm dialog + reason). |
| Flexi-Hours widget | Use `/flexi-summary`; when `isExtraStay=true`, switch to **"Extra Stay"** view; never show hours as available when `left<=0`. |
| History | Show `correctionHistory` timeline (who/why/when) per record. |
| List/detail | Visually mark `isVoided` records as struck-through/"Voided". |

---

## 16. Billing & Calculation Logic

- **Unit:** minutes → hours (`/60`), rounded to 2 decimals.
- **Grace:** `feeSettings.flexiGracePeriodMinutes` (fallback 15).
- **Class-time vs Flexi-Time:** decided by timetable intersection (FR-2 / BR-1).
- **Full-picture recompute (BR-2):** `dayFlexiHours = f(all non-voided Present records + CenterSession for the day)`, then `consumedFlexiHours = Σ over days (reconciledDayHours) + legacyBase`.
- **Void reversal (BR-3):** removing a voided record drops its `flexiHoursBilled` from the day total → aggregate decreases by exactly that amount.
- **Rate:** charging of negative/extra hours already handled in `fee.service.js` (`flexiNegativeHours`, `flexiChargeRate`). Backend only owns *hours*; fee module owns *money*.

---

## 17. Audit Log Requirements

- Global `AuditLog` entry per correction/void/reassign (`action: UPDATE`, `target: Attendance`, `changes.before/after`, `metadata.path/method`).
- Per-record `correctionHistory` for instant in-context traceability (who marked originally, who changed, when, why).
- Original-entry preservation (`originalEntry`) so the *first* creator is never lost even after many overrides.
- Audit writes must **never** break the main flow (follow `audit.service.js` try/catch pattern).

---

## 18. Error Handling

| Scenario | HTTP | Message |
|----------|------|---------|
| Record not found | 404 | "Attendance record not found" |
| Student not found / inactive | 404 / 400 | existing messages |
| Not admin/sub-admin | 403 | roleGuard |
| Duplicate (non-voided) for day/session | 400 | "Attendance already exists for this student, date, and session" |
| Void on already-voided | 400 | "Record is already voided" |
| Missing `reason` | 400 | "Reason is required for correction" |
| Reassign target == source | 400 | "Target student must differ from current" |
| Reconciliation failure | 500 (with rollback) | log + generic error; billing left unchanged |

All errors propagate via existing `next(err)` + `ErrorResponse`.

---

## 19. Security Considerations

- Correction/void/reassign strictly `roleGuard("admin","sub-admin")`.
- Teachers cannot override/correct (only normal marking with `canMarkAttendance`).
- `reason` is user-supplied text → sanitize/trim, cap 500 chars; mongo-sanitize middleware already applied globally.
- Audit trail is append-only (no update/delete of history).
- No elevation: correction endpoints do not grant extra student access beyond what admin already has.

---

## 20. Testing Scenarios

| TC | Scenario | Expected |
|----|----------|----------|
| TC1 | Admin corrects teacher's Present→Present with times inside class window | `timetableStatus=within_class`, `flexiHoursBilled=0`, `originalEntry.role=teacher`, history appended. |
| TC2 | Admin adds extra-stay record (outside class, > grace) | `timetableStatus=outside_class`, day `consumedFlexiHours` increases by exact hours; repeated same correction → no double count. |
| TC3 | Admin corrects same record twice | `consumedFlexiHours` reflects latest only (idempotent). |
| TC4 | Void a billed record | day & aggregate `consumedFlexiHours` drop by that record's `flexiHoursBilled`; other records unchanged. |
| TC5 | Reassign wrong→correct student | source `isVoided`, target gets record; both students' billing reconciled; no orphan billing. |
| TC6 | Reassign when target already has a record | merged, no duplicate (unique index safe). |
| TC7 | Flexi summary when depleted | `left=0`, `isExtraStay=true` (display bug fixed). |
| TC8 | Teacher calls correction endpoint | 403. |
| TC9 | Existing QR scan / gate flow | unchanged behaviour (regression). |
| TC10 | Non-admin touches record days later | allowed for admin; billing recomputed correctly. |

---

## 21. Acceptance Criteria

- [ ] Admin can add/correct any record for any past date with timetable validation.
- [ ] Every correction updates `consumedFlexiHours` via full-picture recompute (no drift on repeats).
- [ ] Wrong-student records can be reassigned in one action; both children corrected.
- [ ] Void reverses exactly the voided record's billing; rest of day intact.
- [ ] Original marker + reason are shown and stored; `correctionHistory` populated.
- [ ] Flexi display switches to Extra Stay when depleted (no false "available").
- [ ] All existing QR/gate tests still pass (non-regression).
- [ ] All correction routes restricted to admin/sub-admin.

---

## 22. Before vs After Comparison

| Situation | Before | After |
|-----------|--------|-------|
| Teacher scans wrong student's QR | Stuck on wrong child, no clean fix | Admin moves record to correct child in one action; both corrected. |
| Admin manually marks/corrects | Saved but not timetable-checked, never billed | Validated like a scan; billed the same way every time. |
| Same record corrected > once | Could throw numbers off | Each correction replaces previous cleanly; balance = latest only. |
| Mistaken record shouldn't exist | No clean removal w/ correct billing | Void reverses only its billing. |
| Admin overrides teacher entry | Silent, untraceable | Clear trail: who marked, who changed, when, why. |
| Plan fully used up | Could still show "available" | Switches to Extra Stay view. |

---

## 23. Developer Implementation Notes

1. **Do not modify the existing unique index** on `(studentId, attendanceDateKey, sessionLabel)`. Handle "voided duplicate" via code-level duplicate guard (ignore `isVoided` records when checking).
2. **Reuse existing helpers**: `normalizeAttendanceDate`, `findStudentByIdOrAdmissionNo`, `ensureStudentIsActive`, `resolveStudentClassContext`, `enrichAttendanceQuery`, `getTeacherAccessContext`, `assertUserCanAccessStudent`, `audit.service.logUpdate`.
3. **Reconciliation is the only writer of `consumedFlexiHours` for corrected days.** Keep `centerCheckOut`'s `$inc` for the live gate flow, but when admin corrects a day that was gate-billed, seed `flexiDayLedger[dateKey]` from the current aggregate so the first reconcile doesn't zero out other days. Provide a one-time safe migration script (`src/scripts/`) to backfill `flexiDayLedger` from existing `CenterSession.deductedFlexiHours` per day if desired (optional, non-blocking).
4. **Timezone:** keep `Asia/Kolkata`/`DEFAULT_TIMEZONE` everywhere (no new tz logic).
5. **Transactions:** wrap multi-write operations (reassign touches 2 students; void touches student+record) in `mongoose.startSession()` + `withTransaction` where the deployment's MongoDB supports it (replica set). Degrade gracefully to sequential saves if not.
6. **Validation:** add `reason` to `attendance.validators.js` for the three new routes; reuse `updateAttendanceValidation` field rules.
7. **Routes:** add to `attendance.routes.js`:
   - `POST /:id/correct` → `roleGuard("admin","sub-admin")` + `correctAttendance`
   - `POST /correct` → `roleGuard("admin","sub-admin")` + `correctAttendance` (create)
   - `POST /reassign` → `roleGuard("admin","sub-admin")` + `reassignAttendance`
   - `POST /:id/void` → `roleGuard("admin","sub-admin")` + `voidAttendance`
   - `GET /flexi-summary/:studentId` → `roleGuard("admin","sub-admin","teacher","parent")` (read)
8. **No behaviour change** to `scanAttendance`, `manualMarkAttendance` (normal path), `centerCheckIn/Out`, `updateAttendance`, list/daily-summary endpoints — they remain as-is. Optionally, after `centerCheckOut`, call `reconcileStudentDayFlexi` to keep the ledger in sync (behaviour-compatible).
9. **`flexiHoursBilled` attribution:** attribute the day's `dayFlexiHours` to the specific Present record(s) whose extra time drove it (single driver → that record; multiple → proportional). Store on each record so void reversal is exact.
10. **Logging:** use `logger` (from `../../config/logger`) for reconciliation steps and failures, matching existing `[STEP-2b SYNC-FAILED]` style.
11. **Tests:** add Jest suites under `src/tests/modules/attendance/` covering TC1–TC10; ensure existing suites still green (`npm test`).
12. **Docs:** update Postman collection (`postman_collection.json`) with the 4 new endpoints + flexi-summary.

---

*End of SRS & Technical Implementation Document — v1.0*
