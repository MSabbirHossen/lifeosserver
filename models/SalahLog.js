import mongoose from 'mongoose';

const salahLogSchema = new mongoose.Schema(
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
    salah: {
      type: String,
      enum: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
      required: true,
    },
    status: {
      type: String,
      enum: ['onTime', 'jamaah', 'late', 'missed', 'qada'],
      required: true,
      default: 'onTime',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on userId, date, and salah
salahLogSchema.index({ userId: 1, date: -1, salah: 1 }, { unique: true });

export const SalahLog = mongoose.model('SalahLog', salahLogSchema);
