const mongoose = require("mongoose");

const connectDB = (url) => {
  return mongoose.connect(url, {
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout instead of 10
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 30000, // 30 seconds to connect
    family: 4, // Use IPv4, skip trying IPv6
    maxPoolSize: 10, // Maximum number of connections in pool
    minPoolSize: 5,
  });
};

module.exports = connectDB;
