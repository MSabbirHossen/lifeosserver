import mongoose from 'mongoose';

const adhkarLogSchema = new mongoose.Schema(
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
    morningCompleted: {
      type: Boolean,
      default: false,
    },
    eveningCompleted: {
      type: Boolean,
      default: false,
    },
    otherNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

adhkarLogSchema.index({ userId: 1, date: -1 });

export const AdhkarLog = mongoose.model('AdhkarLog', adhkarLogSchema);
