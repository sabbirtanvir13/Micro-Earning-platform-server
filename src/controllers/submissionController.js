import Submission from '../models/Submission.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notificationHelper.js';

// Create submission (worker only)
export const createSubmission = async (req, res) => {
  try {
    const { taskId, submissionText, submissionImages } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'open' && task.status !== 'in_progress') {
      return res.status(400).json({ message: 'Task is not accepting submissions' });
    }

    // Check if worker already submitted
    const existingSubmission = await Submission.findOne({
      taskId,
      workerId: req.user._id,
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted for this task' });
    }

    // Check if task has reached required workers
    if (task.currentWorkers >= task.requiredWorkers) {
      return res.status(400).json({ message: 'Task has reached maximum submissions' });
    }

    const submission = new Submission({
      taskId,
      workerId: req.user._id,
      submissionText,
      submissionImages: submissionImages || [],
    });

    await submission.save();

    // Update task
    task.currentWorkers += 1;
    if (task.status === 'open') {
      task.status = 'in_progress';
    }
    await task.save();

    // Notify buyer
    await createNotification(
      task.buyerId,
      'submission_created',
      'New Submission Received',
      `A worker has submitted for your task: ${task.title}`,
      submission._id
    );

    res.status(201).json({ submission });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get worker's submissions with pagination
export const getWorkerSubmissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { workerId: req.user._id };
    if (status) query.status = status;

    const submissions = await Submission.find(query)
      .populate('taskId', 'title coinsPerWorker status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments(query);

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get submissions for a task (buyer/admin)
export const getTaskSubmissions = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      task.buyerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const submissions = await Submission.find({ taskId: req.params.taskId })
      .populate('workerId', 'displayName email profileImage')
      .sort({ createdAt: -1 });

    res.json({ submissions });
  } catch (error) {
    console.error('Get task submissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve submission (buyer/admin)
export const approveSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('taskId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const task = submission.taskId;

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      task.buyerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission already reviewed' });
    }

    // Award coins to worker
    const worker = await User.findById(submission.workerId);
    worker.coins += task.coinsPerWorker;
    worker.totalEarned += task.coinsPerWorker;
    await worker.save();

    // Update submission
    submission.status = 'approved';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    submission.coinsAwarded = task.coinsPerWorker;
    await submission.save();

    // Notify worker
    await createNotification(
      submission.workerId,
      'submission_approved',
      'Submission Approved!',
      `Your submission for "${task.title}" has been approved. You earned ${task.coinsPerWorker} coins!`,
      submission._id
    );

    // Check if task is completed
    const approvedCount = await Submission.countDocuments({
      taskId: task._id,
      status: 'approved',
    });

    if (approvedCount >= task.requiredWorkers) {
      task.status = 'completed';
      await task.save();
    }

    res.json({ submission });
  } catch (error) {
    console.error('Approve submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject submission (buyer/admin)
export const rejectSubmission = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const submission = await Submission.findById(req.params.id).populate('taskId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const task = submission.taskId;

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      task.buyerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission already reviewed' });
    }

    // Update submission
    submission.status = 'rejected';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    submission.rejectionReason = rejectionReason || 'No reason provided';
    await submission.save();

    // Decrease current workers and increase required workers
    task.currentWorkers -= 1;
    task.requiredWorkers += 1;
    await task.save();

    // Notify worker
    await createNotification(
      submission.workerId,
      'submission_rejected',
      'Submission Rejected',
      `Your submission for "${task.title}" was rejected. Reason: ${submission.rejectionReason}`,
      submission._id
    );

    res.json({ submission });
  } catch (error) {
    console.error('Reject submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
