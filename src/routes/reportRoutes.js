const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Generate report
router.post('/generate', reportController.generate);

// Export reports
router.post('/export/pdf', reportController.exportPDF);
router.post('/export/csv', reportController.exportCSV);

// Legacy endpoints
router.get('/daily', reportController.getDailyReport);
router.get('/weekly', reportController.getWeeklyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/system/:systemId', reportController.getSystemReport);

module.exports = router;
