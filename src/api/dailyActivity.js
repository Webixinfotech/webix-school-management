// src/api/dailyActivity.js
// Uses the shared axios instance (src/api/axios.js) so baseURL correctly
// respects VITE_API_URL instead of a hardcoded production URL. That instance
// already attaches the Bearer token from localStorage on every request.
import api from "./axios";

// ─── Transform Helpers ────────────────────────────────────────────────────────

/** Normalize a raw class object from GET /classes or GET /classes/:id */
export function transformClass(raw) {
  const classTypeColorMap = {
    FIXED_TIME: "#6366f1",
    HOURS_BASED: "#f59e0b",
    FLEX_TIME: "#10b981",
  };
  const section = raw.section ? ` (${raw.section})` : "";
  return {
    id: raw._id,
    _id: raw._id,
    classId: raw.classId || "",
    name: `${raw.name}${section}`,
    rawName: raw.name,
    section: raw.section || "",
    classType: raw.classType || "FIXED_TIME",
    color: classTypeColorMap[raw.classType] || "#6366f1",
    status: raw.status || "Active",
    teacherId: raw.teacherId || null,
    teacherName: raw.teacherId?.name || "No Teacher",
    startTime: raw.startTime || null,
    endTime: raw.endTime || null,
    days: raw.days || [],
    level: raw.level || 0,
    studentCount: raw.studentCount || 0,
  };
}

/** Normalize a raw student object from GET /students */
export function transformStudent(raw) {
  return {
    id: raw._id,
    _id: raw._id,
    name: raw.fullName || `${raw.firstName || ""} ${raw.lastName || ""}`.trim() || "Unknown",
    firstName: raw.firstName || "",
    lastName: raw.lastName || "",
    admissionNo: raw.admissionNo || "",
    avatar: raw.photo || null,
    classIds: raw.classIds || [],
  };
}

/** Normalize a raw activity object from GET /daily-activity/class/:classId */
export function transformActivity(raw, dateStr) {
  const studentId = raw.studentId?._id || raw.studentId;
  const key = `${studentId}_${dateStr}`;
  return {
    key,
    studentId: raw.studentId,
    activityId: raw._id,
    sleep: raw.sleep?.quality || null,
    foodTime: raw.food?.time || null,
    foodQuantity: raw.food?.quantity || null,
    foodNote: raw.food?.note || "",
    diaperStatus: raw.diaper?.status || null,
    diaperTime: raw.diaper?.changeTime || null,
    mood: raw.mood || null,
    activities: Array.isArray(raw.activities) ? raw.activities : [],
    healthConcerns: Array.isArray(raw.healthConcerns) ? raw.healthConcerns : [],
    teacherNote: raw.teacherNote || "",
    updatedAt: raw.updatedAt || null,
  };
}

/**
 * Normalize a raw teacher object from GET /teachers
 *
 * IMPORTANT: a teacher document has its own `_id`, but it also embeds a
 * `userId` object (the linked login account). Activity records store
 * `markedBy._id` using the **userId**, not the teacher document's own _id.
 * So when you want to filter daily-activity records by teacher (e.g.
 * `?teacherId=...`), you must send `userId`, not the teacher's `_id`,
 * or the filter will silently return zero results.
 */
export function transformTeacher(raw) {
  const userId = raw.userId?._id || raw.userId || null;
  return {
    id: raw._id || raw.id,
    _id: raw._id || raw.id,
    userId, // <-- use THIS value for ?teacherId= filtering / matching markedBy
    employeeId: raw.employeeId || "",
    name: raw.name || raw.userId?.name || "Unknown",
    email: raw.email || raw.userId?.email || "",
    phone: raw.phone || "",
    status: raw.status || "Active",
    classIds: raw.classIds || [],
    avatar: raw.photo || null,
  };
}

