const mongoose = require('mongoose');
const Photo = require('./src/modules/photo/photo.model.js');
require('dotenv').config({ path: './.env' });

async function checkPhotos() {
  await mongoose.connect(process.env.MONGO_URI);
  const photos = await Photo.find().sort({ createdAt: -1 }).limit(3);
  console.log("Latest photos:", JSON.stringify(photos.map(p => ({ id: p._id, imageUrl: p.imageUrl })), null, 2));
  process.exit(0);
}

checkPhotos();
