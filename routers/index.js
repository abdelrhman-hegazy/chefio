const express = require("express")
// routers
const authRouter = require("./authRouter");
const userRouter = require("./profileRouter");
const recipeRouter = require("./recipeRouter");
const likeRouter = require("./likeRouter");
const followRouter = require("./followRouter");
const notificationRouter = require("./notificationRouter");
const deviceTokenRouter = require("./deviceTokenRouter");


const router = express.Router()

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/recipe", recipeRouter);
router.use("/recipe/likes", likeRouter);
router.use("/chef/follow", followRouter);
router.use("/notification", notificationRouter);
router.use("/device-tokens", deviceTokenRouter);

router.get("/profile", (req, res) => {
  res.send("welcome in chefio profile");
});


module.exports = router