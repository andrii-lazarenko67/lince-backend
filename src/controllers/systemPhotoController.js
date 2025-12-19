const { SystemPhoto, System, User } = require('../../db/models');
const uploadService = require('../services/uploadService');

/**
 * Get all photos for a specific system
 */
exports.getPhotosBySystem = async (req, res) => {
  try {
    const { systemId } = req.params;

    const photos = await SystemPhoto.findAll({
      where: { systemId },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(photos);
  } catch (error) {
    console.error('Error fetching system photos:', error);
    res.status(500).json({ messageKey: 'systemPhotos.errors.fetchError' });
  }
};

/**
 * Get single photo by ID
 */
exports.getPhotoById = async (req, res) => {
  try {
    const { id } = req.params;

    const photo = await SystemPhoto.findByPk(id, {
      include: [
        {
          model: System,
          as: 'system',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!photo) {
      return res.status(404).json({ messageKey: 'systemPhotos.errors.notFound' });
    }

    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ messageKey: 'systemPhotos.errors.fetchError' });
  }
};

/**
 * Upload photo to system
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const { systemId } = req.params;
    const { description } = req.body;
    const userId = req.user.id;

    // Validate system exists
    const system = await System.findByPk(systemId);
    if (!system) {
      return res.status(404).json({ messageKey: 'systems.errors.notFound' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ messageKey: 'systemPhotos.errors.noFileUploaded' });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadService.uploadImage(req.file.buffer, 'system-photos');

    // Extract filename from public_id or use original name
    const filename = uploadResult.public_id.split('/').pop();

    // Create photo record
    const photo = await SystemPhoto.create({
      systemId: parseInt(systemId),
      filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      url: uploadResult.secure_url,
      description: description || null,
      uploadedBy: userId
    });

    // Fetch with associations
    const photoWithAssociations = await SystemPhoto.findByPk(photo.id, {
      include: [
        {
          model: System,
          as: 'system',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(photoWithAssociations);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ messageKey: 'systemPhotos.errors.uploadError' });
  }
};

/**
 * Update photo description
 */
exports.updatePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const photo = await SystemPhoto.findByPk(id);
    if (!photo) {
      return res.status(404).json({ messageKey: 'systemPhotos.errors.notFound' });
    }

    photo.description = description !== undefined ? description : photo.description;
    await photo.save();

    // Fetch with associations
    const updatedPhoto = await SystemPhoto.findByPk(id, {
      include: [
        {
          model: System,
          as: 'system',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedPhoto);
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ messageKey: 'systemPhotos.errors.updateError' });
  }
};

/**
 * Delete photo
 */
exports.deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;

    const photo = await SystemPhoto.findByPk(id);
    if (!photo) {
      return res.status(404).json({ messageKey: 'systemPhotos.errors.notFound' });
    }

    // Extract public_id from filename to delete from Cloudinary
    // The filename stored is the last part of public_id
    const publicId = `system-photos/${photo.filename}`;

    try {
      // Delete from Cloudinary
      await uploadService.deleteImage(publicId);
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await photo.destroy();

    res.json({ messageKey: 'systemPhotos.success.deleted' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ messageKey: 'systemPhotos.errors.deleteError' });
  }
};
