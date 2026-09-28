import mongoose from 'mongoose';

const intermittentFastSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    activeState: {
      isActive: {
        type: Boolean,
        default: false,
      },
      startTime: {
        type: String,
        default: null,
      },
      protocolId: {
        type: String,
        default: '16:8',
      },
      targetHours: {
        type: Number,
        default: 16,
      },
    },
    stats: {
      completedCount: {
        type: Number,
        default: 0,
      },
      partialCount: {
        type: Number,
        default: 0,
      },
      earlyEndedCount: {
        type: Number,
        default: 0,
      },
      streak: {
        type: Number,
        default: 0,
      },
      totalHoursFasted: {
        type: Number,
        default: 0,
      },
      lastCompletedDate: {
        type: String,
        default: null,
      },
    },
    history: [
      {
        id: { type: String },
        date: { type: String },
        startTime: { type: String },
        endTime: { type: String },
        protocolId: { type: String },
        targetHours: { type: Number },
        actualHours: { type: Number },
        percentCompleted: { type: Number },
        status: { type: String },
        statusLabel: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const IntermittentFast = mongoose.model('IntermittentFast', intermittentFastSchema);
