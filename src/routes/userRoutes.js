const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const multer = require('multer');

// Configure multer for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

router.use(authMiddleware);

// Only admins can manage users (managers cannot access Users page per requirements)
router.get('/', roleMiddleware('admin'), userController.getAll);
router.get('/:id', roleMiddleware('admin'), userController.getById);
router.post('/', roleMiddleware('admin'), userController.create);
router.put('/:id', roleMiddleware('admin'), userController.update);
router.delete('/:id', roleMiddleware('admin'), userController.delete);
router.put('/:id/avatar', roleMiddleware('admin'), upload.single('avatar'), userController.uploadAvatar);
router.put('/profile/update', userController.updateProfile);

module.exports = router;
