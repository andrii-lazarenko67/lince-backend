const express = require('express');
const router = express.Router();
const generatedReportController = require('../controllers/generatedReportController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.use(authMiddleware);

// Get all generated reports (history)
router.get('/', generatedReportController.getAll);

// Get a single generated report
router.get('/:id', generatedReportController.getById);

// Generate a new report
router.post('/generate', generatedReportController.generate);

// Update a generated report
router.put('/:id', generatedReportController.update);

// Upload PDF for a generated report
router.post('/:id/upload-pdf', upload.single('pdf'), generatedReportController.uploadPdf);

// Download/get PDF URL
router.get('/:id/download', generatedReportController.download);

// Delete a generated report
router.delete('/:id', generatedReportController.delete);

module.exports = router;
