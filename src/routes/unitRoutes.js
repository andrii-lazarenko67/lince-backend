const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all units - accessible by all authenticated users
router.get('/', unitController.getAllUnits);

// Get units by category - accessible by all authenticated users
router.get('/category/:category', unitController.getUnitsByCategory);

// Get unit by ID - accessible by all authenticated users
router.get('/:id', unitController.getUnitById);

// Create unit - manager only
router.post('/', roleMiddleware('manager'), unitController.createUnit);

// Update unit - manager only
router.put('/:id', roleMiddleware('manager'), unitController.updateUnit);

// Delete unit - manager only
router.delete('/:id', roleMiddleware('manager'), unitController.deleteUnit);

module.exports = router;
