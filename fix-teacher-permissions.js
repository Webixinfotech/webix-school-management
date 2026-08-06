const mongoose = require('mongoose');
const Teacher = require('../models/teacher.model');

async function fixTeacherPermissions() {
  try {
    console.log('Starting teacher permissions fix...');

    // Update all teachers to have default permissions if not set
    const result = await Teacher.updateMany(
      {
        $or: [
          { 'permissions.canMarkAttendance': { $exists: false } },
          { 'permissions.canMarkAttendance': null }
        ]
      },
      {
        $set: {
          'permissions.canViewStudentMobile': true,
          'permissions.canMarkAttendance': true,
          'permissions.canUploadPhotos': true,
          'permissions.canViewSalary': true
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} teachers with missing permissions`);

    // Also update any teachers who have canMarkAttendance set to false
    const falseResult = await Teacher.updateMany(
      { 'permissions.canMarkAttendance': false },
      { $set: { 'permissions.canMarkAttendance': true } }
    );

    console.log(`Updated ${falseResult.modifiedCount} teachers with canMarkAttendance set to false`);

    console.log('Teacher permissions fix completed successfully');
  } catch (error) {
    console.error('Error fixing teacher permissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL)
    .then(() => {
      console.log('Connected to MongoDB');
      return fixTeacherPermissions();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = fixTeacherPermissions;