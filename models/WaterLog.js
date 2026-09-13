import mongoose from 'mongoose';

const waterLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: [true, 'Water log date is required'],
      index: true,
    },
    glasses: {
      type: Number,
      default: 0,
      min: 0,
    },
    ml: {
      type: Number,
      default: 0,
    },
    mlPerGlass: {
      type: Number,
      default: 250,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

waterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const WaterLog = mongoose.model('WaterLog', waterLogSchema);
