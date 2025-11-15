const asyncHandler = require('../middlewares/asyncHandler');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// Create task (owner = req.user._id)
exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;
  const owner = req.user._id;

  const task = await Task.create({ title, description, status, priority, dueDate, owner });
  res.status(201).json({ success: true, data: task });
});

// Get single task (ensure ownership OR admin)
exports.getTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID');
  }
  const task = await Task.findById(id).populate('owner', 'name email role');
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // allow owner or admin
  const ownerIdStr = (task.owner._id || task.owner).toString();
  if (ownerIdStr !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden: You do not have access to this task');
  }

  res.json({ success: true, data: task });
});

// List tasks with pagination, filter, sort, text search
exports.listTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, q, sort = '-createdAt' } = req.query || {};
  const skip = (Number(page) - 1) * Number(limit);

  // by default user sees own tasks
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  // text search
  if (q) {
    filter.$text = { $search: q };
  }

  const ALLOWED_SORT = ['-creadtedAt', 'createdAt', '-dueDate', 'dueDate'];
  const sortVal = ALLOWED_SORT.includes(sort) ? sort : 'createdAt';

  const taskPromise = Task.find(filter)
    .sort(sortVal)
    .skip(skip)
    .limit(Number(limit))
    .select('-__v');
  const countPromise = Task.countDocuments(filter);

  const [tasks, total] = await Promise.all([taskPromise, countPromise]);

  res.json({
    success: true,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    data: tasks,
  });
});

// Update task (ensure ownership OR admin)
exports.updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // validate id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID');
  }
  // find task
  const task = await Task.findById(id);
  // check existence
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  // allow owner or admin
  if (task.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden: You do not have permission to update this task');
  }

  // update fields
  Object.assign(task, req.body);
  const updated = await task.save();
  res.json({ success: true, data: updated });
});

// Delete task (ensure ownership OR admin)
exports.deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // validate id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID');
  }
  // find task
  const task = await Task.findById(id);
  // check existence
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  // allow owner or admin
  if (task.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden: You do not have permission to delete this task');
  }

  await Task.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
});

// Aggregation example: stats for logged-in user (count per status)
exports.taskStats = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;

  // Safe owner ObjectId: use existing ObjectId if present, otherwise create one
  const ownerOid = typeof ownerId === 'string' ? new mongoose.Types.ObjectId(ownerId) : ownerId;

  const stats = await Task.aggregate([
    { $match: { owner: ownerOid } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);

  return res.json({ success: true, stats });
});
