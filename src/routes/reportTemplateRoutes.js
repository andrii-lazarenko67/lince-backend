const express = require('express');
const router = express.Router();
const reportTemplateController = require('../controllers/reportTemplateController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', reportTemplateController.getAll);
router.get('/default', reportTemplateController.getDefault);
router.get('/:id', reportTemplateController.getById);
router.post('/', reportTemplateController.create);
router.put('/:id', reportTemplateController.update);
router.delete('/:id', reportTemplateController.delete);
router.post('/:id/set-default', reportTemplateController.setDefault);

module.exports = router;
