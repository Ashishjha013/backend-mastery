const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/token');

// Register User
exports.registerUser = asyncHandler(async (req, res) => {
  // Extract data from request body
  const { name, email, password } = req.body;

  if (!name || !email || !paassword) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  try {
    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({ name, email, password: hashedPassword });

    // Respond with user data and token
    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    // Handle duplicate email error
    if(err.code && err.code === 11000) {
      res.status(400);
      throw new Error("Email already exists");
    }
    throw err;
  }
});

// Login User
exports.loginUser = asyncHandler(async (req, res) => {
  // Extract data from request body
  const { email, password } = req.body;

  // Find user and validate password
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  // Compare passwords
  const match = await comparePassword(password, user.password);
  if (!match) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Respond with user data and token
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});
