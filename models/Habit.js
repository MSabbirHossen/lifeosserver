import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Health', 'Learning', 'Productivity', 'Deen', 'Mindset', 'Mindfulness', 'Other', 'General'],
      default: 'Health',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    targetFrequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    targetValue: {
      type: Number,
      default: 1, // 1 for boolean check-off, or N for numeric target (e.g. 30 mins)
    },
    unit: {
      type: String,
      trim: true,
      default: '', // e.g. 'mins', 'pages', 'glasses'
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

habitSchema.index({ userId: 1, archived: 1 });

export const Habit = mongoose.model('Habit', habitSchema);
