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
  if (task.owner._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden: You do not have access to this task');
  }

  res.json(task);
});

// List tasks with pagination, filter, sort, text search
exports.listTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, q, sort = '-createdAt' } = req.body;
  const skip = (Number(page) - 1) * Number(limit);

  // by default user sees own tasks
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  // text search
  if (q) {
    filter.$text = { $search: q };
  }

  const taskPromise = Task.find(filter).sort(sort).skip(skip).limit(Number(limit)).select('__v');
  const countPromise = Task.countDocuments(filter);

  const [task, total] = await Promise.All([taskPromise, countPromise]);

  res.json({
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    data: task,
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

  Object.assign(task, req.body);
  const updated = await task.save();
  res.json(updated);
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

  await task.remove();
  res.json({
    message: 'Task deleted successfully',
  });
});

// Aggregation example: stats for logged-in user (count per status)
exports.taskStats = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const stats = await Task.aggregate([
    { $match: { owner: mongoose.Types.ObjectId(ownerId) } },
    { $group: { _id: `$status`, count: { $sum: 1 } } },
    { $project: { status: `$_id`, count: 1, _id: 0 } },
  ]);
  res.json({ stats });
});
