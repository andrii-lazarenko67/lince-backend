const express = require('express');
const router = express.Router();
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

// Apply client context middleware for data routes
router.use('/systems', clientContextMiddleware, systemRoutes);
router.use('/system-types', systemTypeRoutes);
router.use('/monitoring-points', monitoringPointRoutes);
router.use('/checklist-items', checklistItemRoutes);
router.use('/daily-logs', clientContextMiddleware, dailyLogRoutes);
router.use('/inspections', clientContextMiddleware, inspectionRoutes);
router.use('/incidents', clientContextMiddleware, incidentRoutes);
router.use('/reports', clientContextMiddleware, reportRoutes);
router.use('/products', clientContextMiddleware, productRoutes);
router.use('/library', clientContextMiddleware, libraryRoutes);
router.use('/notifications', clientContextMiddleware, notificationRoutes);
router.use('/dashboard', clientContextMiddleware, dashboardRoutes);
router.use('/parameters', parameterRoutes);
router.use('/units', unitRoutes);
router.use('/product-dosages', productDosageRoutes);
router.use('/system-photos', systemPhotoRoutes);
router.use('/report-templates', clientContextMiddleware, reportTemplateRoutes);
router.use('/generated-reports', clientContextMiddleware, generatedReportRoutes);

module.exports = router;
