const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload');
const storageMiddleware = require('../middlewares/storageMiddleware');

router.use(authMiddleware);

router.get('/', incidentController.getAll);
router.get('/assignable-users', roleMiddleware('manager', 'admin'), incidentController.getAssignableUsers);
router.get('/:id', incidentController.getById);
router.post('/', upload.array('photos', 10), storageMiddleware, incidentController.create);
router.put('/:id', incidentController.update);
router.put('/:id/assign', roleMiddleware('manager', 'admin'), incidentController.assign);
router.put('/:id/status', incidentController.updateStatus);
router.put('/:id/resolve', incidentController.resolve);
router.post('/:id/comments', incidentController.addComment);
router.post('/:id/photos', upload.array('photos', 10), storageMiddleware, incidentController.addPhotos);
router.delete("/:id/photos/:photoId", incidentController.deletePhoto);
router.delete("/:id/comments/:commentId", incidentController.deleteComment);
router.put("/:id/comments/:commentId", incidentController.updateComment);
router.delete("/:id", incidentController.delete);

module.exports = router;
