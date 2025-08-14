const AppError = require("../utils/appError");
const UserRepository = require("../repositories/user.repository");

const ensureUserExists = async (userId) => {
  const userExists = await UserRepository.findById(userId);
  if (!userExists) {
    throw new AppError("User not found", 404, "not_found");
  }
  return userExists;
};

module.exports = ensureUserExists;
