const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect('mongodb://localhost:27017/brainbuilder', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check if enquiries collection exists
    const enquiriesCollection = mongoose.connection.db.collection('enquiries');
    const count = await enquiriesCollection.countDocuments();
    console.log(`Enquiries count: ${count}`);
    
    if (count > 0) {
      // Find one enquiry
      const enquiry = await enquiriesCollection.findOne();
      console.log('Sample enquiry:', enquiry);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection();