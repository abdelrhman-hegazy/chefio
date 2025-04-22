const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chefio",
    allowed_formats: ["jpeg", "png", "jpg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const upload = multer({ storage: storage });

// uploadMulter middleware
// This middleware is used to upload files to Cloudinary
const uploadMulter = (typImg) => {
  const uploadMiddleware = (req, res, next) => {
    upload.single(typImg)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
              success: false,
              message: `Invalid field name. Use ${typImg} as the key.`,
              errorCode: "Unexpected_field",
            });
          }
        }

        
        return res.status(400).json({
          success: false,
          message: "File upload failed.",
          error: err.message,
        });
      }

      next();
    });
  };
  return uploadMiddleware;
};
module.exports = uploadMulter;
