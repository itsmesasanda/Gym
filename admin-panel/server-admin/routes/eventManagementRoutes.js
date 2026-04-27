const router = require('express').Router();
const eventController = require('../controllers/eventController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

router.get('/', adminAuthMiddleware, eventController.getAllEvents);
router.post('/', adminAuthMiddleware, eventController.createEvent);
router.put('/:id', adminAuthMiddleware, eventController.updateEvent);
router.delete('/:id', adminAuthMiddleware, eventController.deleteEvent);

module.exports = router;
