// ─── School Management System — Comprehensive Data ───────────────────────────
// File: src/data/smsData.js

// ─── Class Schedule Definitions (flow-based) ─────────────────────────────────
// 1.PG: 10–12:30 | 2.NUR: 10–1 | 3.KG1: 10–1:30 | 4.KG2: 10–1:30
// 5.Daycare: custom/student | 6.A2S: 4–6pm
// 7.TG-PG: 1hr/week | 8.NUR-TG: 1hr/week | 9.TG-KG: 2hr×2/week
// 10.TG-KG2: 2hr×2/week | 11.Paid Hours: 1hr/Saturday | 12.Flexicard: admin
export const CLASS_SCHEDULES = {
  PG:         { name: '1. PG',           startTime: '10:00', endTime: '12:30', duration: 2.5, frequency: 'Daily',               hasFixedTime: true,  isDaycare: false, isFlexicard: false },
  NUR:        { name: '2. NUR',          startTime: '10:00', endTime: '13:00', duration: 3,   frequency: 'Daily',               hasFixedTime: true,  isDaycare: false, isFlexicard: false },
  KG1:        { name: '3. KG1',          startTime: '10:00', endTime: '13:30', duration: 3.5, frequency: 'Daily',               hasFixedTime: true,  isDaycare: false, isFlexicard: false },
  KG2:        { name: '4. KG2',          startTime: '10:00', endTime: '13:30', duration: 3.5, frequency: 'Daily',               hasFixedTime: true,  isDaycare: false, isFlexicard: false },
  DAYCARE:    { name: '5. Daycare',      startTime: null,    endTime: null,    duration: null, frequency: 'Custom per student',  hasFixedTime: false, isDaycare: true,  isFlexicard: false },
  A2S:        { name: '6. A2S',          startTime: '16:00', endTime: '18:00', duration: 2,   frequency: 'Daily (4pm–6pm)',     hasFixedTime: true,  isDaycare: false, isFlexicard: false },
  TG_PG:      { name: '7. TG-PG',       startTime: null,    endTime: null,    duration: 1,   frequency: '1 Hr once a week',    hasFixedTime: false, isDaycare: false, isFlexicard: false },
  NUR_TG:     { name: '8. NUR-TG',      startTime: null,    endTime: null,    duration: 1,   frequency: '1 Hr weekly',         hasFixedTime: false, isDaycare: false, isFlexicard: false },
  TG_KG:      { name: '9. TG-KG',       startTime: null,    endTime: null,    duration: 2,   frequency: '2 Hr twice a week',   hasFixedTime: false, isDaycare: false, isFlexicard: false },
  TG_KG2:     { name: '10. TG-KG2',     startTime: null,    endTime: null,    duration: 2,   frequency: '2 Hr twice a week',   hasFixedTime: false, isDaycare: false, isFlexicard: false },
  PAID_HOURS: { name: '11. Paid Hours',  startTime: null,    endTime: null,    duration: 1,   frequency: '1 Hr every Saturday', hasFixedTime: false, isDaycare: false, isFlexicard: false },
  FLEXICARD:  { name: '12. Flexicard',   startTime: null,    endTime: null,    duration: null, frequency: 'Admin sets hours',    hasFixedTime: false, isDaycare: false, isFlexicard: true  },
};

