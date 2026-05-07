const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seniors';

async function clearDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all users and messages
    await User.deleteMany({});
    await Message.deleteMany({});
    
    console.log('Successfully cleared all Users and Messages from the database!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearDB();
