const express = require('express');
const router = express.Router();
const reportTemplateController = require('../controllers/reportTemplateController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.use(authMiddleware);

// Get default template config (for creating new templates)
router.get('/default-config', reportTemplateController.getDefaultConfig);

// Get user's default template
router.get('/default', reportTemplateController.getDefault);

// CRUD operations
router.get('/', reportTemplateController.getAll);
router.get('/:id', reportTemplateController.getById);
router.post('/', reportTemplateController.create);
router.put('/:id', reportTemplateController.update);
router.delete('/:id', reportTemplateController.delete);

// Template actions
router.post('/:id/set-default', reportTemplateController.setDefault);
router.post('/:id/duplicate', reportTemplateController.duplicate);

// Logo management
router.post('/:id/logo', upload.single('logo'), reportTemplateController.uploadLogo);
router.delete('/:id/logo', reportTemplateController.deleteLogo);

module.exports = router;
