const express = require('express');
const router = express.Router();
const monitoringPointController = require('../controllers/monitoringPointController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', monitoringPointController.getAll);
router.get('/for-chart-config', monitoringPointController.getForChartConfig);
router.get('/system/:systemId', monitoringPointController.getBySystem);
router.get('/:id', monitoringPointController.getById);
router.post('/', roleMiddleware('manager', 'admin'), monitoringPointController.create);
router.put('/:id', roleMiddleware('manager', 'admin'), monitoringPointController.update);
router.delete('/:id', roleMiddleware('manager', 'admin'), monitoringPointController.delete);

module.exports = router;
