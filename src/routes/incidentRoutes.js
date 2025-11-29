const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authMiddleware);

router.get('/', incidentController.getAll);
router.get('/:id', incidentController.getById);
router.post('/', upload.array('photos', 10), incidentController.create);
router.put('/:id', incidentController.update);
router.put('/:id/assign', roleMiddleware('manager', 'admin'), incidentController.assign);
router.put('/:id/resolve', incidentController.resolve);
router.post('/:id/comments', incidentController.addComment);
router.post('/:id/photos', upload.array('photos', 10), incidentController.addPhotos);
router.delete('/:id', incidentController.delete);

module.exports = router;
