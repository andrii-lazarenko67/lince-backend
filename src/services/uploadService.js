const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { uploadToGCS, deleteFromGCS } = require('../utils/gcsUpload');

/**
 * Upload Service
 * - Images (inspections, incidents) -> Cloudinary
 * - Documents (library) -> Google Cloud Storage
 */
const uploadService = {
  /**
   * Upload image to Cloudinary (for inspections and incidents)
   * @param {Buffer} buffer - File buffer
   * @param {string} folder - Folder name (e.g., 'inspections', 'incidents')
   * @returns {Promise<{secure_url: string, public_id: string}>}
   */
  async uploadImage(buffer, folder = 'general') {
    try {
      const result = await uploadToCloudinary(buffer, folder, 'image');
      return {
        secure_url: result.url,
        public_id: result.publicId
      };
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw new Error('Failed to upload image');
    }
  },

  /**
   * Upload document to Google Cloud Storage (for library)
   * @param {Buffer} buffer - File buffer
   * @param {string} folder - Folder name (e.g., 'documents', 'manuals')
   * @param {string} originalFilename - Original filename
   * @returns {Promise<{secure_url: string, public_id: string}>}
   */
  async uploadDocument(buffer, folder = 'documents', originalFilename) {
    try {
      const result = await uploadToGCS(buffer, folder, originalFilename);
      return {
        secure_url: result.url,
        public_id: result.filename // Using filename as public_id for GCS
      };
    } catch (error) {
      console.error('Error uploading document to GCS:', error);
      throw new Error('Failed to upload document');
    }
  },

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<any>}
   */
  async deleteImage(publicId) {
    try {
      const result = await deleteFromCloudinary(publicId, 'image');
      return result;
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  },

  /**
   * Delete document from Google Cloud Storage
   * @param {string} filename - GCS filename (path in bucket)
   * @returns {Promise<void>}
   */
  async deleteDocument(filename) {
    try {
      await deleteFromGCS(filename);
    } catch (error) {
      console.error('Error deleting document from GCS:', error);
      throw error;
    }
  },

  /**
   * Legacy method for backward compatibility
   * Uploads file to Cloudinary (deprecated - use uploadImage or uploadDocument)
   */
  async uploadFile(buffer, folder = 'general', resourceType = 'auto') {
    try {
      const result = await uploadToCloudinary(buffer, folder, resourceType);
      return {
        secure_url: result.url,
        public_id: result.publicId
      };
    } catch (error) {
      console.error('Error uploading file to Cloudinary:', error);
      throw new Error('Failed to upload file');
    }
  }
};

module.exports = uploadService;
