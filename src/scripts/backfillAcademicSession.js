/**
 * One-off backfill for the Academic Session feature.
 *
 * - If no AcademicSession is Active yet, bootstraps one covering the
 *   current date and activates it.
 * - Tags every existing Student / StudentEnrollment / Invoice / Attendance
 *   document that has no sessionId with that session's id.
 *
 * Idempotent — { sessionId: null } only ever matches untouched documents
 * (missing field or explicit null), so a re-run after a partial or full
 * completion is a safe no-op. Never run automatically; not wired into app
 * startup or any cron.
 *
 * Usage:  npm run db:backfill:academicSession
 */

const mongoose = require('mongoose');
require('dotenv').config();

const AcademicSession = require('../modules/academicSession/academicSession.model');
const User = require('../modules/auth/user.model');
const Student = require('../modules/student/student.model');
const StudentEnrollment = require('../modules/fee/studentEnrollment.model');
const Invoice = require('../modules/fee/invoice.model');
const { Attendance } = require('../modules/attendance/attendance.model');

async function backfill() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected: ${mongoose.connection.host}`);

  let defaultSession = await AcademicSession.findOne({ status: 'Active' });

  if (!defaultSession) {
    const existingCount = await AcademicSession.countDocuments();
    if (existingCount > 0) {
      console.error(
        'AcademicSession documents already exist but none is Active. ' +
        'Activate one via PUT /api/academic-sessions/:id/activate, then re-run this script.'
      );
      process.exit(1);
    }

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      throw new Error('No admin user found — create an admin account first, then re-run this script.');
    }

    const year = new Date().getFullYear();
    defaultSession = await AcademicSession.create({
      name: `${year}-${String(year + 1).slice(-2)}`,
      startDate: new Date(`${year}-06-01`),
      endDate: new Date(`${year + 1}-05-31`),
      status: 'Active',
      createdBy: admin._id,
    });
    console.log(`Bootstrap AcademicSession created: ${defaultSession.name} (${defaultSession._id})`);
  } else {
    console.log(`Using existing Active session: ${defaultSession.name} (${defaultSession._id})`);
  }

  const results = {};
  const targets = [
    ['Student', Student],
    ['StudentEnrollment', StudentEnrollment],
    ['Invoice', Invoice],
    ['Attendance', Attendance],
  ];

  for (const [label, Model] of targets) {
    const r = await Model.updateMany(
      { sessionId: null },
      { $set: { sessionId: defaultSession._id } }
    );
    results[label] = r.modifiedCount;
    console.log(`${label}: backfilled ${r.modifiedCount} document(s)`);
  }

  console.log('Backfill complete:', results);
  await mongoose.connection.close();
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
