const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', roleMiddleware('manager', 'admin'), userController.getAll);
router.get('/:id', roleMiddleware('manager', 'admin'), userController.getById);
router.post('/', roleMiddleware('manager', 'admin'), userController.create);
router.put('/:id', roleMiddleware('manager', 'admin'), userController.update);
router.delete('/:id', roleMiddleware('manager', 'admin'), userController.delete);
router.put('/profile/update', userController.updateProfile);

module.exports = router;
