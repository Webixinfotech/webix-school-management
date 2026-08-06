const mongoose = require('mongoose');
const Enquiry = require('./src/modules/enquiry/enquiry.model');

async function linkEnquiryToStudent() {
  try {
    await mongoose.connect('mongodb://localhost:27017/brainbuilder', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const enquiryId = '69f2d18ee631df3d6b336ca7';
    const studentId = '69f416094fc6023693dad731';

    console.log(`Linking enquiry ${enquiryId} to student ${studentId}`);

    // Find the enquiry
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      console.log('Enquiry not found');
      return;
    }

    console.log(`Found enquiry: ${enquiry._id}`);
    console.log(`Current adminNotes: "${enquiry.adminNotes}"`);
    console.log(`Current studentId: ${enquiry.studentId}`);

    // Link it to the student
    enquiry.studentId = studentId;
    await enquiry.save();
    
    console.log('Enquiry updated successfully');
    console.log(`New studentId: ${enquiry.studentId}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

linkEnquiryToStudent();