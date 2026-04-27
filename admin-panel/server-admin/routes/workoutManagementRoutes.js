const router = require('express').Router();
const workoutController = require('../controllers/workoutController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

router.get('/', adminAuthMiddleware, workoutController.getAllWorkouts);
router.post('/', adminAuthMiddleware, workoutController.createWorkout);
router.put('/:id', adminAuthMiddleware, workoutController.updateWorkout);
router.delete('/:id', adminAuthMiddleware, workoutController.deleteWorkout);

module.exports = router;
