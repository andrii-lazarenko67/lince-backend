const express = require('express');
const router = express.Router();
const systemTypeController = require('../controllers/systemTypeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all system types - accessible by all authenticated users
router.get('/', systemTypeController.getAllSystemTypes);

// Get system type by ID - accessible by all authenticated users
router.get('/:id', systemTypeController.getSystemTypeById);

// Create system type - manager only
router.post('/', roleMiddleware('manager'), systemTypeController.createSystemType);

// Update system type - manager only
router.put('/:id', roleMiddleware('manager'), systemTypeController.updateSystemType);

// Delete system type - manager only
router.delete('/:id', roleMiddleware('manager'), systemTypeController.deleteSystemType);

module.exports = router;
