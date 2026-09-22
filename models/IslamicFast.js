import mongoose from 'mongoose';

const islamicFastSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        'ramadan',
        'sunnah_mon_thu',
        'ayyam_al_beed',
        'ashura',
        'arafah',
        'shawwal',
        'qada',
        'nazr',
        'nafl',
      ],
      default: 'sunnah_mon_thu',
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'fasting', 'broken'],
      default: 'completed',
      required: true,
    },
    suhoorTime: {
      type: String,
      trim: true,
    },
    iftarTime: {
      type: String,
      trim: true,
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

// Compound unique index on userId and date to have one primary fast status per day
islamicFastSchema.index({ userId: 1, date: -1 }, { unique: true });

export const IslamicFast = mongoose.model('IslamicFast', islamicFastSchema);
