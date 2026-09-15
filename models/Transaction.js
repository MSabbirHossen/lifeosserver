import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: [true, 'Transaction date is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['expense', 'income', 'transfer'],
      required: [true, 'Transaction type is required'],
      default: 'expense',
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: 'Debit Card',
    },
    // For Fund Transfers:
    toPaymentMethod: {
      type: String,
      trim: true,
    },
    toCurrency: {
      type: String,
      uppercase: true,
      trim: true,
    },
    toAmount: {
      type: Number,
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

transactionSchema.index({ userId: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