/** Normalize a raw record from GET /daily-activity/history/all */
export function transformHistoryRecord(raw) {
  const studentObj = raw.studentId && typeof raw.studentId === "object" ? raw.studentId : null;
  const classObj = raw.classId && typeof raw.classId === "object" ? raw.classId : null;
  return {
    id: raw._id,
    activityDate: raw.activityDate,
    studentId: studentObj?._id || raw.studentId,
    studentName: raw.studentName || (studentObj ? `${studentObj.firstName || ""} ${studentObj.lastName || ""}`.trim() : "Unknown"),
    admissionNo: studentObj?.admissionNo || "",
    photo: studentObj?.photo || null,
    classId: classObj?._id || raw.classId,
    className: raw.className || classObj?.name || "",
    mood: raw.mood || null,
    sleep: raw.sleep?.quality || null,
    foodQuantity: raw.food?.quantity || null,
    foodTime: raw.food?.time || null,
    foodNote: raw.food?.note || "",
    diaperStatus: raw.diaper?.status || null,
    diaperTime: raw.diaper?.changeTime || null,
    activities: Array.isArray(raw.activities) ? raw.activities : [],
    healthConcerns: Array.isArray(raw.healthConcerns) ? raw.healthConcerns : [],
    teacherNote: raw.teacherNote || "",
    parentNotified: !!raw.parentNotified,
    markedByName: raw.markedBy?.name || "",
    markedById: raw.markedBy?._id || null,
    markedByRole: raw.markedByRole || raw.markedBy?.role || "",
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /classes?page=1&limit=100
 * Returns normalized class list
 */
export async function fetchAllClasses() {
  const res = await api.get("/classes", { params: { page: 1, limit: 100 } });
  const raw = res.data;
  if (!raw.success) throw new Error("Failed to fetch classes");
  return (raw.data || []).map(transformClass);
}

/**
 * GET /classes/:classId
 * Returns { classInfo, students }
 */
export async function fetchClassDetails(classId) {
  const res = await api.get(`/classes/${classId}`);
  const raw = res.data;
  if (!raw.success) throw new Error("Failed to fetch class details");
  const data = raw.data || {};
  return {
    classInfo: transformClass(data),
    students: (data.students || []).map(transformStudent),
  };
}

/**
 * GET /daily-activity/class/:classId?date=YYYY-MM-DD
 * Returns { summary, activities (keyed map), rawActivities }
 */
export async function fetchClassActivities(classId, date) {
  const res = await api.get(`/daily-activity/class/${classId}`, {
    params: { date },
  });
  const raw = res.data;
  if (!raw.success) throw new Error("Failed to fetch activities");

  const data = raw.data || {};
  const rawActivities = data.activities || [];
  const activitiesMap = {};

  rawActivities.forEach((act) => {
    const normalized = transformActivity(act, date);
    activitiesMap[normalized.key] = normalized;
  });

  return {
    summary: data.summary || { total: 0, withNote: 0, healthAlerts: 0 },
    activities: rawActivities,
    activitiesMap,
  };
}

/**
 * GET /daily-activity/summary?date=YYYY-MM-DD
 * Returns array of { classId, className, totalReports, healthAlerts }
 */
export async function fetchDailySummary(date) {
  const res = await api.get("/daily-activity/summary", { params: { date } });
  const raw = res.data;
  if (!raw.success) throw new Error("Failed to fetch daily summary");
  return (raw.data?.classes || []).map((c) => ({
    classId: c._id,
    className: c.className,
    totalReports: c.totalReports || 0,
    healthAlerts: c.healthAlerts || 0,
  }));
}

/**
 * GET /students?page=1&limit=1000
 * Returns normalized student list
 */
export async function fetchAllStudents() {
  const res = await api.get("/students", { params: { page: 1, limit: 1000 } });
  const raw = res.data;
  if (!raw.success) throw new Error("Failed to fetch students");
  return (raw.data || []).map(transformStudent);
}

/**
 * GET /teachers?page=1&limit=100
 * Returns normalized teacher list
 */
export async function fetchAllTeachers() {
  const res = await api.get("/teachers", { params: { page: 1, limit: 100 } });
  const raw = res.data;
  if (!raw.success) throw new Error("Failed to fetch teachers");
  return (raw.data || []).map(transformTeacher);
}

/**
 * GET /daily-activity/history/all
 * Optional filters: classId, teacherId (this must be the teacher's
 * userId — see transformTeacher), startDate, endDate. Paginated.
 *
 * Returns { records, total, page, pages, count }
 */
export async function fetchActivityHistory({
  classId,
  teacherId,
  startDate,
  endDate,
  page = 1,
  limit = 20,
} = {}) {
  const params = { page, limit };
  if (classId) params.classId = classId;
  if (teacherId) params.teacherId = teacherId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await api.get("/daily-activity/history/all", { params });
  const raw = res.data;
  if (!raw.success) throw new Error(raw.message || "Failed to fetch history");

  return {
    records: (raw.data || []).map(transformHistoryRecord),
    total: raw.total || 0,
    page: raw.page || page,
    pages: raw.pages || 1,
    count: raw.count || 0,
  };
}

/**
 * POST /daily-activity
 * Upsert an activity report
 */
export async function upsertActivity(payload) {
  const res = await api.post("/daily-activity", payload);
  const raw = res.data;
  if (!raw.success) throw new Error(raw.message || "Failed to save activity");
  return raw.data;
}

export default api;