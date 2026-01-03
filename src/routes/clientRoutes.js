const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload');

router.use(authMiddleware);

// Basic CRUD routes
router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.get('/:id/stats', clientController.getStats);
router.post('/', roleMiddleware('manager', 'admin'), clientController.create);
router.put('/:id', roleMiddleware('manager', 'admin'), clientController.update);
router.delete('/:id', roleMiddleware('admin'), clientController.delete);

// User management routes
router.get('/:id/users', clientController.getUsers);
router.get('/:id/users/available', clientController.getAvailableUsers);
router.post('/:id/users', clientController.addUser);
router.put('/:id/users/:userId', clientController.updateUserAccess);
router.delete('/:id/users/:userId', clientController.removeUser);

// Logo management routes
router.post('/:id/logo', upload.single('logo'), clientController.uploadLogo);
router.delete('/:id/logo', clientController.deleteLogo);

module.exports = router;
