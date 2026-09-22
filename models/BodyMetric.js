import mongoose from 'mongoose';

const bodyMetricSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: [true, 'Metric date is required'],
      index: true,
    },
    weightKg: {
      type: Number,
      min: 0,
    },
    heightCm: {
      type: Number,
      min: 0,
    },
    waistCm: {
      type: Number,
      min: 0,
    },
    bodyFatPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    chestCm: {
      type: Number,
      min: 0,
    },
    armCm: {
      type: Number,
      min: 0,
    },
    shouldersCm: {
      type: Number,
      min: 0,
    },
    hipsCm: {
      type: Number,
      min: 0,
    },
    thighsCm: {
      type: Number,
      min: 0,
    },
    calvesCm: {
      type: Number,
      min: 0,
    },
    neckCm: {
      type: Number,
      min: 0,
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

bodyMetricSchema.index({ userId: 1, date: -1 });

export const BodyMetric = mongoose.model('BodyMetric', bodyMetricSchema);
