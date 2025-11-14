const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      return next(new Error('Not authorized, user not found'));
    }
    req.user = user; // Attach user to request object
    next();
  } catch (err) {
    res.status(401);
    return next(new Error('Not authorized, token invalid'));
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error('Not authorized'));
  }
  if (req.user.role !== 'admin') {
    res.status(403);
    return next(new Error('Forbidden: Admins access only'));
  }
  next();
};

module.exports = {
  protect,
  adminOnly,
};
