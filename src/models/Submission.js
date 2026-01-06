import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    submissionText: {
      type: String,
      required: true,
      maxLength: 2000,
    },
    submissionImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    coinsAwarded: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
submissionSchema.index({ taskId: 1, workerId: 1 }, { unique: true });
submissionSchema.index({ workerId: 1, status: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
