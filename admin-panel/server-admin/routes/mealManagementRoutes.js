const router = require('express').Router();
const mealController = require('../controllers/mealController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

router.get('/', adminAuthMiddleware, mealController.getAllMeals);
router.post('/', adminAuthMiddleware, mealController.createMeal);
router.put('/:id', adminAuthMiddleware, mealController.updateMeal);
router.delete('/:id', adminAuthMiddleware, mealController.deleteMeal);

module.exports = router;
