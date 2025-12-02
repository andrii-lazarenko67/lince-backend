const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

/**
 * Upload Service
 * Uses Cloudinary for all file uploads (images and documents)
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
   * Upload document to Cloudinary (for library)
   * @param {Buffer} buffer - File buffer
   * @param {string} folder - Folder name (e.g., 'documents', 'manuals')
   * @param {string} originalFilename - Original filename (optional, for logging)
   * @returns {Promise<{secure_url: string, public_id: string}>}
   */
  async uploadDocument(buffer, folder = 'documents', originalFilename) {
    try {
      // Use 'raw' resource type for documents (PDF, DOC, etc.)
      const result = await uploadToCloudinary(buffer, folder, 'raw');
      return {
        secure_url: result.url,
        public_id: result.publicId
      };
    } catch (error) {
      console.error('Error uploading document to Cloudinary:', error);
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
   * Delete document from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<any>}
   */
  async deleteDocument(publicId) {
    try {
      const result = await deleteFromCloudinary(publicId, 'raw');
      return result;
    } catch (error) {
      console.error('Error deleting document from Cloudinary:', error);
      throw error;
    }
  },

  /**
   * Generic file upload (auto-detects type)
   * @param {Buffer} buffer - File buffer
   * @param {string} folder - Folder name
   * @param {string} resourceType - 'image', 'raw', or 'auto'
   * @returns {Promise<{secure_url: string, public_id: string}>}
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
