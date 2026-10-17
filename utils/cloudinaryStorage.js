const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require("./cloudinaryConfig");
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "CampusBites",
    },
});

module.exports = storage;
