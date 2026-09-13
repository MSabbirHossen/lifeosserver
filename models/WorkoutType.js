import mongoose from 'mongoose';

const workoutTypeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Workout type name is required'],
      trim: true,
    },
    trackingType: {
      type: String,
      enum: ['sets_reps', 'duration', 'distance'],
      default: 'sets_reps',
    },
    defaultCaloriesPerMinute: {
      type: Number,
      default: 5,
      min: 0,
    },
    caloriesPerSet: {
      type: Number,
      default: 8,
      min: 0,
    },
    caloriesPerRep: {
      type: Number,
      default: 0.8,
      min: 0,
    },
    defaultSets: {
      type: Number,
      default: 3,
    },
    defaultReps: {
      type: Number,
      default: 10,
    },
    defaultWeight: {
      type: Number,
      default: 0,
    },
    target: {
      type: String,
      enum: ['Muscle', 'Cardio', 'Flexibility', 'Sports'],
      default: 'Muscle',
    },
  },
  {
    timestamps: true,
  }
);

workoutTypeSchema.index({ userId: 1, name: 1 });

export const WorkoutType = mongoose.model('WorkoutType', workoutTypeSchema);
