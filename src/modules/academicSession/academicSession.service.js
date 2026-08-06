const mongoose = require("mongoose");
const AcademicSession = require("./academicSession.model");
const Student = require("../student/student.model");
const StudentEnrollment = require("../fee/studentEnrollment.model");
const Invoice = require("../fee/invoice.model");
const { Attendance } = require("../attendance/attendance.model");
const ErrorResponse = require("../../utils/errorResponse");

// Two ranges overlap unless one ends before the other starts.
async function assertNoOverlap(startDate, endDate, excludeId) {
  const query = {
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };
  if (excludeId) query._id = { $ne: excludeId };

  const clash = await AcademicSession.findOne(query).select("name startDate endDate").lean();
  if (clash) {
    throw new ErrorResponse(
      `Date range overlaps with existing session "${clash.name}" (${clash.startDate.toISOString().slice(0, 10)} to ${clash.endDate.toISOString().slice(0, 10)})`,
      400
    );
  }
}

const academicSessionService = {
  async createSession({ name, startDate, endDate }, user) {
    if (new Date(startDate) >= new Date(endDate)) {
      throw new ErrorResponse("startDate must be before endDate", 400);
    }
    await assertNoOverlap(startDate, endDate);

    // status is never accepted from the request — always starts "Upcoming".
    // This alone guarantees creation can never produce a second Active doc.
    const session = await AcademicSession.create({
      name,
      startDate,
      endDate,
      createdBy: user._id,
    });
    return session;
  },

  async listSessions() {
    return AcademicSession.find({}).sort({ startDate: -1 }).lean();
  },

  async getActiveSession() {
    return AcademicSession.findOne({ status: "Active" }).lean();
  },

  async getSessionById(id) {
    const session = await AcademicSession.findById(id).lean();
    if (!session) throw new ErrorResponse("Academic session not found", 404);
    return session;
  },

  // status is intentionally not editable here — activation is the only
  // sanctioned status transition, and it must go through activateSession's
  // transaction so at most one session is ever Active.
  async updateSession(id, { name, startDate, endDate }) {
    const session = await AcademicSession.findById(id);
    if (!session) throw new ErrorResponse("Academic session not found", 404);

    const nextStart = startDate !== undefined ? new Date(startDate) : session.startDate;
    const nextEnd = endDate !== undefined ? new Date(endDate) : session.endDate;

    if (startDate !== undefined || endDate !== undefined) {
      if (nextStart >= nextEnd) {
        throw new ErrorResponse("startDate must be before endDate", 400);
      }
      await assertNoOverlap(nextStart, nextEnd, id);
    }

    if (name !== undefined) session.name = name.trim();
    if (startDate !== undefined) session.startDate = startDate;
    if (endDate !== undefined) session.endDate = endDate;

    await session.save();
    return session;
  },

  async deleteSession(id) {
    const session = await AcademicSession.findById(id);
    if (!session) throw new ErrorResponse("Academic session not found", 404);

    if (session.status === "Active") {
      throw new ErrorResponse(
        "Cannot delete the active session. Activate a different session first.",
        400
      );
    }

    const [studentCount, enrollmentCount, invoiceCount, attendanceCount] =
      await Promise.all([
        Student.countDocuments({ sessionId: id }),
        StudentEnrollment.countDocuments({ sessionId: id }),
        Invoice.countDocuments({ sessionId: id }),
        Attendance.countDocuments({ sessionId: id }),
      ]);
    const linkedCount =
      studentCount + enrollmentCount + invoiceCount + attendanceCount;
    if (linkedCount > 0) {
      throw new ErrorResponse(
        `Cannot delete session. ${linkedCount} linked record(s) (students, enrollments, invoices, or attendance) reference it.`,
        400
      );
    }

    await AcademicSession.deleteOne({ _id: id });
    return { message: "Academic session deleted successfully" };
  },

  // Atomically demotes whatever session is currently Active (if any) to
  // Completed, then promotes the target to Active — guarantees at most one
  // Active session at any time without a schema-level constraint.
  async activateSession(id) {
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();
    try {
      const target = await AcademicSession.findById(id).session(dbSession);
      if (!target) throw new ErrorResponse("Academic session not found", 404);

      await AcademicSession.updateMany(
        { status: "Active" },
        { $set: { status: "Completed" } },
        { session: dbSession }
      );

      target.status = "Active";
      await target.save({ session: dbSession });

      await dbSession.commitTransaction();
      return target;
    } catch (err) {
      await dbSession.abortTransaction();
      throw err;
    } finally {
      dbSession.endSession();
    }
  },

  // Shared helper consumed by student/fee/attendance services when tagging
  // new records — returns null (not an error) when no session is Active yet,
  // so callers can safely fall back to the pre-feature behavior.
  async getCurrentActiveSessionId() {
    const active = await AcademicSession.findOne({ status: "Active" })
      .select("_id")
      .lean();
    return active ? active._id : null;
  },

  // Called by the daily cron (academicSession.cron.js). Two independent
  // transitions, both date-driven (no admin action required):
  //  1. Active session whose endDate has passed -> Completed.
  //  2. If no session is Active afterwards, the Upcoming session with the
  //     most recent startDate <= now is promoted to Active, so there's never
  //     a manual-activation gap once a session's window has genuinely opened.
  // Early/manual activation via activateSession() is untouched by this method
  // and still works at any time, per product decision.
  async autoTransitionSessions() {
    const now = new Date();
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();
    try {
      const active = await AcademicSession.findOne({ status: "Active" }).session(dbSession);

      let completedId = null;
      if (active && active.endDate < now) {
        active.status = "Completed";
        await active.save({ session: dbSession });
        completedId = active._id;
      }

      const stillActive = active && !completedId;
      let activatedId = null;
      if (!stillActive) {
        const next = await AcademicSession.findOne({
          status: "Upcoming",
          startDate: { $lte: now },
        })
          .sort({ startDate: -1 })
          .session(dbSession);
        if (next) {
          next.status = "Active";
          await next.save({ session: dbSession });
          activatedId = next._id;
        }
      }

      await dbSession.commitTransaction();
      return { completedId, activatedId };
    } catch (err) {
      await dbSession.abortTransaction();
      throw err;
    } finally {
      dbSession.endSession();
    }
  },
};

module.exports = academicSessionService;
