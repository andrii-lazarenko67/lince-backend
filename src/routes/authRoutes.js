const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authMiddleware, authController.getMe);
router.put('/change-password', authMiddleware, authController.changePassword);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);

module.exports = router;
