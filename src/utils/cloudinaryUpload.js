const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder name (e.g., 'inspections', 'incidents', 'documents')
 * @param {string} resourceType - 'image', 'raw', or 'auto'
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (fileBuffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `lince/${folder}`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image', 'raw', or 'auto'
 * @returns {Promise<any>}
 */
const deleteFromCloudinary = (publicId, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array<Buffer>} files - Array of file buffers
 * @param {string} folder - Cloudinary folder name
 * @param {string} resourceType - 'image', 'raw', or 'auto'
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
const uploadMultipleToCloudinary = async (files, folder, resourceType = 'auto') => {
  const uploadPromises = files.map(file =>
    uploadToCloudinary(file.buffer, folder, resourceType)
  );
  return Promise.all(uploadPromises);
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary
};
