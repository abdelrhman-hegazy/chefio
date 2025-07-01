const User = require("../models/UserModel");
const checkUserByEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return null
  }
  return user;
};
const checkUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    return null;
  }
  return user;
};

module.exports = {
  checkUserByEmail,
  checkUserById,
};
