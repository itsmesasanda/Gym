const router           = require('express').Router();
const reportController = require('../controllers/reportController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

router.get('/summary',          adminAuthMiddleware, reportController.getSummary);
router.get('/users-over-time',  adminAuthMiddleware, reportController.getUsersOverTime);
router.get('/meals-calories',   adminAuthMiddleware, reportController.getMealsCalories);

module.exports = router;
