import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxLength: 200,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxLength: 2000,
    },
    image: {
      type: String,
    },
    coinsPerWorker: {
      type: Number,
      required: true,
      min: 1,
    },
    requiredWorkers: {
      type: Number,
      required: true,
      min: 1,
    },
    currentWorkers: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
    category: {
      type: String,
      index: true,
    },
    deadline: {
      type: Date,
    },
    submissionInstructions: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ buyerId: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
