import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
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
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    moods: {
      type: [String],
      default: [],
    },
    highlights: {
      type: String,
      trim: true,
      default: '',
    },
    problemsFaced: {
      type: String,
      trim: true,
      default: '',
    },
    gratitude: {
      type: [String],
      default: [],
    },
    notesForTomorrow: {
      type: String,
      trim: true,
      default: '',
    },
    promptQuestion: {
      type: String,
      default: '',
    },
    promptAnswer: {
      type: String,
      default: '',
    },
    photos: {
      type: [String],
      default: [],
    },
    autoTags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on userId and date for optimal query performance
journalSchema.index({ userId: 1, date: -1 });

export const Journal = mongoose.model('Journal', journalSchema);
