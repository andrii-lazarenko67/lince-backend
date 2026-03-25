'use strict';

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Stripe webhook — must use raw body, no auth middleware
// This route is registered BEFORE express.json() in app.js
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  billingController.webhook
);

// All routes below this point need JSON body parsing.
// express.json() is added here because the entire /api/billing prefix is mounted
// before the global express.json() in app.js (required so the webhook gets raw body).
// The webhook handler never calls next(), so it is not affected by this middleware.
router.use(express.json({ limit: '10mb' }));

// All other billing routes require authentication
router.use(authMiddleware);

// User billing routes
router.get('/status', billingController.getStatus);
router.post('/create-checkout', billingController.createCheckout);
router.post('/portal', billingController.createPortal);
router.get('/invoices', billingController.getInvoices);

// Admin-only routes
router.get('/admin', roleMiddleware('admin', 'manager'), billingController.adminList);
router.put('/admin/:clientId', roleMiddleware('admin'), billingController.adminUpdate);

module.exports = router;
