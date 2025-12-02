const multer = require('multer');
const path = require('path');

// Configure multer to use memory storage (files will be uploaded to Cloudinary directly)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed image types for photos
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  // Allowed document types for library
  const documentTypes = /pdf|doc|docx|xls|xlsx|txt|csv/;

  const extname = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimetype = file.mimetype;

  // Check if it's an image
  const isImage = imageTypes.test(extname) && mimetype.startsWith('image/');

  // Check if it's a document
  const isDocument = documentTypes.test(extname) || mimetype.startsWith('application/');

  if (isImage || isDocument) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and documents (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV) are allowed.'));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
