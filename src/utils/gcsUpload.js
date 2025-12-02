const { bucket } = require('../config/googleCloudStorage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Upload a file buffer to Google Cloud Storage
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - GCS folder name (e.g., 'documents', 'manuals')
 * @param {string} originalFilename - Original filename
 * @returns {Promise<{url: string, filename: string}>}
 */
const uploadToGCS = async (fileBuffer, folder, originalFilename) => {
  try {
    // Generate unique filename
    const ext = path.extname(originalFilename);
    const filename = `${folder}/${uuidv4()}${ext}`;

    // Create file in bucket
    const file = bucket.file(filename);

    // Upload buffer to GCS
    await file.save(fileBuffer, {
      metadata: {
        contentType: getContentType(ext),
        metadata: {
          originalName: originalFilename
        }
      },
      public: true // Make file publicly accessible
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    return {
      url: publicUrl,
      filename: filename
    };
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw new Error('Failed to upload file to Google Cloud Storage');
  }
};

/**
 * Delete a file from Google Cloud Storage
 * @param {string} filename - GCS filename (path in bucket)
 * @returns {Promise<void>}
 */
const deleteFromGCS = async (filename) => {
  try {
    await bucket.file(filename).delete();
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    throw new Error('Failed to delete file from Google Cloud Storage');
  }
};

/**
 * Get content type based on file extension
 * @param {string} ext - File extension
 * @returns {string}
 */
const getContentType = (ext) => {
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.csv': 'text/csv'
  };

  return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
};

module.exports = {
  uploadToGCS,
  deleteFromGCS
};
