import Task from '../models/Task.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import { createNotification } from '../utils/notificationHelper.js';

// Get all available tasks (for workers)
export const getAvailableTasks = async (req, res) => {
  try {
    const { status = 'open', category, page = 1, limit = 10, q } = req.query;
    const skip = (page - 1) * limit;

    const query = { status };
    if (category) query.category = category;
    // text / keyword search across title, description, and category
    if (q && q.trim()) {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'i');
      query.$or = [
        { title: re },
        { description: re },
        { category: re },
      ];
    }

    const tasks = await Task.find(query)
      .populate('buyerId', 'displayName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      'buyerId',
      'displayName email'
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if worker has already submitted
    let userSubmission = null;
    if (req.user && req.user.role === 'worker') {
      userSubmission = await Submission.findOne({
        taskId: task._id,
        workerId: req.user._id,
      });
    }

    res.json({ task, userSubmission });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create task (buyer only)
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      coinsPerWorker,
      requiredWorkers,
      category,
      deadline,
      submissionInstructions,
    } = req.body;

    const buyer = await User.findById(req.user._id);

    // Calculate total coins needed
    const totalCoinsNeeded = coinsPerWorker * requiredWorkers;

    // Check if buyer has enough coins
    if (buyer.coins < totalCoinsNeeded) {
      return res.status(400).json({
        message: `Insufficient coins. You need ${totalCoinsNeeded} coins but have ${buyer.coins}`,
      });
    }

    // Deduct coins from buyer
    buyer.coins -= totalCoinsNeeded;
    buyer.totalSpent += totalCoinsNeeded;
    await buyer.save();

    // Create task
    const task = new Task({
      buyerId: req.user._id,
      title,
      description,
      image,
      coinsPerWorker,
      requiredWorkers,
      category,
      deadline,
      submissionInstructions,
    });

    await task.save();

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get buyer's tasks
export const getBuyerTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { buyerId: req.user._id };
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get buyer tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    task.status = status;
    await task.save();

    res.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
