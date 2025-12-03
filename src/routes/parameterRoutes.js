const express = require('express');
const router = express.Router();
const parameterController = require('../controllers/parameterController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all parameters - accessible by all authenticated users
router.get('/', parameterController.getAllParameters);

// Get parameter by ID - accessible by all authenticated users
router.get('/:id', parameterController.getParameterById);

// Create parameter - manager only
router.post('/', roleMiddleware('manager'), parameterController.createParameter);

// Update parameter - manager only
router.put('/:id', roleMiddleware('manager'), parameterController.updateParameter);

// Delete parameter - manager only
router.delete('/:id', roleMiddleware('manager'), parameterController.deleteParameter);

module.exports = router;
