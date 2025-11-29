const express = require('express');
const router = express.Router();
const dailyLogController = require('../controllers/dailyLogController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', dailyLogController.getAll);
router.get('/system/:systemId', dailyLogController.getBySystem);
router.get('/:id', dailyLogController.getById);
router.post('/', dailyLogController.create);
router.put('/:id', dailyLogController.update);
router.delete('/:id', dailyLogController.delete);

module.exports = router;
