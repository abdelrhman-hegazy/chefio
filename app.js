require("dotenv").config();
const express = require("express");
const helmet = require("helmet"); // adding headers
const cors = require("cors"); // Cros-Orign Resource sharing
const cookieParser = require("cookie-parser");
const compression = require("compression");
// const mongoose = require("mongoose")

// routers
const authRouter = require("./routers/authRouter");

const connectDB = require("./db/connect");
const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRouter);
app.get("/", (req, res) => {
  res.json({ message: "hello" });
});
const port = process.env.port || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`server is running on port: ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};
start();
