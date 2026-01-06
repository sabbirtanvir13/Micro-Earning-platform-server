import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notificationHelper.js';

// Create withdrawal request (worker)
export const createWithdrawal = async (req, res) => {
  try {
    const { coins, paymentMethod, paymentDetails } = req.body;

    if (coins < 200) {
      return res.status(400).json({
        message: 'Minimum withdrawal is 200 coins',
      });
    }

    const worker = await User.findById(req.user._id);

    if (worker.coins < coins) {
      return res.status(400).json({
        message: `Insufficient coins. You have ${worker.coins} coins but requested ${coins}`,
      });
    }

    // Calculate amount (20 coins = 1 dollar)
    const amount = coins / 20;

    // Deduct coins from worker (will be refunded if rejected)
    worker.coins -= coins;
    await worker.save();

    const withdrawal = new Withdrawal({
      workerId: req.user._id,
      coins,
      amount,
      paymentMethod,
      paymentDetails,
    });

    await withdrawal.save();

    res.status(201).json({ withdrawal });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get worker's withdrawals
export const getWorkerWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ workerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ withdrawals });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all withdrawals (admin)
export const getAllWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const withdrawals = await Withdrawal.find(query)
      .populate('workerId', 'displayName email')
      .populate('reviewedBy', 'displayName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments(query);

    res.json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all withdrawals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve withdrawal (admin)
export const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    withdrawal.status = 'approved';
    withdrawal.reviewedBy = req.user._id;
    withdrawal.reviewedAt = new Date();
    await withdrawal.save();

    // Notify worker
    await createNotification(
      withdrawal.workerId,
      'withdrawal_approved',
      'Withdrawal Approved',
      `Your withdrawal request of ${withdrawal.coins} coins ($${withdrawal.amount.toFixed(2)}) has been approved and will be processed soon.`,
      withdrawal._id
    );

    res.json({ withdrawal });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject withdrawal (admin)
export const rejectWithdrawal = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    // Refund coins to worker
    const worker = await User.findById(withdrawal.workerId);
    worker.coins += withdrawal.coins;
    await worker.save();

    withdrawal.status = 'rejected';
    withdrawal.reviewedBy = req.user._id;
    withdrawal.reviewedAt = new Date();
    withdrawal.rejectionReason = rejectionReason || 'No reason provided';
    await withdrawal.save();

    // Notify worker
    await createNotification(
      withdrawal.workerId,
      'withdrawal_rejected',
      'Withdrawal Rejected',
      `Your withdrawal request was rejected. Reason: ${withdrawal.rejectionReason}. Coins have been refunded.`,
      withdrawal._id
    );

    res.json({ withdrawal });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark withdrawal as processed (admin)
export const processWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'approved') {
      return res.status(400).json({
        message: 'Withdrawal must be approved before processing',
      });
    }

    withdrawal.status = 'processed';
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.json({ withdrawal });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
