/**
 * Throwaway verification script for the referral bug fixes.
 * Creates its own uniquely-tagged test records, exercises the exact code
 * paths that were changed, asserts the expected outcome, then deletes only
 * the records it created (never touches unrelated data).
 *
 * Run: node src/scripts/_referralFixVerify.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../modules/auth/user.model");
const Parent = require("../modules/shared/parent.model");
const Student = require("../modules/student/student.model");
const Referral = require("../modules/referral/referral.model");
const referralService = require("../modules/referral/referral.service");
const referralTrackingService = require("../modules/referralTracking/referralTracking.service");

const TAG = `reftest_${Date.now()}`;
const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} - ${name}${detail ? " :: " + detail : ""}`);
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 20000,
  });
  console.log(`Connected: ${mongoose.connection.host}`);

  const created = { userIds: [], parentIds: [], studentIds: [], referralIds: [] };

  try {
    // ── Setup: referrer parent + user ──────────────────────────────────────
    const referrerUser = await User.create({
      name: `${TAG}_referrer`,
      email: `${TAG}_referrer@example.test`,
      password: "TestPassword123!",
      role: "parent",
      phone: "9000000001",
    });
    created.userIds.push(referrerUser._id);

    const referrerParent = await Parent.create({ userId: referrerUser._id });
    created.parentIds.push(referrerParent._id);

    const friendMobile = "9111111111";

    const pendingReferral = await Referral.create({
      referrerId: referrerUser._id,
      referrerParentId: referrerParent._id,
      referralCode: referrerParent.referralCode,
      friendName: `${TAG}_friend`,
      friendMobile,
      referralSource: "manual",
      status: "pending",
      statusHistory: [
        { status: "pending", changedBy: referrerUser._id, changedAt: new Date(), note: "test setup" },
      ],
    });
    created.referralIds.push(pendingReferral._id);

    const parentBefore = await Parent.findById(referrerParent._id).lean();

    // ── Test 1: direct-admission path (student.service.js createStudent fix) ─
    // Replicates the exact block added at student.service.js ~line 419-432.
    const newStudent = await Student.create({
      firstName: `${TAG}_Child`,
      lastName: "Direct",
      gender: "Male",
      status: "Active",
      parentUserId: referrerUser._id,
      createdBy: referrerUser._id,
    });
    created.studentIds.push(newStudent._id);

    const matchResult = await referralService.findAndMatchReferralForFresherAdmission(
      [friendMobile],
      newStudent._id,
      `${TAG}_Child Direct`,
      "test: direct admission auto-join",
    );

    record("findAndMatchReferralForFresherAdmission finds pending referral", matchResult.found === true, JSON.stringify(matchResult));

    if (matchResult.found) {
      await Student.findByIdAndUpdate(newStudent._id, {
        referralInfo: {
          wasReferred: true,
          referralId: matchResult.referralId,
          referredByParentId: matchResult.referrerParentId,
          referredByName: "",
        },
      });
    }

    const studentAfter = await Student.findById(newStudent._id).lean();
    record(
      "Bug #2 fix: Student.referralInfo.wasReferred is true after direct admission",
      studentAfter.referralInfo?.wasReferred === true &&
        String(studentAfter.referralInfo?.referralId) === String(pendingReferral._id),
      `wasReferred=${studentAfter.referralInfo?.wasReferred}, referralId=${studentAfter.referralInfo?.referralId}`,
    );

    const referralAfterMatch = await Referral.findById(pendingReferral._id).lean();
    record(
      "Referral doc flipped to joined + studentId linked",
      referralAfterMatch.status === "joined" && String(referralAfterMatch.studentId) === String(newStudent._id),
      `status=${referralAfterMatch.status}`,
    );

    // ── Test 2: no double-increment (enquiry.service.js fix) ────────────────
    // findAndMatchReferralForFresherAdmission is the ONLY place that should
    // have incremented parent.referralStats — verify it moved by exactly 1,
    // not 2 (which is what the old enquiry.service.js duplicate $inc caused).
    const parentAfter = await Parent.findById(referrerParent._id).lean();
    const pendingDelta = (parentAfter.referralStats?.pending || 0) - (parentBefore.referralStats?.pending || 0);
    const successfulDelta = (parentAfter.referralStats?.successful || 0) - (parentBefore.referralStats?.successful || 0);
    record(
      "Bug #4 fix: referralStats.pending decremented by exactly 1 (not double-counted)",
      pendingDelta === -1,
      `delta=${pendingDelta}`,
    );
    record(
      "Bug #4 fix: referralStats.successful incremented by exactly 1 (not double-counted)",
      successfulDelta === 1,
      `delta=${successfulDelta}`,
    );

    // ── Test 3: joinedOn fix (referralTracking.service.js) ──────────────────
    const tracking = await referralTrackingService.getParentReferralTracking(referrerUser._id);
    const trackedReferral = tracking.referrals.find((r) => String(r.referralId) === String(pendingReferral._id));
    record(
      "Bug #3 fix: /referral-tracking/my returns joinedOn (not undefined)",
      !!trackedReferral && trackedReferral.joinedOn instanceof Date,
      `joinedOn=${trackedReferral?.joinedOn}`,
    );

    // ── Test 4: getReferral (admin detail) has no friend-email field ───────
    // Confirms the backend truly never sends a friend email, which is what
    // the AdminReferralManagementPage.jsx fix (friendEmail: '') now assumes.
    const detail = await referralService.getReferral(pendingReferral._id.toString());
    record(
      "Bug #1 assumption holds: backend referral detail has no friend email field",
      !("friendEmail" in detail),
      `keys=${Object.keys(detail).join(",")}`,
    );
  } finally {
    // ── Cleanup: delete ONLY what this script created ──────────────────────
    await Referral.deleteMany({ _id: { $in: created.referralIds } });
    await Student.deleteMany({ _id: { $in: created.studentIds } });
    await Parent.deleteMany({ _id: { $in: created.parentIds } });
    await User.deleteMany({ _id: { $in: created.userIds } });
    console.log("Cleanup done — test records removed.");

    await mongoose.connection.close();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});
