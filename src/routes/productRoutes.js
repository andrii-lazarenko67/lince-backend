const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/types', productController.getTypes);
router.post('/types', roleMiddleware('manager', 'admin'), productController.createType);
router.put('/types/:typeId', roleMiddleware('manager', 'admin'), productController.updateType);
router.delete('/types/:typeId', roleMiddleware('manager', 'admin'), productController.deleteType);
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.get('/:id/usages', productController.getUsages);
router.post('/', roleMiddleware('manager', 'admin'), productController.create);
router.put('/:id', roleMiddleware('manager', 'admin'), productController.update);
router.put('/:id/stock', productController.updateStock);
router.post('/:id/usage', productController.addUsage);
router.delete('/:id', roleMiddleware('manager', 'admin'), productController.delete);

module.exports = router;
