// School Management System Data
// Updated: admissionYear added to students, level added to classes

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = [
  { id: 'USR001', email: 'admin@brainbuilder.com',   password: 'admin123',   role: 'admin',   name: 'Admin User',    phone: '9876543210', profileImage: null },
  { id: 'USR002', email: 'teacher@brainbuilder.com', password: 'teacher123', role: 'teacher', name: 'Rahul Sharma',  phone: '9876543211', profileImage: null },
  { id: 'USR003', email: 'parent@brainbuilder.com',  password: 'parent123',  role: 'parent',  name: 'Mahesh Sharma', phone: '9876543212', profileImage: null },
];

// ─── Classes (level = promotion order) ───────────────────────────────────────
export const classes = [
  { id: 'CLS001', name: 'Nursery A', section: 'A', teacherId: 'TCH001', roomNumber: '101', subject: 'Nursery',       level: 0 },
  { id: 'CLS002', name: 'Nursery B', section: 'B', teacherId: 'TCH002', roomNumber: '102', subject: 'Nursery',       level: 0 },
  { id: 'CLS003', name: 'KG A',      section: 'A', teacherId: 'TCH001', roomNumber: '201', subject: 'Kindergarten',  level: 1 },
  { id: 'CLS004', name: 'KG B',      section: 'B', teacherId: 'TCH003', roomNumber: '202', subject: 'Kindergarten',  level: 1 },
  { id: 'CLS005', name: 'Class 1 A', section: 'A', teacherId: 'TCH004', roomNumber: '301', subject: 'Class 1',       level: 2 },
  { id: 'CLS006', name: 'Class 2 A', section: 'A', teacherId: 'TCH005', roomNumber: '302', subject: 'Class 2',       level: 3 },
  { id: 'CLS007', name: 'Class 3 A', section: 'A', teacherId: 'TCH004', roomNumber: '303', subject: 'Class 3',       level: 4 },
];

// ─── Teachers ─────────────────────────────────────────────────────────────────
export const teachers = [
  { id: 'TCH001', name: 'Meena Sharma',  email: 'meena@brainbuilder.com',  phone: '9876543211', subjects: 'Nursery, KG', classId: 'CLS001', status: 'Active' },
  { id: 'TCH002', name: 'Priya Reddy',   email: 'priya@brainbuilder.com',  phone: '9876543212', subjects: 'Nursery',     classId: 'CLS002', status: 'Active' },
  { id: 'TCH003', name: 'Anita Verma',   email: 'anita@brainbuilder.com',  phone: '9876543213', subjects: 'KG',          classId: 'CLS004', status: 'Active' },
  { id: 'TCH004', name: 'Sunita Patel',  email: 'sunita@brainbuilder.com', phone: '9876543214', subjects: 'Class 1, 3',  classId: 'CLS005', status: 'Active' },
  { id: 'TCH005', name: 'Rajesh Kumar',  email: 'rajesh@brainbuilder.com', phone: '9876543215', subjects: 'Class 2',     classId: 'CLS006', status: 'Active' },
];

// ─── Parents ──────────────────────────────────────────────────────────────────
export const parents = [
  { id: 'PRT001', name: 'Mahesh Sharma',    email: 'mahesh@email.com', phone: '9876543212', address: '123 Main St, City',    children: ['STD001', 'STD007', 'STD009'] },
  { id: 'PRT002', name: 'Sneha Patel',      email: 'sneha@email.com',  phone: '9876543213', address: '456 Oak Ave, City',    children: ['STD002', 'STD008'] },
  { id: 'PRT003', name: 'Kumar Singh',      email: 'kumar@email.com',  phone: '9876543214', address: '789 Pine Rd, City',    children: ['STD003', 'STD004', 'STD010'] },
  { id: 'PRT004', name: 'Priya Reddy',      email: 'priyar@email.com', phone: '9876543215', address: '321 Elm St, City',     children: ['STD005'] },
  { id: 'PRT005', name: 'Amit Verma',       email: 'amit@email.com',   phone: '9876543216', address: '654 Maple Dr, City',   children: ['STD006'] },
  { id: 'PRT006', name: 'Rekha Joshi',      email: 'rekha@email.com',  phone: '9876541001', address: '11 Rose Lane, City',   children: ['STD011', 'STD016'] },
  { id: 'PRT007', name: 'Suresh Gupta',     email: 'suresh@email.com', phone: '9876541002', address: '22 Lotus St, City',    children: ['STD012', 'STD017'] },
  { id: 'PRT008', name: 'Kavita Nair',      email: 'kavita@email.com', phone: '9876541003', address: '33 River Rd, City',    children: ['STD013', 'STD018'] },
  { id: 'PRT009', name: 'Deepak Mehta',     email: 'deepak@email.com', phone: '9876541004', address: '44 Hill Ave, City',    children: ['STD014'] },
  { id: 'PRT010', name: 'Anita Chopra',     email: 'anitac@email.com', phone: '9876541005', address: '55 Park Blvd, City',   children: ['STD015'] },
];

