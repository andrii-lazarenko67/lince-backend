const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload');
const storageMiddleware = require('../middlewares/storageMiddleware');
const planMiddleware = require('../middlewares/planMiddleware');

router.use(authMiddleware);
router.use(planMiddleware('pro', 'enterprise'));

router.get('/', libraryController.getAll);
router.get('/:id', libraryController.getById);
router.post('/', roleMiddleware('manager', 'admin'), upload.single('file'), storageMiddleware, libraryController.create);
router.post('/:id/version', roleMiddleware('manager', 'admin'), upload.single('file'), storageMiddleware, libraryController.uploadNewVersion);
router.put('/:id', roleMiddleware('manager', 'admin'), libraryController.update);
router.delete('/:id', roleMiddleware('manager', 'admin'), libraryController.delete);

module.exports = router;
