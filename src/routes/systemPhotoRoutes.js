const express = require('express');
const router = express.Router();
const systemPhotoController = require('../controllers/systemPhotoController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// All routes require authentication
router.use(authMiddleware);

// Get all photos for a specific system
router.get('/system/:systemId', systemPhotoController.getPhotosBySystem);

// Get photo by ID
router.get('/:id', systemPhotoController.getPhotoById);

// Upload photo to system (single file upload)
router.post('/system/:systemId', upload.single('photo'), systemPhotoController.uploadPhoto);

// Update photo description
router.put('/:id', systemPhotoController.updatePhoto);

// Delete photo
router.delete('/:id', systemPhotoController.deletePhoto);

module.exports = router;