// ─── Students (admissionYear added) ──────────────────────────────────────────
export const students = [
  // 2023 admissions - Nursery
  { id: 'STD001', name: 'Ravi Sharma',      classId: 'CLS001', parentId: 'PRT001', phone: '9876543212', address: '123 Main St, City',  dob: '2020-05-15', status: 'Active',   gender: 'Male',   admissionYear: 2023 },
  { id: 'STD002', name: 'Priya Patel',      classId: 'CLS001', parentId: 'PRT002', phone: '9876543213', address: '456 Oak Ave, City',  dob: '2020-08-20', status: 'Active',   gender: 'Female', admissionYear: 2023 },
  { id: 'STD003', name: 'Rahul Singh',      classId: 'CLS002', parentId: 'PRT003', phone: '9876543214', address: '789 Pine Rd, City',  dob: '2020-03-10', status: 'Active',   gender: 'Male',   admissionYear: 2023 },
  { id: 'STD011', name: 'Kabir Joshi',      classId: 'CLS001', parentId: 'PRT006', phone: '9876541001', address: '11 Rose Lane, City', dob: '2020-02-14', status: 'Active',   gender: 'Male',   admissionYear: 2023 },
  { id: 'STD012', name: 'Aarohi Gupta',     classId: 'CLS002', parentId: 'PRT007', phone: '9876541002', address: '22 Lotus St, City',  dob: '2020-07-09', status: 'Active',   gender: 'Female', admissionYear: 2023 },

  // 2022 admissions - KG
  { id: 'STD004', name: 'Ananya Singh',     classId: 'CLS003', parentId: 'PRT003', phone: '9876543214', address: '789 Pine Rd, City',  dob: '2019-11-05', status: 'Active',   gender: 'Female', admissionYear: 2022 },
  { id: 'STD005', name: 'Vikram Reddy',     classId: 'CLS003', parentId: 'PRT004', phone: '9876543215', address: '321 Elm St, City',   dob: '2019-07-22', status: 'Active',   gender: 'Male',   admissionYear: 2022 },
  { id: 'STD006', name: 'Diya Verma',       classId: 'CLS004', parentId: 'PRT005', phone: '9876543216', address: '654 Maple Dr, City', dob: '2019-01-12', status: 'Active',   gender: 'Female', admissionYear: 2022 },
  { id: 'STD013', name: 'Ishaan Nair',      classId: 'CLS003', parentId: 'PRT008', phone: '9876541003', address: '33 River Rd, City',  dob: '2019-05-21', status: 'Active',   gender: 'Male',   admissionYear: 2022 },
  { id: 'STD014', name: 'Navya Mehta',      classId: 'CLS004', parentId: 'PRT009', phone: '9876541004', address: '44 Hill Ave, City',  dob: '2019-09-17', status: 'Active',   gender: 'Female', admissionYear: 2022 },

  // 2021 admissions - Class 1
  { id: 'STD007', name: 'Arjun Kumar',      classId: 'CLS005', parentId: 'PRT001', phone: '9876543212', address: '123 Main St, City',  dob: '2018-06-18', status: 'Active',   gender: 'Male',   admissionYear: 2021 },
  { id: 'STD008', name: 'Saanvi Patel',     classId: 'CLS005', parentId: 'PRT002', phone: '9876543213', address: '456 Oak Ave, City',  dob: '2018-09-25', status: 'Inactive', gender: 'Female', admissionYear: 2021 },
  { id: 'STD015', name: 'Siddharth Chopra', classId: 'CLS005', parentId: 'PRT010', phone: '9876541005', address: '55 Park Blvd, City', dob: '2018-11-30', status: 'Active',   gender: 'Male',   admissionYear: 2021 },

  // 2020 admissions - Class 2
  { id: 'STD009', name: 'Aryan Sharma',     classId: 'CLS006', parentId: 'PRT001', phone: '9876543212', address: '123 Main St, City',  dob: '2017-04-30', status: 'Active',   gender: 'Male',   admissionYear: 2020 },
  { id: 'STD010', name: 'Myra Singh',       classId: 'CLS006', parentId: 'PRT003', phone: '9876543214', address: '789 Pine Rd, City',  dob: '2017-12-08', status: 'Active',   gender: 'Female', admissionYear: 2020 },
  { id: 'STD016', name: 'Tanvi Sharma',     classId: 'CLS006', parentId: 'PRT006', phone: '9876541001', address: '11 Rose Lane, City', dob: '2017-08-05', status: 'Active',   gender: 'Female', admissionYear: 2020 },

  // 2019 admissions - Class 3
  { id: 'STD017', name: 'Dev Patel',        classId: 'CLS007', parentId: 'PRT007', phone: '9876541002', address: '22 Lotus St, City',  dob: '2016-03-22', status: 'Active',   gender: 'Male',   admissionYear: 2019 },
  { id: 'STD018', name: 'Aisha Singh',      classId: 'CLS007', parentId: 'PRT008', phone: '9876541003', address: '33 River Rd, City',  dob: '2016-06-11', status: 'Inactive', gender: 'Female', admissionYear: 2019 },
];

