import mongoose from 'mongoose';

const qadaLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prayerName: {
      type: String,
      enum: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'],
      required: true,
    },
    totalOwed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

qadaLogSchema.index({ userId: 1, prayerName: 1 }, { unique: true });

export const QadaLog = mongoose.model('QadaLog', qadaLogSchema);
