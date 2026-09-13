import mongoose from 'mongoose';

const quranLogSchema = new mongoose.Schema(
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
    pagesRead: {
      type: Number,
      default: 0,
      min: 0,
    },
    ayatsRead: {
      type: mongoose.Schema.Types.Mixed,
      default: 0,
    },
    surah: {
      type: String,
      trim: true,
      default: '',
    },
    surahName: {
      type: String,
      trim: true,
      default: '',
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

quranLogSchema.index({ userId: 1, date: -1 });

export const QuranLog = mongoose.model('QuranLog', quranLogSchema);
