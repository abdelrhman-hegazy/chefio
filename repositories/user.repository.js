const BaseRepository = require("./base.repository");
const User = require("../models/UserModel");

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }
  async findByEmailWithPassword(email) {
    return this.model.findOne(email).select("+password");
  }
  async findByIdWithPassword(userId) {
    return this.model.findById(userId).select("+password");
  }
  async findOneVerificationCode(email) {
    return this.model
      .findOne(email)
      .select("+verificationCode +verificationCodeValidation");
  }
  async findOneForgotPasswordCode(email) {
    return this.model
      .findOne({ email })
      .select("+forgotPasswordCode +forgotPasswordCodeValidation");
  }
  async findUsernameProfileById(userId) {
    return this.model.findById(userId).select("username profilePicture");
  }
  async findById(userId) {
    return this.model.findById(userId).select("-password -__v").lean();
  }
  async findFollowersById(userId) {
    return this.model.findById(userId).select("followers followersCount");
  }
  async findFollowingById(userId) {
    return this.model.findById(userId).select("following followingCount");
  }
  
}

module.exports = new UserRepository();
