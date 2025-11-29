const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', systemController.getAll);
router.get('/:id', systemController.getById);
router.post('/', roleMiddleware('manager', 'admin'), systemController.create);
router.put('/:id', roleMiddleware('manager', 'admin'), systemController.update);
router.delete('/:id', roleMiddleware('manager', 'admin'), systemController.delete);

module.exports = router;