// ─── Attendance Records ───────────────────────────────────────────────────────
export const attendanceRecords = [
  { id: 'ATT001', studentId: 'STD001', classId: 'CLS001', date: '2025-03-15', status: 'Present', time: '09:00 AM' },
  { id: 'ATT002', studentId: 'STD002', classId: 'CLS001', date: '2025-03-15', status: 'Present', time: '09:05 AM' },
  { id: 'ATT003', studentId: 'STD003', classId: 'CLS002', date: '2025-03-15', status: 'Present', time: '09:10 AM' },
  { id: 'ATT004', studentId: 'STD004', classId: 'CLS003', date: '2025-03-15', status: 'Absent',  time: '-' },
  { id: 'ATT005', studentId: 'STD005', classId: 'CLS003', date: '2025-03-15', status: 'Present', time: '09:15 AM' },
  { id: 'ATT006', studentId: 'STD006', classId: 'CLS004', date: '2025-03-15', status: 'Present', time: '09:00 AM' },
  { id: 'ATT007', studentId: 'STD007', classId: 'CLS005', date: '2025-03-15', status: 'Present', time: '09:20 AM' },
  { id: 'ATT008', studentId: 'STD008', classId: 'CLS005', date: '2025-03-15', status: 'Absent',  time: '-' },
  { id: 'ATT009', studentId: 'STD009', classId: 'CLS006', date: '2025-03-15', status: 'Present', time: '09:25 AM' },
  { id: 'ATT010', studentId: 'STD010', classId: 'CLS006', date: '2025-03-15', status: 'Present', time: '09:30 AM' },
];

