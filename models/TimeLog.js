import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['Study', 'Fitness', 'Islamic', 'Work', 'Social', 'Sleep', 'Other'],
      required: true,
      default: 'Work',
    },
    title: {
      type: String,
      trim: true,
    },
    activity: {
      type: String,
      required: [true, 'Activity name is required'],
      trim: true,
    },
    startTime: {
      type: String,
      default: '',
    },
    endTime: {
      type: String,
      default: '',
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

timeLogSchema.index({ userId: 1, date: -1 });

export const TimeLog = mongoose.model('TimeLog', timeLogSchema);
