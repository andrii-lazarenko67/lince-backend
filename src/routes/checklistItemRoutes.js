const express = require('express');
const router = express.Router();
const checklistItemController = require('../controllers/checklistItemController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', checklistItemController.getAll);
router.get('/system/:systemId', checklistItemController.getBySystem);
router.get('/:id', checklistItemController.getById);
router.post('/', roleMiddleware('manager', 'admin'), checklistItemController.create);
router.put('/:id', roleMiddleware('manager', 'admin'), checklistItemController.update);
router.delete('/:id', roleMiddleware('manager', 'admin'), checklistItemController.delete);

module.exports = router;
