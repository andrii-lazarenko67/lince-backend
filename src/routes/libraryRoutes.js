const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authMiddleware);

router.get('/', libraryController.getAll);
router.get('/:id', libraryController.getById);
router.post('/', roleMiddleware('manager', 'admin'), upload.single('file'), libraryController.create);
router.put('/:id', roleMiddleware('manager', 'admin'), libraryController.update);
router.delete('/:id', roleMiddleware('manager', 'admin'), libraryController.delete);

module.exports = router;
