'use strict';

const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iotController');

// Authenticated + client-context routes (middleware applied in index.js)
router.get('/devices', iotController.getDevices);
router.post('/devices', iotController.createDevice);
router.delete('/devices/:id', iotController.deleteDevice);
router.patch('/devices/:id/status', iotController.updateDeviceStatus);

router.get('/readings', iotController.getReadings);
router.post('/import-to-log', iotController.importToLog);

module.exports = router;
