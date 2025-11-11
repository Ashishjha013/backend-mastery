const express = require('express');
const router = express.Router();

const { registerSchema, loginSchema } = require('../validation/userValidation');
const validate = require('../middlewares/validate');
const { registerUser, loginUser } = require('../controllers/userControllers');

// Routes
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

module.exports = router;
