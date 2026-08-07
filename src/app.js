const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
// const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import config
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { initializeFirebase } = require('./config/firebase');

// Import middleware
const errorHandler = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const studentRoutes = require('./modules/student/student.routes');
const adminStudentRoutes = require('./modules/student/admin.student.routes');
const teacherRoutes = require('./modules/teacher/teacher.routes');
const enquiryRoutes = require('./modules/enquiry/enquiry.routes');
const referralRoutes = require('./modules/referral/referral.routes');
const referralTrackingRoutes = require('./modules/referralTracking/referralTracking.routes');
const photoRoutes = require('./modules/photo/photo.routes');
const classRoutes = require('./modules/class/class.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const parentRoutes = require('./modules/parent/parent.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const advertisementRoutes = require('./modules/advertisement/advertisement.routes');

const dailyActivityRoutes = require('./modules/dailyActivity/dailyActivity.routes');

const employeeAttendanceRoutes = require('./modules/employeeAttendance/employeeAttendance.routes');

const holidayRoutes = require('./modules/holidayCalendar/holiday.routes');

const feeRoutes = require('./modules/fee/fee.routes');

// Line ~50: Import birthday module
const birthdayRoutes = require('./modules/birthday/birthday.routes');

const idCardRoutes = require('./modules/idCard/idCard.routes');

// Documents module (Certificate of Achievement, Leaving Certificate, Experience Letter)
const documentRoutes = require('./modules/document/document.routes');

// School Calendar module
const schoolCalendarRoutes = require('./modules/schoolCalendar/schoolCalendar.routes');

// Academic Session module
const academicSessionRoutes = require('./modules/academicSession/academicSession.routes');

// Inventory & Library module
const inventoryRoutes = require('./modules/inventory/inventory.routes');

const birthdayCron = require('./modules/birthday/birthday.cron');
const inventoryCron = require('./modules/inventory/inventory.cron');
const academicSessionCron = require('./modules/academicSession/academicSession.cron');
const employeeAttendanceCron = require('./modules/employeeAttendance/employeeAttendance.cron');

// Import Cron Jobs
const attendanceCron = require('./attendance.cron');

// Initialize express app
const app = express();

// Connect to database
(async () => {
  await connectDB();

  // Initialize Firebase (Disabled to avoid external dependencies)
  // initializeFirebase();

  // Start cron jobs only after DB connection
  attendanceCron.startAutoClassAttendanceCron();
  attendanceCron.startAutoCheckoutCron();
  attendanceCron.startEveningSessionCleanupCron();
  attendanceCron.startMonthlyBillingCron();
  // Line ~74: Start cron after DB connects
  birthdayCron.startBirthdayNotificationCron();
  inventoryCron.startDueDateSweepCron();
  academicSessionCron.startAutoTransitionCron();
  employeeAttendanceCron.startAutoAbsentCron();

  console.log('✅ App initialization complete');
})();
// Create uploads directory structure

const uploadsDir = path.join(__dirname, '..', 'uploads');
const tempDir = path.join(uploadsDir, 'temp');
const logsDir = path.join(__dirname, '..', 'logs');

[uploadsDir, tempDir, logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// Rate limiting - Enable in production
// const limiter = rateLimit({
//   windowMs: 30 * 60 * 1000, // 30 minutes
//   max: 200, // limit each IP to 200 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// NoSQL injection sanitization - must run AFTER body/query parsing so
// req.body/req.query/req.params actually exist when it strips $ and . keys
app.use(mongoSanitize());

// Logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static file serving for uploads
// app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BrainBuilder API is running bhushan',
    version: '2.0.0',
    documentation: '/api/health'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin/students', adminStudentRoutes); // Admin-only enhanced student API
app.use('/api/teachers', teacherRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/referral-tracking', referralTrackingRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/daily-activity', dailyActivityRoutes);

app.use('/api/employee-attendance', employeeAttendanceRoutes);

app.use('/api/holidays', holidayRoutes);
app.use('/api/fee', feeRoutes);

// Line ~168: Mount routes
app.use('/api/birthdays', birthdayRoutes);

app.use('/api/id-cards', idCardRoutes);

app.use('/api/documents', documentRoutes);

// School Calendar module
app.use('/api/calendar', schoolCalendarRoutes);

// Academic Session module
app.use('/api/academic-sessions', academicSessionRoutes);

// Inventory & Library module
app.use('/api/inventory', inventoryRoutes);



// Error handler middleware (must be last)
app.use(errorHandler);

// Export app for use in server.js
module.exports = app;
