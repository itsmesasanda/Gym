const router = require('express').Router();
const userAuthMiddleware = require('../middleware/userAuthMiddleware');
const userPortalController = require('../controllers/userPortalController');

router.use(userAuthMiddleware);

router.get('/announcements', userPortalController.getAnnouncements);
router.get('/events', userPortalController.getEvents);
router.get('/meals', userPortalController.getMeals);
router.get('/workouts', userPortalController.getWorkouts);
router.get('/videos', userPortalController.getVideos);
router.get('/payments', userPortalController.getMyPayments);

module.exports = router;
