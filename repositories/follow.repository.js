const BaseRepository = require("./base.repository");
const Follow = require("../models/FollowModel");

class FollowRepository extends BaseRepository {
  constructor() {
    super(Follow);
  }

  async createFollow(followerId, followingId) {
    return this.model.create({
      follower: followerId,
      following: followingId,
    });
  }
  async findFollow(followerId, followingId) {
    return this.model.findOne({
      follower: followerId,
      following: followingId,
    });
  }
  async findFollowersRecipe(following) {
    return this.model.find(following).select("follower");
  }

  async findByFollowId(followingId) {
    return this.model.find({ following: followingId });
  }

  async findFollowingByFollower(follower) {
    return this.model
      .find(follower)
      .select("following")
      .populate("following", "username profilePicture")
      .exec();
  }
  async findFollowersByFollowing(following) {
    return this.model
      .find(following)
      .select("follower")
      .populate("follower", "username profilePicture")
      .exec();
  }
}

module.exports = new FollowRepository();