// ─── QR Codes ─────────────────────────────────────────────────────────────────
export const qrCodes = [
  { id: 'QR001', classId: 'CLS001', code: 'BRAIN-BUILDER-CLS001-2025', generatedAt: '2025-03-15 08:00:00', validUntil: '2025-03-15 12:00:00' },
  { id: 'QR002', classId: 'CLS002', code: 'BRAIN-BUILDER-CLS002-2025', generatedAt: '2025-03-15 08:00:00', validUntil: '2025-03-15 12:00:00' },
  { id: 'QR003', classId: 'CLS003', code: 'BRAIN-BUILDER-CLS003-2025', generatedAt: '2025-03-15 08:00:00', validUntil: '2025-03-15 12:00:00' },
  { id: 'QR004', classId: 'CLS004', code: 'BRAIN-BUILDER-CLS004-2025', generatedAt: '2025-03-15 08:00:00', validUntil: '2025-03-15 12:00:00' },
  { id: 'QR005', classId: 'CLS005', code: 'BRAIN-BUILDER-CLS005-2025', generatedAt: '2025-03-15 08:00:00', validUntil: '2025-03-15 12:00:00' },
  { id: 'QR006', classId: 'CLS006', code: 'BRAIN-BUILDER-CLS006-2025', generatedAt: '2025-03-15 08:00:00', validUntil: '2025-03-15 12:00:00' },
  { id: 'QR007', classId: 'CLS007', code: 'BRAIN-BUILDER-CLS007-2025', generatedAt: '2025-03-15 08:00:00', validUntil: '2025-03-15 12:00:00' },
];

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = [
  { id: 'NOT001', title: 'Holiday Announcement', message: 'School will be closed on 20th March for Holi',         type: 'Holiday',  date: '2025-03-14', sentBy: 'Admin',  targetRole: 'all' },
  { id: 'NOT002', title: 'Exam Schedule',         message: 'Unit Test exams will start from 25th March',          type: 'Exam',     date: '2025-03-13', sentBy: 'Admin',  targetRole: 'all' },
  { id: 'NOT003', title: 'Homework Reminder',     message: 'Complete your math homework by Monday',               type: 'Homework', date: '2025-03-15', sentBy: 'TCH001', targetRole: 'student' },
  { id: 'NOT004', title: 'Parent Meeting',         message: 'Parent-Teacher meeting scheduled for 25th March',    type: 'Meeting',  date: '2025-03-12', sentBy: 'Admin',  targetRole: 'parent' },
];

// ─── Homework ─────────────────────────────────────────────────────────────────
export const homeworks = [
  { id: 'HW001', classId: 'CLS001', subject: 'Math',    description: 'Complete worksheet page 10-12',          dueDate: '2025-03-18', assignedBy: 'TCH001' },
  { id: 'HW002', classId: 'CLS001', subject: 'English',  description: 'Write 5 sentences about your family',   dueDate: '2025-03-19', assignedBy: 'TCH001' },
  { id: 'HW003', classId: 'CLS003', subject: 'Math',    description: 'Practice addition sums 1-20',            dueDate: '2025-03-17', assignedBy: 'TCH001' },
  { id: 'HW004', classId: 'CLS005', subject: 'Science', description: 'Draw and label the water cycle',         dueDate: '2025-03-20', assignedBy: 'TCH004' },
];

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = (role) => {
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceRecords.filter(r => r.date === today);

  if (role === 'admin') {
    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalParents: parents.length,
      todayAttendance: todayAttendance.filter(r => r.status === 'Present').length,
      totalAttendance: students.length,
    };
  }
  if (role === 'teacher') {
    return {
      myClasses: classes.length,
      todayAttendance: todayAttendance.filter(r => r.status === 'Present').length,
      totalStudents: students.length,
      pendingTasks: 3,
    };
  }
  if (role === 'parent') {
    const parent = parents[0];
    const childIds = parent.children;
    const childAttendance = attendanceRecords.filter(r => childIds.includes(r.studentId));
    const presentDays = childAttendance.filter(r => r.status === 'Present').length;
    const totalDays = childAttendance.length;
    return {
      childAttendance: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
      classInfo: classes[0].name,
      teacherMessage: 'Great progress this week!',
      pendingHomework: homeworks.filter(hw => hw.classId === students.find(s => s.id === childIds[0])?.classId).length,
    };
  }
  return {};
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const getUsersByRole    = (role)      => users.filter(u => u.role === role);
export const getStudentsByClass = (classId)  => students.filter(s => s.classId === classId);
export const getClassById       = (classId)  => classes.find(c => c.id === classId);
export const getTeacherById     = (teacherId)=> teachers.find(t => t.id === teacherId);
export const getParentById      = (parentId) => parents.find(p => p.id === parentId);
export const getStudentById     = (studentId)=> students.find(s => s.id === studentId);

// Promotion helper — returns next class by level
export const getNextClass = (currentClassId) => {
  const current = classes.find(c => c.id === currentClassId);
  if (!current) return null;
  return classes.find(c => c.level === current.level + 1) || null;
};