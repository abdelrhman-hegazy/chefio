const express = require('express');
const {uploadProfilePicture} = require('../controllers/userController');
const identifier = require('../middlewares/identification');
// const upload = require('../middlewares/upload');
const uploadMulter = require('../middlewares/upload');
const router = express.Router();

router.patch('/upload-profile-picture', identifier, uploadMulter('profilePicture'), uploadProfilePicture);

module.exports = router;