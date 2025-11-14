const express = require('express');
const router = express.Router();

const { registerSchema, loginSchema } = require('../validation/userValidation');
const validate = require('../middlewares/validate');
const { registerUser, loginUser } = require('../controllers/userControllers');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Routes
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

// Protected profile route
router.get('/profile', protect, (req, res) => {
  // Assuming req.user is set by the protect middleware
  res.json({
    id: req.query._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

// Admin-only test route

router.get('/admin', protect, adminOnly, (req, res) => {
  res.json({
    message: 'Welcome, Admin!',
    user: {
      id: req.user._id,
      email: req.user.email,
    },
  });
});

module.exports = router;
