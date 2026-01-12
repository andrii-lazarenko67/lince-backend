const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const clientContextMiddleware = require('../middlewares/clientContextMiddleware');

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

// Auth routes (no client context needed)
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);

// Apply auth + client context middleware for data routes
router.use('/systems', authMiddleware, clientContextMiddleware, systemRoutes);
router.use('/system-types', systemTypeRoutes);
router.use('/monitoring-points', monitoringPointRoutes);
router.use('/checklist-items', authMiddleware, clientContextMiddleware, checklistItemRoutes);
router.use('/daily-logs', authMiddleware, clientContextMiddleware, dailyLogRoutes);
router.use('/inspections', authMiddleware, clientContextMiddleware, inspectionRoutes);
router.use('/incidents', authMiddleware, clientContextMiddleware, incidentRoutes);
router.use('/reports', authMiddleware, clientContextMiddleware, reportRoutes);
router.use('/products', authMiddleware, clientContextMiddleware, productRoutes);
router.use('/library', authMiddleware, clientContextMiddleware, libraryRoutes);
router.use('/notifications', authMiddleware, clientContextMiddleware, notificationRoutes);
router.use('/dashboard', authMiddleware, clientContextMiddleware, dashboardRoutes);
router.use('/parameters', parameterRoutes);
router.use('/units', unitRoutes);
router.use('/product-dosages', productDosageRoutes);
router.use('/system-photos', systemPhotoRoutes);
router.use('/report-templates', authMiddleware, clientContextMiddleware, reportTemplateRoutes);
router.use('/generated-reports', authMiddleware, clientContextMiddleware, generatedReportRoutes);

module.exports = router;
