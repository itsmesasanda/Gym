const router = require('express').Router();
const videoController = require('../controllers/videoController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

router.get('/', adminAuthMiddleware, videoController.getAllVideos);
router.post('/', adminAuthMiddleware, videoController.createVideo);
router.put('/:id', adminAuthMiddleware, videoController.updateVideo);
router.delete('/:id', adminAuthMiddleware, videoController.deleteVideo);

module.exports = router;
