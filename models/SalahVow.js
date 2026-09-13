import mongoose from 'mongoose';

const salahVowSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Vow title is required'],
      trim: true,
    },
    relatedSalah: {
      type: String,
      enum: ['All', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
      default: 'All',
    },
    startDate: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
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

salahVowSchema.index({ userId: 1, active: 1 });

export const SalahVow = mongoose.model('SalahVow', salahVowSchema);
