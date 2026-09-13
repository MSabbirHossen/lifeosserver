import mongoose from 'mongoose';

const studyTopicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Topic / Chapter title is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['backlog', 'in_progress', 'completed'],
      default: 'backlog',
    },
    totalChapters: {
      type: Number,
      default: 1,
      min: 1,
    },
    completedChapters: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtopics: [
      {
        title: { type: String, trim: true },
        completed: { type: Boolean, default: false },
      },
    ],
    targetDate: {
      type: String,
      default: '',
    },
    linkedGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
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

studyTopicSchema.index({ userId: 1, subject: 1 });

export const StudyTopic = mongoose.model('StudyTopic', studyTopicSchema);
