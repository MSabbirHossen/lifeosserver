import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: [true, 'Log date is required'],
      index: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    value: {
      type: Number,
      default: 1, // numeric value logged if applicable
    },
  },
  {
    timestamps: true,
  }
);

// Compound index guaranteeing uniqueness per habit per user per day
habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, date: -1 });

export const HabitLog = mongoose.model('HabitLog', habitLogSchema);
