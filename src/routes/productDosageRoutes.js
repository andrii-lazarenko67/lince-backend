const express = require('express');
const router = express.Router();
const productDosageController = require('../controllers/productDosageController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all product dosages with optional filters
router.get('/', productDosageController.getAllProductDosages);

// Get dosages by product ID
router.get('/product/:productId', productDosageController.getDosagesByProduct);

// Get product dosage by ID
router.get('/:id', productDosageController.getProductDosageById);

// Create product dosage
router.post('/', productDosageController.createProductDosage);

// Update product dosage
router.put('/:id', productDosageController.updateProductDosage);

// Delete product dosage
router.delete('/:id', productDosageController.deleteProductDosage);

module.exports = router;
