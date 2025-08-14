
const RefreshToken = require("../models/RefreshTokens")

class RefreshTokenRepository {
    async deleteByUserId(userId){
        return RefreshToken.deleteMany({userId})
    }
    async RefreshTokenFindOne(token){
        return RefreshToken.findOne({ token });
    }
}

module.exports = new RefreshTokenRepository()