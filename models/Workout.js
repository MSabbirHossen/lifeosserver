import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: [true, 'Workout date is required'],
      index: true,
    },
    workoutTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutType',
    },
    name: {
      type: String,
      required: [true, 'Workout name is required'],
      trim: true,
    },
    trackingType: {
      type: String,
      enum: ['sets_reps', 'duration', 'distance'],
      default: 'sets_reps',
    },
    sets: {
      type: Number,
      default: 0,
    },
    reps: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      required: [true, 'Calories burned is required'],
      min: 0,
    },
    target: {
      type: String,
      default: 'Muscle',
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

workoutSchema.index({ userId: 1, date: -1 });

export const Workout = mongoose.model('Workout', workoutSchema);
