const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const clientContextMiddleware = require('../middlewares/clientContextMiddleware');
const subscriptionMiddleware = require('../middlewares/subscriptionMiddleware');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const systemRoutes = require('./systemRoutes');
const systemTypeRoutes = require('./systemTypeRoutes');
const monitoringPointRoutes = require('./monitoringPointRoutes');
const checklistItemRoutes = require('./checklistItemRoutes');
const dailyLogRoutes = require('./dailyLogRoutes');
const inspectionRoutes = require('./inspectionRoutes');
const incidentRoutes = require('./incidentRoutes');
const reportRoutes = require('./reportRoutes');
const productRoutes = require('./productRoutes');
const libraryRoutes = require('./libraryRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const parameterRoutes = require('./parameterRoutes');
const unitRoutes = require('./unitRoutes');
const productDosageRoutes = require('./productDosageRoutes');
const systemPhotoRoutes = require('./systemPhotoRoutes');
const clientRoutes = require('./clientRoutes');
const reportTemplateRoutes = require('./reportTemplateRoutes');
const generatedReportRoutes = require('./generatedReportRoutes');
const aiRoutes = require('./aiRoutes');
const iotRoutes = require('./iotRoutes');
const iotController = require('../controllers/iotController');

// Auth routes (no client context needed)
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);

// AI assistant routes (auth + client context required for data-fetching endpoints)
router.use('/ai', authMiddleware, subscriptionMiddleware, clientContextMiddleware, aiRoutes);

// Apply auth + subscription check + client context middleware for data routes
router.use('/systems', authMiddleware, subscriptionMiddleware, clientContextMiddleware, systemRoutes);
router.use('/system-types', systemTypeRoutes);
router.use('/monitoring-points', monitoringPointRoutes);
router.use('/checklist-items', authMiddleware, subscriptionMiddleware, clientContextMiddleware, checklistItemRoutes);
router.use('/daily-logs', authMiddleware, subscriptionMiddleware, clientContextMiddleware, dailyLogRoutes);
router.use('/inspections', authMiddleware, subscriptionMiddleware, clientContextMiddleware, inspectionRoutes);
router.use('/incidents', authMiddleware, subscriptionMiddleware, clientContextMiddleware, incidentRoutes);
router.use('/reports', authMiddleware, subscriptionMiddleware, clientContextMiddleware, reportRoutes);
router.use('/products', authMiddleware, subscriptionMiddleware, clientContextMiddleware, productRoutes);
router.use('/library', authMiddleware, subscriptionMiddleware, clientContextMiddleware, libraryRoutes);
router.use('/notifications', authMiddleware, subscriptionMiddleware, clientContextMiddleware, notificationRoutes);
router.use('/dashboard', authMiddleware, subscriptionMiddleware, clientContextMiddleware, dashboardRoutes);
router.use('/parameters', parameterRoutes);
router.use('/units', unitRoutes);
router.use('/product-dosages', productDosageRoutes);
router.use('/system-photos', systemPhotoRoutes);
router.use('/report-templates', authMiddleware, subscriptionMiddleware, clientContextMiddleware, reportTemplateRoutes);
router.use('/generated-reports', authMiddleware, subscriptionMiddleware, clientContextMiddleware, generatedReportRoutes);

// IoT: ingest is public (device token auth), management routes need auth + client context
router.post('/iot/ingest', iotController.ingest);
router.use('/iot', authMiddleware, subscriptionMiddleware, clientContextMiddleware, iotRoutes);

module.exports = router;
