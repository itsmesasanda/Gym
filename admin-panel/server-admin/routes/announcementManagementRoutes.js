const router = require('express').Router();
const announcementController = require('../controllers/announcementController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

router.get('/', adminAuthMiddleware, announcementController.getAllAnnouncements);
router.post('/', adminAuthMiddleware, announcementController.createAnnouncement);
router.put('/:id', adminAuthMiddleware, announcementController.updateAnnouncement);
router.delete('/:id', adminAuthMiddleware, announcementController.deleteAnnouncement);

module.exports = router;
