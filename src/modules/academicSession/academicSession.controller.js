const academicSessionService = require("./academicSession.service");
const logger = require("../../config/logger");

exports.createSession = async (req, res, next) => {
  try {
    const session = await academicSessionService.createSession(req.body, req.user);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    logger.error("[AcademicSession] createSession error:", err.message);
    next(err);
  }
};

exports.listSessions = async (req, res, next) => {
  try {
    const sessions = await academicSessionService.listSessions();
    res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    logger.error("[AcademicSession] listSessions error:", err.message);
    next(err);
  }
};

exports.getActiveSession = async (req, res, next) => {
  try {
    const session = await academicSessionService.getActiveSession();
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    logger.error("[AcademicSession] getActiveSession error:", err.message);
    next(err);
  }
};

exports.getSessionById = async (req, res, next) => {
  try {
    const session = await academicSessionService.getSessionById(req.params.id);
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    logger.error("[AcademicSession] getSessionById error:", err.message);
    next(err);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const session = await academicSessionService.updateSession(req.params.id, req.body);
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    logger.error("[AcademicSession] updateSession error:", err.message);
    next(err);
  }
};

exports.deleteSession = async (req, res, next) => {
  try {
    const result = await academicSessionService.deleteSession(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    logger.error("[AcademicSession] deleteSession error:", err.message);
    next(err);
  }
};

exports.activateSession = async (req, res, next) => {
  try {
    const session = await academicSessionService.activateSession(req.params.id);
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    logger.error("[AcademicSession] activateSession error:", err.message);
    next(err);
  }
};