// ─── Enrollment Types ─────────────────────────────────────────────────────────
// Each student-class combo can have an enrollment type
export const ENROLLMENT_TYPES = [
  { id: 'REGULAR',   label: 'Regular',   color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'DAYCARE',   label: 'Daycare',   color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  { id: 'FLEXICARD', label: 'Flexicard', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
];

// ─── Format Time Helper ───────────────────────────────────────────────────────
export const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes || '00'} ${ampm}`;
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = [
  { id: 'USR001', email: 'admin@brainbuilder.com',   password: 'admin123',   role: 'admin',   name: 'Admin User',    phone: '9876543210', profileImage: null },
  { id: 'USR002', email: 'teacher@brainbuilder.com', password: 'teacher123', role: 'teacher', name: 'Rahul Sharma',  phone: '9876543211', profileImage: null },
  { id: 'USR003', email: 'parent@brainbuilder.com',  password: 'parent123',  role: 'parent',  name: 'Mahesh Sharma', phone: '9876543212', profileImage: null },
];

// ─── Teachers ────────────────────────────────────────────────────────────────
export const teachers = [
  { id: 'TCH001', employeeId: 'EMP001', name: 'Meena Sharma',  email: 'meena@brainbuilder.com',  phone: '9876543211', dob: '1985-06-15', dateOfJoining: '2020-04-01', subjects: 'Nursery, KG',   classIds: ['CLS001', 'CLS003'], status: 'Active', canViewStudentMobile: true,  qrCode: 'BRAIN-BUILDER-TCH001-EMP001', profileImage: null },
  { id: 'TCH002', employeeId: 'EMP002', name: 'Priya Reddy',   email: 'priya@brainbuilder.com',  phone: '9876543212', dob: '1988-03-22', dateOfJoining: '2021-06-15', subjects: 'Nursery',       classIds: ['CLS002'],          status: 'Active', canViewStudentMobile: false, qrCode: 'BRAIN-BUILDER-TCH002-EMP002', profileImage: null },
  { id: 'TCH003', employeeId: 'EMP003', name: 'Anita Verma',   email: 'anita@brainbuilder.com',  phone: '9876543213', dob: '1990-09-10', dateOfJoining: '2019-04-01', subjects: 'KG',            classIds: ['CLS004'],          status: 'Active', canViewStudentMobile: true,  qrCode: 'BRAIN-BUILDER-TCH003-EMP003', profileImage: null },
  { id: 'TCH004', employeeId: 'EMP004', name: 'Sunita Patel',  email: 'sunita@brainbuilder.com', phone: '9876543214', dob: '1987-12-05', dateOfJoining: '2018-04-01', subjects: 'Class 1, 3',    classIds: ['CLS005', 'CLS007'], status: 'Active', canViewStudentMobile: true,  qrCode: 'BRAIN-BUILDER-TCH004-EMP004', profileImage: null },
  { id: 'TCH005', employeeId: 'EMP005', name: 'Rajesh Kumar',  email: 'rajesh@brainbuilder.com', phone: '9876543215', dob: '1982-07-18', dateOfJoining: '2017-04-01', subjects: 'Class 2',       classIds: ['CLS006'],          status: 'Active', canViewStudentMobile: false, qrCode: 'BRAIN-BUILDER-TCH005-EMP005', profileImage: null },
];

// ─── Classes ─────────────────────────────────────────────────────────────────
// scheduleType must be a key from CLASS_SCHEDULES above
// startTime/endTime: for fixed-time classes, auto-set from CLASS_SCHEDULES
//                    for daycare, set as null (per student)
//                    for weekly, set as null (admin allots per session)
// paidFlexiHours / freeFlexiHours: default flexi hours for this class
export const classes = [
  { id: 'CLS001', name: 'PG Morning',   section: 'A', teacherId: 'TCH001', roomNumber: '101', subject: 'Pre-Primary',  scheduleType: 'PG',        startTime: '10:00', endTime: '12:30', customTiming: false, paidFlexiHours: 0, freeFlexiHours: 6 },
  { id: 'CLS002', name: 'NUR Batch A',  section: 'A', teacherId: 'TCH001', roomNumber: '102', subject: 'Nursery',       scheduleType: 'NUR',       startTime: '10:00', endTime: '13:00', customTiming: false, paidFlexiHours: 0, freeFlexiHours: 6 },
  { id: 'CLS003', name: 'NUR Batch B',  section: 'B', teacherId: 'TCH002', roomNumber: '103', subject: 'Nursery',       scheduleType: 'NUR',       startTime: '10:00', endTime: '13:00', customTiming: false, paidFlexiHours: 0, freeFlexiHours: 6 },
  { id: 'CLS004', name: 'KG A',         section: 'A', teacherId: 'TCH001', roomNumber: '201', subject: 'Kindergarten',  scheduleType: 'KG1',       startTime: '10:00', endTime: '13:30', customTiming: false, paidFlexiHours: 0, freeFlexiHours: 6 },
  { id: 'CLS005', name: 'KG B',         section: 'B', teacherId: 'TCH003', roomNumber: '202', subject: 'Kindergarten',  scheduleType: 'KG1',       startTime: '10:00', endTime: '13:30', customTiming: false, paidFlexiHours: 0, freeFlexiHours: 6 },
  { id: 'CLS006', name: 'Daycare',      section: 'A', teacherId: 'TCH003', roomNumber: 'G01', subject: 'Daycare',       scheduleType: 'DAYCARE',   startTime: null,    endTime: null,    customTiming: true,  paidFlexiHours: 0, freeFlexiHours: 0 },
  { id: 'CLS007', name: 'A2S Evening',  section: 'A', teacherId: 'TCH004', roomNumber: '301', subject: 'After School',  scheduleType: 'A2S',       startTime: '16:00', endTime: '18:00', customTiming: false, paidFlexiHours: 0, freeFlexiHours: 6 },
  { id: 'CLS008', name: 'TG-PG',        section: 'A', teacherId: 'TCH001', roomNumber: '104', subject: 'TG-PG',         scheduleType: 'TG_PG',     startTime: null,    endTime: null,    customTiming: false, paidFlexiHours: 0, freeFlexiHours: 6 },
  { id: 'CLS009', name: 'NUR-TG',       section: 'A', teacherId: 'TCH002', roomNumber: '105', subject: 'NUR-TG',        scheduleType: 'NUR_TG',    startTime: null,    endTime: null,    customTiming: false, paidFlexiHours: 0, freeFlexiHours: 6 },
  { id: 'CLS010', name: 'TG-KG Batch',  section: 'A', teacherId: 'TCH001', roomNumber: '203', subject: 'TG-KG',         scheduleType: 'TG_KG',     startTime: null,    endTime: null,    customTiming: false, paidFlexiHours: 4, freeFlexiHours: 6 },
  { id: 'CLS011', name: 'TG-KG2',       section: 'A', teacherId: 'TCH004', roomNumber: '204', subject: 'TG-KG2',        scheduleType: 'TG_KG2',    startTime: null,    endTime: null,    customTiming: false, paidFlexiHours: 4, freeFlexiHours: 6 },
  { id: 'CLS012', name: 'Paid Hours',   section: 'A', teacherId: 'TCH005', roomNumber: '302', subject: 'Paid Hours',    scheduleType: 'PAID_HOURS',startTime: null,    endTime: null,    customTiming: false, paidFlexiHours: 0, freeFlexiHours: 0 },
  { id: 'CLS013', name: 'Flexicard',    section: 'A', teacherId: 'TCH005', roomNumber: '303', subject: 'Flexicard',     scheduleType: 'FLEXICARD', startTime: null,    endTime: null,    customTiming: false, paidFlexiHours: 2, freeFlexiHours: 6 },
];

// ─── Parents ─────────────────────────────────────────────────────────────────
export const parents = [
  { id: 'PRT001', fatherName: 'Mahesh Sharma',  fatherMobile: '9876543212', fatherEmail: 'mahesh@email.com',  motherName: 'Sunita Sharma',  motherMobile: '9876543219', motherEmail: 'sunita@email.com',  address: '123 Main St, Indore',    children: ['STD001', 'STD007', 'STD009'] },
  { id: 'PRT002', fatherName: 'Sneha Patel',    fatherMobile: '9876543213', fatherEmail: 'sneha@email.com',   motherName: 'Riya Patel',     motherMobile: '9876543218', motherEmail: '',                  address: '456 Oak Ave, Indore',    children: ['STD002', 'STD008'] },
  { id: 'PRT003', fatherName: 'Kumar Singh',    fatherMobile: '9876543214', fatherEmail: 'kumar@email.com',   motherName: 'Anita Singh',    motherMobile: '9876543217', motherEmail: 'anita@email.com',   address: '789 Pine Rd, Indore',    children: ['STD003', 'STD004', 'STD010'] },
  { id: 'PRT004', fatherName: 'Priya Reddy',    fatherMobile: '9876543215', fatherEmail: 'priyar@email.com',  motherName: '',               motherMobile: '',           motherEmail: '',                  address: '321 Elm St, Indore',     children: ['STD005'] },
  { id: 'PRT005', fatherName: 'Amit Verma',     fatherMobile: '9876543216', fatherEmail: 'amit@email.com',    motherName: 'Pooja Verma',    motherMobile: '9876543220', motherEmail: 'pooja@email.com',   address: '654 Maple Dr, Indore',   children: ['STD006'] },
  { id: 'PRT006', fatherName: 'Rekha Joshi',    fatherMobile: '9876541001', fatherEmail: 'rekha@email.com',   motherName: 'Meena Joshi',    motherMobile: '9876541010', motherEmail: '',                  address: '11 Rose Lane, Indore',   children: ['STD011', 'STD016'] },
  { id: 'PRT007', fatherName: 'Suresh Gupta',   fatherMobile: '9876541002', fatherEmail: 'suresh@email.com',  motherName: 'Kavya Gupta',    motherMobile: '9876541011', motherEmail: 'kavya@email.com',   address: '22 Lotus St, Indore',    children: ['STD012', 'STD017'] },
  { id: 'PRT008', fatherName: 'Kavita Nair',    fatherMobile: '9876541003', fatherEmail: 'kavita@email.com',  motherName: '',               motherMobile: '',           motherEmail: '',                  address: '33 River Rd, Indore',    children: ['STD013', 'STD018'] },
  { id: 'PRT009', fatherName: 'Deepak Mehta',   fatherMobile: '9876541004', fatherEmail: 'deepak@email.com',  motherName: 'Asha Mehta',     motherMobile: '9876541012', motherEmail: 'asha@email.com',    address: '44 Hill Ave, Indore',    children: ['STD014'] },
  { id: 'PRT010', fatherName: 'Anita Chopra',   fatherMobile: '9876541005', fatherEmail: 'anitac@email.com',  motherName: 'Neha Chopra',    motherMobile: '9876541013', motherEmail: '',                  address: '55 Park Blvd, Indore',   children: ['STD015'] },
];

// ─── Students ─────────────────────────────────────────────────────────────────
// enrollmentTypes: { classId: 'REGULAR' | 'DAYCARE' | 'FLEXICARD' }
// daycareTimings:  { classId: { start: 'HH:MM', end: 'HH:MM' } }  — set per student for daycare
// classIds:        array — student can be in multiple classes
export const students = [
  {
    id: 'STD001', name: 'Ravi Sharma',     gender: 'Male',   dob: '2020-05-15',
    classIds: ['CLS001'],
    enrollmentTypes: { 'CLS001': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT001', phone: '9876543212', status: 'Active',
    admissionYear: 2023, enrollmentId: 'ENR2023001', joiningDate: '2023-06-01',
    qrCode: 'BRAIN-BUILDER-STD001-ENR2023001',
    paidFlexiHours: 10, freeFlexiHours: 5, consumedFlexiHours: 8,
    attendanceRecords: [],
  },
  {
    id: 'STD002', name: 'Priya Patel',     gender: 'Female', dob: '2020-08-20',
    classIds: ['CLS002', 'CLS008'],                           // NUR + TG-PG
    enrollmentTypes: { 'CLS002': 'REGULAR', 'CLS008': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT002', phone: '9876543213', status: 'Active',
    admissionYear: 2023, enrollmentId: 'ENR2023002', joiningDate: '2023-06-01',
    qrCode: 'BRAIN-BUILDER-STD002-ENR2023002',
    paidFlexiHours: 15, freeFlexiHours: 8, consumedFlexiHours: 20,
    attendanceRecords: [],
  },
  {
    id: 'STD003', name: 'Rahul Singh',     gender: 'Male',   dob: '2020-03-10',
    classIds: ['CLS003'],
    enrollmentTypes: { 'CLS003': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT003', phone: '9876543214', status: 'Active',
    admissionYear: 2023, enrollmentId: 'ENR2023003', joiningDate: '2023-06-01',
    qrCode: 'BRAIN-BUILDER-STD003-ENR2023003',
    paidFlexiHours: 20, freeFlexiHours: 10, consumedFlexiHours: 5,
    attendanceRecords: [],
  },
  {
    id: 'STD004', name: 'Ananya Singh',    gender: 'Female', dob: '2019-11-05',
    classIds: ['CLS004'],
    enrollmentTypes: { 'CLS004': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT003', phone: '9876543214', status: 'Active',
    admissionYear: 2022, enrollmentId: 'ENR2022004', joiningDate: '2022-06-01',
    qrCode: 'BRAIN-BUILDER-STD004-ENR2022004',
    paidFlexiHours: 25, freeFlexiHours: 12, consumedFlexiHours: 30,
    attendanceRecords: [],
  },
  {
    id: 'STD005', name: 'Vikram Reddy',    gender: 'Male',   dob: '2019-07-22',
    classIds: ['CLS004', 'CLS010'],                           // KG + TG-KG
    enrollmentTypes: { 'CLS004': 'REGULAR', 'CLS010': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT004', phone: '9876543215', status: 'Active',
    admissionYear: 2022, enrollmentId: 'ENR2022005', joiningDate: '2022-06-01',
    qrCode: 'BRAIN-BUILDER-STD005-ENR2022005',
    paidFlexiHours: 0, freeFlexiHours: 0, consumedFlexiHours: 0,
    attendanceRecords: [],
  },
  {
    id: 'STD006', name: 'Diya Verma',      gender: 'Female', dob: '2019-01-12',
    classIds: ['CLS005', 'CLS006'],                           // KG + Daycare
    enrollmentTypes: { 'CLS005': 'REGULAR', 'CLS006': 'DAYCARE' },
    daycareTimings: { 'CLS006': { start: '08:00', end: '17:00' } },
    parentId: 'PRT005', phone: '9876543216', status: 'Active',
    admissionYear: 2022, enrollmentId: 'ENR2022006', joiningDate: '2022-06-01',
    qrCode: 'BRAIN-BUILDER-STD006-ENR2022006',
    paidFlexiHours: 40, freeFlexiHours: 20, consumedFlexiHours: 35,
    attendanceRecords: [],
  },
  {
    id: 'STD007', name: 'Arjun Kumar',     gender: 'Male',   dob: '2018-06-18',
    classIds: ['CLS007'],
    enrollmentTypes: { 'CLS007': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT001', phone: '9876543212', status: 'Active',
    admissionYear: 2021, enrollmentId: 'ENR2021007', joiningDate: '2021-06-01',
    qrCode: 'BRAIN-BUILDER-STD007-ENR2021007',
    paidFlexiHours: 30, freeFlexiHours: 15, consumedFlexiHours: 40,
    attendanceRecords: [],
  },
  {
    id: 'STD008', name: 'Saanvi Patel',    gender: 'Female', dob: '2018-09-25',
    classIds: ['CLS007'],
    enrollmentTypes: { 'CLS007': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT002', phone: '9876543213', status: 'Inactive',
    admissionYear: 2021, enrollmentId: 'ENR2021008', joiningDate: '2021-06-01',
    qrCode: 'BRAIN-BUILDER-STD008-ENR2021008',
    paidFlexiHours: 0, freeFlexiHours: 0, consumedFlexiHours: 0,
    attendanceRecords: [],
  },
  {
    id: 'STD009', name: 'Aryan Sharma',    gender: 'Male',   dob: '2017-04-30',
    classIds: ['CLS013'],                                     // Flexicard
    enrollmentTypes: { 'CLS013': 'FLEXICARD' },
    daycareTimings: {},
    parentId: 'PRT001', phone: '9876543212', status: 'Active',
    admissionYear: 2020, enrollmentId: 'ENR2020009', joiningDate: '2020-06-01',
    qrCode: 'BRAIN-BUILDER-STD009-ENR2020009',
    paidFlexiHours: 50, freeFlexiHours: 25, consumedFlexiHours: 60,
    attendanceRecords: [],
  },
  {
    id: 'STD010', name: 'Myra Singh',      gender: 'Female', dob: '2017-12-08',
    classIds: ['CLS007', 'CLS013'],                           // A2S + Flexicard
    enrollmentTypes: { 'CLS007': 'REGULAR', 'CLS013': 'FLEXICARD' },
    daycareTimings: {},
    parentId: 'PRT003', phone: '9876543214', status: 'Active',
    admissionYear: 2020, enrollmentId: 'ENR2020010', joiningDate: '2020-06-01',
    qrCode: 'BRAIN-BUILDER-STD010-ENR2020010',
    paidFlexiHours: 35, freeFlexiHours: 18, consumedFlexiHours: 45,
    attendanceRecords: [],
  },
  {
    id: 'STD011', name: 'Kabir Joshi',     gender: 'Male',   dob: '2020-02-14',
    classIds: ['CLS002', 'CLS006'],                           // NUR + Daycare
    enrollmentTypes: { 'CLS002': 'REGULAR', 'CLS006': 'DAYCARE' },
    daycareTimings: { 'CLS006': { start: '07:30', end: '18:30' } },
    parentId: 'PRT006', phone: '9876541001', status: 'Active',
    admissionYear: 2023, enrollmentId: 'ENR2023011', joiningDate: '2023-06-01',
    qrCode: 'BRAIN-BUILDER-STD011-ENR2023011',
    paidFlexiHours: 60, freeFlexiHours: 30, consumedFlexiHours: 25,
    attendanceRecords: [],
  },
  {
    id: 'STD012', name: 'Aarohi Gupta',    gender: 'Female', dob: '2020-07-09',
    classIds: ['CLS003'],
    enrollmentTypes: { 'CLS003': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT007', phone: '9876541002', status: 'Active',
    admissionYear: 2023, enrollmentId: 'ENR2023012', joiningDate: '2023-06-01',
    qrCode: 'BRAIN-BUILDER-STD012-ENR2023012',
    paidFlexiHours: 5, freeFlexiHours: 3, consumedFlexiHours: 6,
    attendanceRecords: [],
  },
  {
    id: 'STD013', name: 'Ishaan Nair',     gender: 'Male',   dob: '2019-05-21',
    classIds: ['CLS004', 'CLS009'],                           // KG + NUR-TG
    enrollmentTypes: { 'CLS004': 'REGULAR', 'CLS009': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT008', phone: '9876541003', status: 'Active',
    admissionYear: 2022, enrollmentId: 'ENR2022013', joiningDate: '2022-06-01',
    qrCode: 'BRAIN-BUILDER-STD013-ENR2022013',
    paidFlexiHours: 20, freeFlexiHours: 10, consumedFlexiHours: 15,
    attendanceRecords: [],
  },
  {
    id: 'STD014', name: 'Navya Mehta',     gender: 'Female', dob: '2019-09-17',
    classIds: ['CLS005'],
    enrollmentTypes: { 'CLS005': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT009', phone: '9876541004', status: 'Active',
    admissionYear: 2022, enrollmentId: 'ENR2022014', joiningDate: '2022-06-01',
    qrCode: 'BRAIN-BUILDER-STD014-ENR2022014',
    paidFlexiHours: 12, freeFlexiHours: 6, consumedFlexiHours: 14,
    attendanceRecords: [],
  },
  {
    id: 'STD015', name: 'Siddharth Chopra',gender: 'Male',   dob: '2018-11-30',
    classIds: ['CLS007', 'CLS011'],                           // A2S + TG-KG2
    enrollmentTypes: { 'CLS007': 'REGULAR', 'CLS011': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT010', phone: '9876541005', status: 'Active',
    admissionYear: 2021, enrollmentId: 'ENR2021015', joiningDate: '2021-06-01',
    qrCode: 'BRAIN-BUILDER-STD015-ENR2021015',
    paidFlexiHours: 45, freeFlexiHours: 22, consumedFlexiHours: 50,
    attendanceRecords: [],
  },
  {
    id: 'STD016', name: 'Tanvi Sharma',    gender: 'Female', dob: '2017-08-05',
    classIds: ['CLS007'],
    enrollmentTypes: { 'CLS007': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT006', phone: '9876541001', status: 'Active',
    admissionYear: 2020, enrollmentId: 'ENR2020016', joiningDate: '2020-06-01',
    qrCode: 'BRAIN-BUILDER-STD016-ENR2020016',
    paidFlexiHours: 8, freeFlexiHours: 4, consumedFlexiHours: 8,
    attendanceRecords: [],
  },
  {
    id: 'STD017', name: 'Dev Patel',       gender: 'Male',   dob: '2016-03-22',
    classIds: ['CLS007'],
    enrollmentTypes: { 'CLS007': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT007', phone: '9876541002', status: 'Active',
    admissionYear: 2019, enrollmentId: 'ENR2019017', joiningDate: '2019-06-01',
    qrCode: 'BRAIN-BUILDER-STD017-ENR2019017',
    paidFlexiHours: 100, freeFlexiHours: 50, consumedFlexiHours: 80,
    attendanceRecords: [],
  },
  {
    id: 'STD018', name: 'Aisha Singh',     gender: 'Female', dob: '2016-06-11',
    classIds: ['CLS007'],
    enrollmentTypes: { 'CLS007': 'REGULAR' },
    daycareTimings: {},
    parentId: 'PRT008', phone: '9876541003', status: 'Inactive',
    admissionYear: 2019, enrollmentId: 'ENR2019018', joiningDate: '2019-06-01',
    qrCode: 'BRAIN-BUILDER-STD018-ENR2019018',
    paidFlexiHours: 0, freeFlexiHours: 0, consumedFlexiHours: 0,
    attendanceRecords: [],
  },
];

// ─── Daily Attendance ─────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];

export const dailyAttendance = [
  { id: 'ATT001', studentId: 'STD001', classId: 'CLS001', date: today, status: 'Present', checkInTime: '09:00', checkOutTime: '12:30' },
  { id: 'ATT002', studentId: 'STD002', classId: 'CLS002', date: today, status: 'Present', checkInTime: '09:05', checkOutTime: '13:00' },
  { id: 'ATT003', studentId: 'STD003', classId: 'CLS003', date: today, status: 'Present', checkInTime: '09:10', checkOutTime: '13:00' },
  { id: 'ATT004', studentId: 'STD004', classId: 'CLS004', date: today, status: 'Absent',  checkInTime: null,    checkOutTime: null    },
  { id: 'ATT005', studentId: 'STD005', classId: 'CLS004', date: today, status: 'Present', checkInTime: '09:15', checkOutTime: '13:30' },
  { id: 'ATT006', studentId: 'STD006', classId: 'CLS006', date: today, status: 'Present', checkInTime: '08:00', checkOutTime: '17:00' },
  { id: 'ATT007', studentId: 'STD007', classId: 'CLS007', date: today, status: 'Present', checkInTime: '16:00', checkOutTime: '18:00' },
  { id: 'ATT008', studentId: 'STD011', classId: 'CLS006', date: today, status: 'Present', checkInTime: '07:30', checkOutTime: '18:30' },
  { id: 'ATT009', studentId: 'STD012', classId: 'CLS003', date: today, status: 'Present', checkInTime: '09:00', checkOutTime: '13:00' },
  { id: 'ATT010', studentId: 'STD013', classId: 'CLS004', date: today, status: 'Present', checkInTime: '09:00', checkOutTime: '13:30' },
];

// ─── Attendance History ───────────────────────────────────────────────────────
export const attendanceHistory = [
  { id: 'HIST001', studentId: 'STD001', date: '2025-03-20', status: 'Present', checkInTime: '09:00', checkOutTime: '12:30' },
  { id: 'HIST002', studentId: 'STD001', date: '2025-03-19', status: 'Present', checkInTime: '09:05', checkOutTime: '12:30' },
  { id: 'HIST003', studentId: 'STD001', date: '2025-03-18', status: 'Absent',  checkInTime: null,    checkOutTime: null    },
  { id: 'HIST004', studentId: 'STD001', date: '2025-03-17', status: 'Present', checkInTime: '09:00', checkOutTime: '12:30' },
  { id: 'HIST005', studentId: 'STD001', date: '2025-03-16', status: 'Present', checkInTime: '09:10', checkOutTime: '12:30' },
];

// ─── Flexi Transactions ───────────────────────────────────────────────────────
export const flexiTransactions = [
  { id: 'FT001', studentId: 'STD001', type: 'paid',     hours:  10, date: '2025-01-15', description: 'Flexi hours purchase',    balanceAfter: 10 },
  { id: 'FT002', studentId: 'STD001', type: 'free',     hours:   5, date: '2025-01-15', description: 'Welcome bonus',           balanceAfter: 15 },
  { id: 'FT003', studentId: 'STD001', type: 'consumed', hours:  -3, date: '2025-02-10', description: 'Extra class session',     balanceAfter: 12 },
  { id: 'FT004', studentId: 'STD001', type: 'consumed', hours:  -5, date: '2025-03-05', description: 'Workshop attendance',     balanceAfter:  7 },
  { id: 'FT005', studentId: 'STD006', type: 'paid',     hours:  40, date: '2025-01-10', description: 'Flexi hours purchase',    balanceAfter: 40 },
  { id: 'FT006', studentId: 'STD006', type: 'free',     hours:  20, date: '2025-01-10', description: 'Welcome bonus',           balanceAfter: 60 },
  { id: 'FT007', studentId: 'STD006', type: 'consumed', hours: -35, date: '2025-02-20', description: 'Daycare extended hours',  balanceAfter: 25 },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

export const getStudentById       = (id) => students.find(s => s.id === id);
export const getTeacherById       = (id) => teachers.find(t => t.id === id);
export const getClassById         = (id) => classes.find(c => c.id === id);
export const getParentById        = (id) => parents.find(p => p.id === id);
export const getStudentsByClass   = (classId) => students.filter(s => s.classIds?.includes(classId));
export const getTeacherClasses    = (teacherId) => classes.filter(c => c.teacherId === teacherId);

export const getRemainingFlexiHours = (student) => {
  const total = (student.paidFlexiHours || 0) + (student.freeFlexiHours || 0);
  return Math.max(0, total - (student.consumedFlexiHours || 0));
};

export const isFlexiHoursCritical = (student) => getRemainingFlexiHours(student) < 6;

export const getTotalFreeFlexiHours = (studentId) => getStudentById(studentId)?.freeFlexiHours || 0;

export const getClassSchedule = (classId) => {
  const cls = getClassById(classId);
  if (!cls) return null;
  return CLASS_SCHEDULES[cls.scheduleType] || null;
};

// Get class time display string for a student (respects enrollmentType + daycareTimings)
export const getStudentClassTimeInfo = (student, cls) => {
  const sched = CLASS_SCHEDULES[cls.scheduleType];
  if (!sched) return null;
  const eType = student.enrollmentTypes?.[cls.id] || 'REGULAR';
  if (eType === 'DAYCARE') {
    const dt = student.daycareTimings?.[cls.id];
    if (dt?.start && dt?.end) return `${formatTime(dt.start)} – ${formatTime(dt.end)}`;
    return 'Custom timing (set by admin)';
  }
  if (eType === 'FLEXICARD') return 'Flexicard hours';
  if (sched.hasFixedTime) return `${formatTime(sched.startTime)} – ${formatTime(sched.endTime)}`;
  if (sched.isDaycare)    return 'Custom per student';
  return sched.frequency || '—';
};

export const getNextStudentId = () => {
  const nums = students.map(s => parseInt(s.id.replace('STD', '')));
  return `STD${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`;
};

export const getNextEnrollmentId = (year = new Date().getFullYear()) => {
  const nums = students
    .filter(s => s.admissionYear === year)
    .map(s => parseInt(s.enrollmentId?.slice(-3)) || 0);
  return `ENR${year}${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`;
};

export const getNextTeacherId = () => {
  const nums = teachers.map(t => parseInt(t.id.replace('TCH', '')));
  return `TCH${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`;
};

export const getNextEmployeeId = () => {
  const nums = teachers.map(t => parseInt(t.employeeId.replace('EMP', '')));
  return `EMP${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`;
};

export const getPresentStudentsToday = (date = today) => {
  return dailyAttendance
    .filter(a => a.date === date && a.status === 'Present')
    .map(a => {
      const student = getStudentById(a.studentId);
      const cls = getClassById(a.classId);
      return { ...student, attendanceId: a.id, checkInTime: a.checkInTime, checkOutTime: a.checkOutTime, className: cls?.name || '—', scheduleType: cls?.scheduleType || null };
    });
};

export const getStudentsByRemainingFlexiHours = () =>
  students
    .filter(s => s.status === 'Active')
    .map(s => ({ ...s, remainingFlexiHours: getRemainingFlexiHours(s), totalFlexiHours: (s.paidFlexiHours || 0) + (s.freeFlexiHours || 0), isCritical: isFlexiHoursCritical(s) }))
    .sort((a, b) => b.remainingFlexiHours - a.remainingFlexiHours);

export const searchStudents = (query) => {
  if (!query) return students;
  const q = query.toLowerCase();
  return students.filter(s => {
    const p = getParentById(s.parentId);
    return s.name.toLowerCase().includes(q) || s.enrollmentId?.toLowerCase().includes(q) || s.phone?.includes(query) || p?.fatherName?.toLowerCase().includes(q) || p?.motherName?.toLowerCase().includes(q) || p?.fatherMobile?.includes(query) || p?.motherMobile?.includes(query);
  });
};