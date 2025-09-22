// db.js
const mongoose = require("mongoose");

let isConnected = null; // cache state

const connectDB = async (url) => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(url, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 5,
    });

    isConnected = db.connections[0].readyState === 1;
  } catch (err) {
    throw err;
  }
};

module.exports = connectDB;
