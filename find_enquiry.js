const mongoose = require('mongoose');
const Enquiry = require('./src/modules/enquiry/enquiry.model');

async function findEnquiry() {
  try {
    await mongoose.connect('mongodb://localhost:27017/brainbuilder', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const enquiryId = '69f2d18ee631df3d6b336ca7';
    
    console.log(`Looking for enquiry: ${enquiryId}`);

    // Try to find by string ID first
    let enquiry = await Enquiry.findById(enquiryId);
    if (enquiry) {
      console.log(`Found enquiry by string ID: ${enquiry._id}`);
      console.log(`Admin notes: "${enquiry.adminNotes}"`);
      console.log(`Student ID: ${enquiry.studentId}`);
    } else {
      console.log('Not found by string ID, trying ObjectId...');
      // Try with ObjectId
      enquiry = await Enquiry.findById(new mongoose.Types.ObjectId(enquiryId));
      if (enquiry) {
        console.log(`Found enquiry by ObjectId: ${enquiry._id}`);
        console.log(`Admin notes: "${enquiry.adminNotes}"`);
        console.log(`Student ID: ${enquiry.studentId}`);
      } else {
        console.log('Enquiry not found with either method');
        
        // Let's see what enquiries we DO have
        const count = await Enquiry.countDocuments();
        console.log(`Total enquiries in DB: ${count}`);
        
        // Show first few enquiries
        const enquiries = await Enquiry.find({}).limit(3);
        console.log('First 3 enquiries:');
        enquiries.forEach((e, index) => {
          console.log(`  ${index+1}. ID: ${e._id}, adminNotes: "${e.adminNotes}", studentId: ${e.studentId}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findEnquiry();