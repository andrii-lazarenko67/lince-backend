const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authMiddleware);

router.get('/', inspectionController.getAll);
router.get('/:id', inspectionController.getById);
router.post('/', upload.array('photos', 10), inspectionController.create);
router.put('/:id', inspectionController.update);
router.put('/:id/approve', roleMiddleware('manager', 'admin'), inspectionController.approve);
router.post('/:id/photos', upload.array('photos', 10), inspectionController.addPhotos);
router.delete('/:id', inspectionController.delete);

module.exports = router;
