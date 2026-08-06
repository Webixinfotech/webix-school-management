/**
 * School Calendar Service
 *
 * Handles all business logic for calendar events.
 * Reads: User, Student (existing — never modified)
 * Writes: CalendarEvent (new collection only)
 */

const { randomUUID: uuidv4 } = require("crypto");
const CalendarEvent = require("./schoolCalendar.model");
const Student = require("../student/student.model");
const User = require("../auth/user.model");
const { parseCalendarExcel } = require("./schoolCalendar.parser");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");

// ── Helper ────────────────────────────────────────────────────────────────────

function buildDateRangeFilter(from, to) {
  const filter = {};
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to)   filter.date.$lte = new Date(to);
  }
  return filter;
}

// ─────────────────────────────────────────────────────────────────────────────

const calendarService = {

  // ── UPLOAD ───────────────────────────────────────────────────────────────────

  /**
   * Parse an uploaded Excel buffer and save all events to DB.
   *
   * @param {Buffer} buffer           - multer file buffer
   * @param {object} opts
   * @param {string} opts.defaultCalType  - "SCHOOL_CAL" | "KIDS_CLUB_CAL" | "AUTO"
   * @param {string} opts.session         - e.g. "April 2026"
   * @param {boolean} opts.replaceSession - if true, delete existing events for this session first
   * @param {string} opts.uploadedBy      - userId of admin
   */
  async uploadExcel(buffer, opts = {}) {
    const {
      defaultCalType = "AUTO",
      session = "",
      replaceSession = false,
      uploadedBy,
    } = opts;

    const uploadBatchId = uuidv4();

    // Parse Excel
    const { events, errors, skipped } = await parseCalendarExcel(
      buffer,
      defaultCalType === "AUTO" ? null : defaultCalType,
      session,
      uploadBatchId
    );

    if (events.length === 0) {
      throw new ErrorResponse(
        `No valid events found in Excel file. Errors: ${errors.join("; ")}`,
        400
      );
    }

    // Optionally replace all events for this session
    if (replaceSession && session) {
      const deleted = await CalendarEvent.deleteMany({ session, isActive: true });
      logger.info(`[Calendar] Replaced session "${session}" — deleted ${deleted.deletedCount} old events`);
    }

    // Stamp createdBy on each event
    const toInsert = events.map((e) => ({ ...e, createdBy: uploadedBy }));

    // Bulk insert
    const inserted = await CalendarEvent.insertMany(toInsert, { ordered: false });

    logger.info(`[Calendar] Upload complete — inserted: ${inserted.length}, skipped: ${skipped}, batchId: ${uploadBatchId}`);

    return {
      inserted: inserted.length,
      skipped,
      errors,
      uploadBatchId,
      session,
    };
  },

  // ── ADMIN: LIST ALL EVENTS ────────────────────────────────────────────────────

  /**
   * Admin fetches all calendar events with filters and pagination.
   */
  async getAdminEvents(query = {}) {
    const {
      calType,
      session,
      from,
      to,
      search,
      isHoliday,
      page = 1,
      limit = 50,
    } = query;

    const filter = { isActive: true };

    if (calType && ["SCHOOL_CAL", "KIDS_CLUB_CAL"].includes(calType)) {
      filter.calType = calType;
    }
    if (session) filter.session = session;
    if (isHoliday !== undefined) filter.isHoliday = isHoliday === "true";
    if (search) {
      filter.$or = [
        { eventName: { $regex: search, $options: "i" } },
        { className: { $regex: search, $options: "i" } },
        { day:       { $regex: search, $options: "i" } },
      ];
    }
    Object.assign(filter, buildDateRangeFilter(from, to));

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      CalendarEvent.find(filter)
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CalendarEvent.countDocuments(filter),
    ]);

    return {
      events,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    };
  },

  // ── ADMIN: UPDATE SINGLE ROW ──────────────────────────────────────────────────

  async updateEvent(eventId, data, updatedBy) {
    const allowedFields = [
      "day", "date", "dateStr", "time", "className",
      "eventName", "calType", "rowColor", "isHoliday",
      "isHighlighted", "visibleToAll", "visibleTo", "session",
    ];

    const updateData = {};
    allowedFields.forEach((f) => {
      if (data[f] !== undefined) updateData[f] = data[f];
    });
    updateData.updatedBy = updatedBy;

    // If date string provided, re-parse to Date
    if (updateData.date && typeof updateData.date === "string") {
      const { parseDate: pd } = require("./schoolCalendar.parser");
      // inline re-use of parse logic
      updateData.date = new Date(updateData.date);
    }

    const event = await CalendarEvent.findOneAndUpdate(
      { _id: eventId, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!event) throw new ErrorResponse("Calendar event not found", 404);

    logger.info(`[Calendar] Event updated: ${eventId} by ${updatedBy}`);
    return event;
  },

  // ── ADMIN: DELETE ─────────────────────────────────────────────────────────────

  async deleteEvent(eventId) {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: eventId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!event) throw new ErrorResponse("Calendar event not found", 404);
    return { message: "Event deleted successfully" };
  },

  /**
   * Delete all events from an upload batch (undo upload).
   */
  async deleteBatch(uploadBatchId) {
    const result = await CalendarEvent.updateMany(
      { uploadBatchId },
      { $set: { isActive: false } }
    );
    return { deleted: result.modifiedCount, uploadBatchId };
  },

  // ── ADMIN: ASSIGN PARENTS ─────────────────────────────────────────────────────

  /**
   * Assign specific parents to see an event (overrides visibleToAll).
   * Pass parentUserIds: [] to reset to "visible to all".
   */
  async assignParentsToEvent(eventId, parentUserIds, updatedBy) {
    const visibleToAll = !parentUserIds || parentUserIds.length === 0;

    const event = await CalendarEvent.findOneAndUpdate(
      { _id: eventId, isActive: true },
      {
        $set: {
          visibleToAll,
          visibleTo: visibleToAll ? [] : parentUserIds,
          updatedBy,
        },
      },
      { new: true }
    );

    if (!event) throw new ErrorResponse("Calendar event not found", 404);
    return event;
  },

  /**
   * Bulk assign all events of a calType to a list of parents.
   */
  async bulkAssignParents(calType, parentUserIds) {
    if (!["SCHOOL_CAL", "KIDS_CLUB_CAL"].includes(calType)) {
      throw new ErrorResponse("Invalid calType", 400);
    }

    const result = await CalendarEvent.updateMany(
      { calType, isActive: true },
      {
        $set: {
          visibleToAll: false,
          visibleTo: parentUserIds,
        },
      }
    );

    return { updated: result.modifiedCount, calType };
  },

  // ── PARENT: MY EVENTS ────────────────────────────────────────────────────────

  /**
   * Fetch calendar events visible to a specific parent.
   *
   * Visibility logic:
   *   1. Fetch parent's enrolled calType from their children's className
   *      (if child is in Kids Club → show KIDS_CLUB_CAL + SCHOOL_CAL)
   *   2. Show events where:
   *      - visibleToAll = true   AND calType matches
   *      - OR visibleTo includes this parent's userId
   */
  async getParentEvents(parentUserId, query = {}) {
    const { from, to, calType, page = 1, limit = 100 } = query;

    // Find parent's children to determine enrollment type
    const children = await Student.find({
      parentUserId,
      status: "Active",
    })
      .select("className")
      .lean();

    // Determine which calTypes this parent should see
    // Default: show SCHOOL_CAL to all parents
    // Add KIDS_CLUB_CAL if any child is in Kids Club classes
    const kidsClubClasses = ["nursery", "pg", "kg1", "kg2", "lkg", "ukg"];
    const hasKidsClubChild = children.some((c) =>
      kidsClubClasses.some((kc) =>
        String(c.className || "").toLowerCase().includes(kc)
      )
    );

    let allowedCalTypes = ["SCHOOL_CAL"];
    if (hasKidsClubChild) allowedCalTypes.push("KIDS_CLUB_CAL");

    // If parent explicitly requests a calType, validate it
    if (calType) {
      if (!allowedCalTypes.includes(calType)) {
        return { events: [], total: 0, page: 1, limit: parseInt(limit), pages: 0 };
      }
      allowedCalTypes = [calType];
    }

    // Build query
    const filter = {
      isActive: true,
      calType: { $in: allowedCalTypes },
      $or: [
        { visibleToAll: true },
        { visibleTo: parentUserId },
      ],
    };

    Object.assign(filter, buildDateRangeFilter(from, to));

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      CalendarEvent.find(filter)
        .select("-visibleTo -createdBy -updatedBy -uploadBatchId")
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CalendarEvent.countDocuments(filter),
    ]);

    return {
      events,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
      allowedCalTypes,
    };
  },

  // ── SESSION LIST (for admin filters) ─────────────────────────────────────────

  async getSessionList() {
    const sessions = await CalendarEvent.distinct("session", { isActive: true, session: { $ne: "" } });
    return sessions.sort();
  },

  // ── UPLOAD BATCH LIST ─────────────────────────────────────────────────────────

  async getUploadBatches() {
    const batches = await CalendarEvent.aggregate([
      { $match: { isActive: true, uploadBatchId: { $ne: null } } },
      {
        $group: {
          _id: "$uploadBatchId",
          session: { $first: "$session" },
          count: { $sum: 1 },
          firstDate: { $min: "$date" },
          lastDate: { $max: "$date" },
          uploadedAt: { $first: "$createdAt" },
          schoolCalCount: {
            $sum: { $cond: [{ $eq: ["$calType", "SCHOOL_CAL"] }, 1, 0] },
          },
          kidsClubCount: {
            $sum: { $cond: [{ $eq: ["$calType", "KIDS_CLUB_CAL"] }, 1, 0] },
          },
        },
      },
      { $sort: { uploadedAt: -1 } },
    ]);

    return batches;
  },
};

module.exports = calendarService;