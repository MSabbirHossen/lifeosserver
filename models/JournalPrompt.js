import mongoose from 'mongoose';

const journalPromptSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      enum: ['gratitude', 'growth', 'deen', 'productivity', 'relationships', 'mindset', 'discipline'],
      default: 'gratitude',
    },
    lastServedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const JournalPrompt = mongoose.model('JournalPrompt', journalPromptSchema);
