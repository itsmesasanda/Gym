const router = require('express').Router();
const userAuthController = require('../controllers/userAuthController');
const userAuthMiddleware = require('../middleware/userAuthMiddleware');

router.post('/login', userAuthController.loginUser);
router.get('/me', userAuthMiddleware, userAuthController.getMe);

module.exports = router;
