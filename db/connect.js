const mongoose = require("mongoose");

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // تحديد مهلة اختيار السيرفر
  connectTimeoutMS: 10000, // زيادة وقت المهلة للاتصال
  socketTimeoutMS: 45000, // زيادة وقت المهلة للـ Socket
};

const connectDB = (url, options) => {
  return mongoose.connect(url);
};

module.exports = connectDB;
