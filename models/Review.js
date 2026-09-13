import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: true,
    },
    periodIdentifier: {
      type: String, // e.g. "2026-W34" or "2026-08"
      required: true,
    },
    whatWentWell: {
      type: String,
      trim: true,
      default: '',
    },
    whatDidnt: {
      type: String,
      trim: true,
      default: '',
    },
    howToImprove: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ userId: 1, type: 1, periodIdentifier: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
