const mongoose = require('mongoose');
const Enquiry = require('./src/modules/enquiry/enquiry.model');
const Student = require('./src/modules/student/student.model');

async function testAdminNotes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/brainbuilder', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Test with the specific student ID we saw in the API
    const studentId = '69f416094fc6023693dad731';
    console.log(`Testing with student: ${studentId}`);

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      console.log('Student not found');
      return;
    }

    console.log(`Found student: ${student._id}`);

    // Find enquiry linked to this student
    const enquiry = await Enquiry.findOne({ studentId: student._id });
    if (enquiry) {
      console.log(`Found enquiry: ${enquiry._id}`);
      console.log(`Admin notes: "${enquiry.adminNotes}"`);
      console.log(`Student ID in enquiry: ${enquiry.studentId}`);
    } else {
      console.log('No enquiry found linked to this student');
      
      // Let's check if there are any enquiries with adminNotes
      const enquiryWithNotes = await Enquiry.findOne({ adminNotes: { $ne: '' } });
      if (enquiryWithNotes) {
        console.log(`Found enquiry with adminNotes: ${enquiryWithNotes._id}`);
        console.log(`Admin notes: "${enquiryWithNotes.adminNotes}"`);
        console.log(`Student ID in that enquiry: ${enquiryWithNotes.studentId}`);
        
        // If that enquiry has no studentId, let's link it to our test student
        if (!enquiryWithNotes.studentId) {
          console.log(`Linking enquiry ${enquiryWithNotes._id} to student ${student._id}`);
          enquiryWithNotes.studentId = student._id;
          await enquiryWithNotes.save();
          console.log('Enquiry updated successfully');
        }
      }
    }

    // Now test our service method directly
    const studentService = require('./src/modules/student/student.service');
    const studentWithNotes = await studentService.getStudentById(student._id.toString(), 'admin', '69da6b3ec9b4f83b7a91cd2b');
    
    console.log('\n=== Student from service ===');
    console.log(`Admin notes in student object: "${studentWithNotes.adminNotes}"`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAdminNotes();