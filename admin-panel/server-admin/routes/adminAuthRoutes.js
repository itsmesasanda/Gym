const express = require('express');
const router  = express.Router();
const { registerAdmin, loginAdmin, getMe, listAdmins, deleteAdmin } = require('../controllers/adminAuthController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// Public
router.post('/login', loginAdmin);

// Protected
router.post('/register',     adminAuthMiddleware, registerAdmin);
router.get('/me',            adminAuthMiddleware, getMe);
router.get('/admins',        adminAuthMiddleware, listAdmins);
router.delete('/admins/:id', adminAuthMiddleware, deleteAdmin);

module.exports = router;
