require("dotenv").config();
const express = require("express");
const path = require("path"); // for serving static files
const helmet = require("helmet"); // adding headers
const cors = require("cors"); // Cros-Orign Resource sharing
const cookieParser = require("cookie-parser");
const compression = require("compression");
// const mongoose = require("mongoose")

// routers
const authRouter = require("./routers/authRouter");
const userRouter = require("./routers/profileRouter");
const recipeRouter = require("./routers/recipeRouter");
const likeRouter = require("./routers/likeRouter");
const followRouter = require("./routers/followRouter");
const notificationRouter = require("./routers/notificationRouter");
const deviceTokenRouter = require("./routers/deviceTokenRouter");

const connectDB = require("./db/connect");
const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // for serving static files

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/recipe", recipeRouter);
app.use("/api/v1/recipe/likes", likeRouter);
app.use("/api/v1/chef/follow", followRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/device-token", deviceTokenRouter);

app.get("/api/v1/profile", (req, res) => {
  res.send("welcome in chefio profile");
});

app.get("/", (req, res) => {
  res.json({ message: "welcome in chefio" });
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

module.exports = app;
