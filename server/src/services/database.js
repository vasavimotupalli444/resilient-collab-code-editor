const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅  MongoDB connected');
  } catch (err) {
    console.warn('⚠️   MongoDB not available — running without persistence:', err.message);
    // Non-fatal: Redis still handles in-session state
  }
}

module.exports = connectDB;
