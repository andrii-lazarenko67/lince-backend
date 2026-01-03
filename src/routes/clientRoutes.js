const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.get('/:id/stats', clientController.getStats);
router.post('/', roleMiddleware('manager', 'admin'), clientController.create);
router.put('/:id', roleMiddleware('manager', 'admin'), clientController.update);
router.delete('/:id', roleMiddleware('admin'), clientController.delete);

module.exports = router;
