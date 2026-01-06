const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Auth middleware applied at router level in index.js

router.get('/stats', dashboardController.getStats);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/alerts', dashboardController.getAlerts);

module.exports = router;
