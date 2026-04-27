const router = require('express').Router();
const userController = require('../controllers/userController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

router.get('/', adminAuthMiddleware, userController.getAllUsers);
router.post('/', adminAuthMiddleware, userController.createUser);
router.put('/:id', adminAuthMiddleware, userController.updateUser);
router.delete('/:id', adminAuthMiddleware, userController.deleteUser);

module.exports = router;
