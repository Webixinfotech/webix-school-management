// ─── Keys ───────────────────────────────────────────
const KEYS = {
  students:   'bb_students',
  attendance: 'bb_attendance',
};

// ─── Import students from schoolData ────────────────
import { students as schoolStudents, parents as schoolParents, classes } from './schoolData';

// ─── Helper to get class name from classId ─────────
function getClassName(classId) {
  const cls = classes.find(c => c.id === classId);
  return cls ? cls.name : classId;
}

// ─── Seed students (run once if empty) ──────────────
export function seedStudents() {
  if (localStorage.getItem(KEYS.students)) return;

  // Map schoolData students to QR format
  const students = schoolStudents.map(student => {
    // Find parent name
    const parent = schoolParents.find(p => p.id === student.parentId);
    const parentName = parent ? parent.name : 'Unknown';
    
    // Get class name
    const className = getClassName(student.classId);
    
    return {
      id: student.id,
      name: student.name,
      class: className,
      parentName: parentName,
      mobile: student.phone,
      qrData: JSON.stringify({ 
        studentId: student.id, 
        name: student.name, 
        class: className 
      }),
    };
  });

  localStorage.setItem(KEYS.students, JSON.stringify(students));
}

// ─── Get all students ────────────────────────────────
export function getStudents() {
  return JSON.parse(localStorage.getItem(KEYS.students) || '[]');
}

// ─── Get student by ID ───────────────────────────────
export function getStudentById(id) {
  return getStudents().find(s => s.id === id) || null;
}

// ─── Get all attendance records ──────────────────────
export function getAttendance() {
  return JSON.parse(localStorage.getItem(KEYS.attendance) || '[]');
}

// ─── Get today's record for a student ────────────────
export function getTodayRecord(studentId) {
  const today = new Date().toDateString();
  return getAttendance().find(
    r => r.studentId === studentId && r.date === today
  ) || null;
}

// ─── Core scan logic: IN → OUT toggle ────────────────
// Returns: { action: 'IN'|'OUT', student, time, error? }
export function processScan(qrString) {
  let parsed;
  try {
    parsed = JSON.parse(qrString);
  } catch {
    return { error: 'Invalid QR code' };
  }

  const { studentId } = parsed;
  const student = getStudentById(studentId);
  if (!student) return { error: 'Student not found' };

  const today   = new Date().toDateString();
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const all     = getAttendance();
  const idx     = all.findIndex(r => r.studentId === studentId && r.date === today);

  if (idx === -1) {
    // First scan today → CHECK IN
    const record = {
      id: `ATT-${Date.now()}`,
      studentId,
      studentName: student.name,
      class: student.class,
      date: today,
      checkIn: nowTime,
      checkOut: null,
    };
    all.push(record);
    localStorage.setItem(KEYS.attendance, JSON.stringify(all));
    return { action: 'IN', student, time: nowTime };

  } else if (!all[idx].checkOut) {
    // Second scan → CHECK OUT
    all[idx].checkOut = nowTime;
    localStorage.setItem(KEYS.attendance, JSON.stringify(all));
    return { action: 'OUT', student, time: nowTime };

  } else {
    // Already checked out
    return { error: `${student.name} already checked OUT today at ${all[idx].checkOut}` };
  }
}

// ─── Get today's full attendance list ────────────────
export function getTodayAttendance() {
  const today = new Date().toDateString();
  return getAttendance().filter(r => r.date === today);
}

// ─── Clear today's attendance (for testing) ──────────
export function clearTodayAttendance() {
  const today = new Date().toDateString();
  const filtered = getAttendance().filter(r => r.date !== today);
  localStorage.setItem(KEYS.attendance, JSON.stringify(filtered));
}
