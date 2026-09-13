import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
    },
    unitType: {
      type: String,
      enum: ['piece', 'gram', 'teaspoon', 'tablespoon', 'cup', 'bowl', 'ml'],
      default: 'piece',
    },
    caloriesPerUnit: {
      type: Number,
      required: [true, 'Calories per unit is required'],
      min: 0,
    },
    proteinPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    carbsPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    fatPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    timesUsed: {
      type: Number,
      default: 1,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

foodItemSchema.index({ userId: 1, name: 1 });

export const FoodItem = mongoose.model('FoodItem', foodItemSchema);
