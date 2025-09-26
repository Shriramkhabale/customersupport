//middleware/multerCloudinary.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folder = 'general_Support_files';

    if (file.mimetype.startsWith('image/')) {
      folder = 'Support_images';
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'Support_audios';
    } else {
      folder = 'Support_files';
    }

    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'mp3', 'wav', 'pdf', 'docx'],
      resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, 
});

module.exports = upload;