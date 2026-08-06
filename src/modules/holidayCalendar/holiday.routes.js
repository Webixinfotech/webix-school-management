const express = require("express");
const router = express.Router();
const service = require("./holiday.service");
const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const { body, param, query } = require("express-validator");

// ─── Controller ───────────────────────────────────────────────────────────────

const createHoliday = async (req, res, next) => {
  try {
    const data = await service.createHoliday(req.body, req.user);
    res.status(201).json({ success: true, message: "Holiday created", data });
  } catch (err) {
    next(err);
  }
};

const getHolidays = async (req, res, next) => {
  try {
    const data = await service.getHolidays(req.query);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

const updateHoliday = async (req, res, next) => {
  try {
    const data = await service.updateHoliday(req.params.id, req.body);
    res.status(200).json({ success: true, message: "Holiday updated", data });
  } catch (err) {
    next(err);
  }
};

const deleteHoliday = async (req, res, next) => {
  try {
    await service.deleteHoliday(req.params.id);
    res.status(200).json({ success: true, message: "Holiday deleted" });
  } catch (err) {
    next(err);
  }
};

const getWeeklyOff = async (req, res, next) => {
  try {
    const data = await service.getAttendanceSettings();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateWeeklyOff = async (req, res, next) => {
  try {
    const data = await service.updateAttendanceSettings(req.body.weeklyOffDays, req.user);
    res
      .status(200)
      .json({ success: true, message: "Weekly-off days updated", data });
  } catch (err) {
    next(err);
  }
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/holidays
router.post(
  "/",
  authGuard,
  roleGuard("admin"),
  [
    body("date")
      .notEmpty()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("date must be YYYY-MM-DD"),
    body("name").notEmpty().trim().isLength({ max: 100 }),
    body("applicableTo").optional().isIn(["TEACHING", "NON_TEACHING", "BOTH"]),
    body("isPaid").optional().isBoolean(),
    body("description").optional().trim().isLength({ max: 300 }),
    body("users").optional().isArray(),
    body("users.*").optional().isMongoId(),
  ],
  validate,
  createHoliday,
);

// GET /api/holidays?year=2026&month=5&applicableTo=TEACHING
router.get(
  "/",
  authGuard,
  roleGuard("admin", "teacher"),
  [
    query("year").optional().isInt({ min: 2020, max: 2100 }),
    query("month").optional().isInt({ min: 1, max: 12 }),
    query("applicableTo").optional().isIn(["TEACHING", "NON_TEACHING", "BOTH"]),
  ],
  validate,
  getHolidays,
);

// GET /api/holidays/weekly-off — school-wide weekly-off days (e.g. every Sunday)
// NOTE: must stay registered before PUT/GET "/:id" style routes below so
// Express doesn't try to match "weekly-off" as a Mongo :id param.
router.get(
  "/weekly-off",
  authGuard,
  roleGuard("admin", "teacher"),
  getWeeklyOff,
);

// PUT /api/holidays/weekly-off
router.put(
  "/weekly-off",
  authGuard,
  roleGuard("admin"),
  [
    body("weeklyOffDays").isArray().withMessage("weeklyOffDays must be an array"),
    body("weeklyOffDays.*").isInt({ min: 0, max: 6 }).withMessage("Each day must be 0 (Sun) to 6 (Sat)"),
  ],
  validate,
  updateWeeklyOff,
);

// PUT /api/holidays/:id
router.put(
  "/:id",
  authGuard,
  roleGuard("admin"),
  [param("id").isMongoId()],
  validate,
  updateHoliday,
);

// DELETE /api/holidays/:id
router.delete(
  "/:id",
  authGuard,
  roleGuard("admin"),
  [param("id").isMongoId()],
  validate,
  deleteHoliday,
);

module.exports = router;
