import mongoose from 'mongoose';

const hadithLogSchema = new mongoose.Schema(
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
    text: {
      type: String,
      required: [true, 'Hadith text is required'],
      trim: true,
    },
    narrator: {
      type: String,
      trim: true,
      default: '',
    },
    reference: {
      type: String,
      trim: true,
      default: '',
    },
    reflection: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

hadithLogSchema.index({ userId: 1, date: -1 });

export const HadithLog = mongoose.model('HadithLog', hadithLogSchema);
