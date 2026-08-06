const Holiday = require("./holiday.model");
const AttendanceSettings = require("./attendanceSettings.model");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");

const getTodayIST = () => {
  const ist = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}-${String(ist.getDate()).padStart(2, "0")}`;
};

// ─── SERVICE ──────────────────────────────────────────────────────────────────

class HolidayService {
  async createHoliday(body, user) {
    const { date, name, applicableTo, description, isPaid, users } = body;

    // Check duplicate
    const exists = await Holiday.findOne({
      date,
      applicableTo: { $in: [applicableTo, "BOTH"] },
      users: { $size: 0 },
    });
    if (exists) {
      throw new ErrorResponse(
        `A holiday already exists on ${date} for ${exists.applicableTo} calendar`,
        409,
      );
    }

    const holiday = await Holiday.create({
      date,
      name,
      applicableTo: applicableTo || "BOTH",
      description: description || "",
      isPaid: isPaid !== false,
      users: users || [],
      createdBy: user._id,
    });

    logger.info(`[HOLIDAY] Created: ${name} on ${date} for ${applicableTo}`);
    return holiday;
  }

  async getHolidays(query) {
    const { month, year, applicableTo } = query;

    const filter = {};
    if (applicableTo) filter.applicableTo = { $in: [applicableTo, "BOTH"] };

    if (year && month) {
      const mm = String(month).padStart(2, "0");
      filter.date = { $gte: `${year}-${mm}-01`, $lte: `${year}-${mm}-31` };
    } else if (year) {
      filter.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
    }

    const holidays = await Holiday.find(filter).sort({ date: 1 }).lean();
    return holidays;
  }

  async updateHoliday(id, body) {
    const holiday = await Holiday.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    );
    if (!holiday) throw new ErrorResponse("Holiday not found", 404);
    return holiday;
  }

  async deleteHoliday(id) {
    const holiday = await Holiday.findByIdAndDelete(id);
    if (!holiday) throw new ErrorResponse("Holiday not found", 404);
    return holiday;
  }

  // Used by attendance to check if today is holiday for a given employee calendar
  async isHoliday(date, employeeCalendar, userId = null) {
    const dateKey = date || getTodayIST();

    // Check for user-specific holiday first
    if (userId) {
      const userHoliday = await Holiday.findOne({
        date: dateKey,
        users: userId,
      }).lean();
      if (userHoliday) return userHoliday;
    }

    // Check calendar-wide holiday
    return Holiday.findOne({
      date: dateKey,
      applicableTo: { $in: [employeeCalendar, "BOTH"] },
      users: { $size: 0 },
    }).lean();
  }

  // ── Weekly-off settings (school-wide, applies to every employee) ──────────
  async getAttendanceSettings() {
    let settings = await AttendanceSettings.findOne({ key: "global" });
    if (!settings) {
      settings = await AttendanceSettings.create({ key: "global" });
    }
    return settings;
  }

  async updateAttendanceSettings(weeklyOffDays, user) {
    const settings = await AttendanceSettings.findOneAndUpdate(
      { key: "global" },
      { $set: { weeklyOffDays, lastUpdatedBy: user._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    logger.info(`[ATTENDANCE-SETTINGS] weeklyOffDays updated to [${weeklyOffDays.join(",")}] by ${user._id}`);
    return settings;
  }
}

const service = new HolidayService();
module.exports = service;
