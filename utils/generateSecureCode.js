const crypto = require("crypto");
const {hmacProcess} = require("./hashing");

const generateSecureCode = (secret,code) => {
  const hashed = hmacProcess(code, secret);
  return hashed;
};

module.exports = generateSecureCode;
