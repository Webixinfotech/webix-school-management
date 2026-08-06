/**
 * Birthday Controller
 *
 * Handles HTTP request/response for birthday APIs.
 * Follows existing controller pattern in this codebase.
 */

const birthdayService = require("./birthday.service");
const { BirthdayCardShareLog } = require("./birthday.model");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");

// ─── Admin: Get upcoming birthdays (all categories) ──────────────────────────
// GET /api/birthdays/admin/upcoming?category=student,staff,parent
exports.getAdminUpcomingBirthdays = async (req, res, next) => {
  try {
    const categoryParam = req.query.category;
    let categories = ["student", "parent", "staff"];

    if (categoryParam) {
      const requested = categoryParam
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter((c) => ["student", "parent", "staff"].includes(c));

      if (requested.length === 0) {
        return next(
          new ErrorResponse(
            "Invalid category. Use: student, parent, staff",
            400
          )
        );
      }
      categories = requested;
    }

    const data = await birthdayService.getAllBirthdays(categories);

    // Build flat list if ?flat=true, else return grouped
    const flat = req.query.flat === "true";
    let responseData;

    if (flat) {
      responseData = Object.values(data)
        .flat()
        .sort((a, b) => a.daysRemaining - b.daysRemaining);
    } else {
      responseData = data;
    }

    res.status(200).json({
      success: true,
      message: "Upcoming birthdays fetched successfully",
      data: responseData,
    });
  } catch (err) {
    logger.error("[Birthday] getAdminUpcomingBirthdays error:", err.message);
    next(err);
  }
};

// ─── Teacher: Get upcoming student birthdays only ────────────────────────────
// GET /api/birthdays/teacher/upcoming
exports.getTeacherUpcomingBirthdays = async (req, res, next) => {
  try {
    const students = await birthdayService.getStudentBirthdays();

    res.status(200).json({
      success: true,
      message: "Upcoming student birthdays fetched successfully",
      data: students,
    });
  } catch (err) {
    logger.error(
      "[Birthday] getTeacherUpcomingBirthdays error:",
      err.message
    );
    next(err);
  }
};

// ─── Birthday Card Data ───────────────────────────────────────────────────────
// GET /api/birthdays/card/:role/:id
exports.getBirthdayCard = async (req, res, next) => {
  try {
    const { role, id } = req.params;

    if (!["student", "parent", "parent-father", "parent-mother", "staff"].includes(role)) {
      return next(
        new ErrorResponse(
          "Invalid role. Must be: student, parent, parent-father, parent-mother, or staff",
          400
        )
      );
    }

    const cardData = await birthdayService.getBirthdayCardData(id, role);

    res.status(200).json({
      success: true,
      message: "Birthday card data fetched successfully",
      data: cardData,
    });
  } catch (err) {
    logger.error("[Birthday] getBirthdayCard error:", err.message);
    next(err);
  }
};

// ─── WhatsApp Share Endpoint ──────────────────────────────────────────────────
// GET /api/birthdays/whatsapp-share/:role/:id
// Returns card metadata + share message text
exports.getWhatsappShareData = async (req, res, next) => {
  try {
    const { role, id } = req.params;

    if (!["student", "parent", "parent-father", "parent-mother", "staff"].includes(role)) {
      return next(
        new ErrorResponse(
          "Invalid role. Must be: student, parent, parent-father, parent-mother, or staff",
          400
        )
      );
    }

    const cardData = await birthdayService.getBirthdayCardData(id, role);

    // Build WhatsApp-friendly message
    const emoji = "🎂🎉🎈";
    const shareText =
      cardData.daysRemaining === 0
        ? `${emoji} Happy Birthday ${cardData.name}! Wishing you a wonderful day! ${emoji}`
        : `${emoji} ${cardData.name}'s birthday is on ${cardData.birthdayDate}! Let's celebrate! ${emoji}`;

    // Log the share
    await birthdayService.logCardShare(
      id,
      role,
      req.user._id,
      "whatsapp"
    );

    res.status(200).json({
      success: true,
      message: "WhatsApp share data fetched successfully",
      data: {
        ...cardData,
        shareText,
        shareChannel: "whatsapp",
      },
    });
  } catch (err) {
    logger.error("[Birthday] getWhatsappShareData error:", err.message);
    next(err);
  }
};

// ─── Manual Notification Trigger (Admin only) ────────────────────────────────
// POST /api/birthdays/admin/send-notifications
exports.triggerBirthdayNotifications = async (req, res, next) => {
  try {
    const result = await birthdayService.sendBirthdayNotifications();

    res.status(200).json({
      success: true,
      message: "Birthday notifications triggered successfully",
      data: result,
    });
  } catch (err) {
    logger.error(
      "[Birthday] triggerBirthdayNotifications error:",
      err.message
    );
    next(err);
  }
};
