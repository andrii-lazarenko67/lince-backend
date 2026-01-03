const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// Get current user's organization
router.get('/current', organizationController.getCurrent);

// Admin only routes
router.get('/', roleMiddleware('admin'), organizationController.getAll);
router.get('/:id', roleMiddleware('admin'), organizationController.getById);
router.post('/', roleMiddleware('admin'), organizationController.create);
router.put('/:id', roleMiddleware('admin'), organizationController.update);
router.delete('/:id', roleMiddleware('admin'), organizationController.delete);

module.exports = router;
