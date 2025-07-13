require("dotenv").config();
const express = require("express");
const path = require("path"); // for serving static files
const helmet = require("helmet"); // adding headers
const cors = require("cors"); // Cros-Orign Resource sharing
const cookieParser = require("cookie-parser");
const compression = require("compression");
const errorHandler = require("./middlewares/errorHandler"); // custom error handler

const connectDB = require("./db/connect");
const routers = require("./routers")

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // for serving static files

// all routes 
app.use("/api/v1",routers)

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

// Error handling middleware
app.use(errorHandler);
module.exports = app;
