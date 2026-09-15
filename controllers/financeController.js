import { Transaction } from '../models/Transaction.js';

export const SUPPORTED_CURRENCIES = [
  'USD',
  'BDT',
  'SAR',
  'EUR',
  'GBP',
  'AED',
  'INR',
  'CAD',
  'AUD',
  'QAR',
  'MYR',
  'TRY',
  'JPY',
  'KWD',
  'OMR',
  'PKR',
];
export const DEFAULT_PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Debit Card', 'Credit Card', 'Mobile Wallet', 'Other'];

// Standard rates relative to 1 USD
const RATES_TO_USD = {
  USD: 1.0,
  SAR: 3.75,
  BDT: 120.0,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  INR: 83.5,
  CAD: 1.37,
  AUD: 1.52,
  QAR: 3.64,
  MYR: 4.70,
  TRY: 33.0,
  JPY: 155.0,
  KWD: 0.31,
  OMR: 0.38,
  PKR: 278.0,
};

const convertCurrency = (amt, fromCurr = 'USD', toCurr = 'USD') => {
  if (!amt) return 0;
  const from = (fromCurr || 'USD').toUpperCase();
  const to = (toCurr || 'USD').toUpperCase();
  if (from === to) return amt;

  const fromRate = RATES_TO_USD[from];
  const toRate = RATES_TO_USD[to];

  if (fromRate && toRate) {
    const amtInUsd = amt / fromRate;
    return amtInUsd * toRate;
  }
  return amt; // 1:1 fallback for unknown/custom codes
};

export const getMeta = async (req, res) => {
  try {
    const userCurrency = (req.user?.currency || 'USD').toUpperCase();
    res.json({
      currencies: SUPPORTED_CURRENCIES,
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      defaultCurrency: userCurrency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch finance metadata' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { from, to, date, type, category, currency, search } = req.query;
    const filter = { userId: req.user._id };

    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    if (type && type !== 'all') filter.type = type;
    if (category && category !== 'all') filter.category = category;
    if (currency && currency !== 'all') filter.currency = currency.toUpperCase();

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch transactions' });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { date, type, title, amount, currency, category, paymentMethod, notes } = req.body;

    if (!date || !amount || !category) {
      return res.status(400).json({ message: 'Date, amount, and category are required' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const defaultUserCurr = (req.user?.currency || 'USD').toUpperCase();

    const transaction = await Transaction.create({
      userId: req.user._id,
      date,
      type: type || 'expense',
      title: title?.trim() || category,
      amount: numAmount,
      currency: (currency || defaultUserCurr).toUpperCase(),
      category: category.trim(),
      paymentMethod: paymentMethod || 'Debit Card',
      notes: notes?.trim() || '',
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create transaction' });
  }
};

export const createFundTransfer = async (req, res) => {
  try {
    const {
      date,
      title,
      fromPaymentMethod,
      toPaymentMethod,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      notes,
    } = req.body;

    if (!date || !fromPaymentMethod || !toPaymentMethod || !fromAmount) {
      return res.status(400).json({ message: 'Date, from/to methods, and amount are required' });
    }

    const numFromAmount = Number(fromAmount);
    const numToAmount = toAmount ? Number(toAmount) : numFromAmount;
    const defaultUserCurr = (req.user?.currency || 'USD').toUpperCase();
    const finalFromCurr = (fromCurrency || defaultUserCurr).toUpperCase();
    const finalToCurr = (toCurrency || finalFromCurr).toUpperCase();
    const defaultTitle = finalFromCurr !== finalToCurr
      ? `Exchange: ${numFromAmount} ${finalFromCurr} → ${numToAmount} ${finalToCurr}`
      : `Transfer: ${fromPaymentMethod} → ${toPaymentMethod}`;

    const transferTx = await Transaction.create({
      userId: req.user._id,
      date,
      type: 'transfer',
      title: title?.trim() || defaultTitle,
      amount: numFromAmount,
      currency: finalFromCurr,
      category: 'Transfer',
      paymentMethod: fromPaymentMethod,
      toPaymentMethod,
      toCurrency: finalToCurr,
      toAmount: numToAmount,
      notes: notes?.trim() || '',
    });

    res.status(201).json(transferTx);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create fund transfer' });
  }
};

export const getFinanceSummary = async (req, res) => {
  try {
    const userCurrency = (req.user?.currency || 'USD').toUpperCase();
    const targetCurrency = (req.query.currency || userCurrency).toUpperCase();
    const allTx = await Transaction.find({ userId: req.user._id });

    let totalIncome = 0;
    let totalExpenses = 0;
    const methodBalances = {};
    const currencyTotals = {};

    DEFAULT_PAYMENT_METHODS.forEach((m) => {
      methodBalances[m] = 0;
    });

    allTx.forEach((tx) => {
      const txCurr = (tx.currency || targetCurrency).toUpperCase();
      const amtInTarget = convertCurrency(tx.amount, txCurr, targetCurrency);

      if (!currencyTotals[txCurr]) {
        currencyTotals[txCurr] = {
          currency: txCurr,
          income: 0,
          expense: 0,
          transfersIn: 0,
          transfersOut: 0,
          balance: 0,
          balanceInTarget: 0,
        };
      }

      if (tx.type === 'income') {
        currencyTotals[txCurr].income += tx.amount;
        currencyTotals[txCurr].balance += tx.amount;
        totalIncome += amtInTarget;
        methodBalances[tx.paymentMethod] = (methodBalances[tx.paymentMethod] || 0) + amtInTarget;
      } else if (tx.type === 'expense') {
        currencyTotals[txCurr].expense += tx.amount;
        currencyTotals[txCurr].balance -= tx.amount;
        totalExpenses += amtInTarget;
        methodBalances[tx.paymentMethod] = (methodBalances[tx.paymentMethod] || 0) - amtInTarget;
      } else if (tx.type === 'transfer') {
        const fromCurr = txCurr;
        const toCurr = (tx.toCurrency || txCurr).toUpperCase();
        const toAmt = tx.toAmount !== undefined && tx.toAmount !== null ? Number(tx.toAmount) : tx.amount;
        const toAmtInTarget = convertCurrency(toAmt, toCurr, targetCurrency);

        if (!currencyTotals[toCurr]) {
          currencyTotals[toCurr] = {
            currency: toCurr,
            income: 0,
            expense: 0,
            transfersIn: 0,
            transfersOut: 0,
            balance: 0,
            balanceInTarget: 0,
          };
        }

        currencyTotals[fromCurr].transfersOut += tx.amount;
        currencyTotals[fromCurr].balance -= tx.amount;

        currencyTotals[toCurr].transfersIn += toAmt;
        currencyTotals[toCurr].balance += toAmt;

        methodBalances[tx.paymentMethod] = (methodBalances[tx.paymentMethod] || 0) - amtInTarget;
        const targetMethod = tx.toPaymentMethod || tx.paymentMethod;
        methodBalances[targetMethod] = (methodBalances[targetMethod] || 0) + toAmtInTarget;
      }
    });

    // Calculate converted valuation for each currency holding and sum total net wealth
    let netSavings = 0;
    Object.keys(currencyTotals).forEach((c) => {
      const b = currencyTotals[c].balance;
      const bInTarget = convertCurrency(b, c, targetCurrency);
      currencyTotals[c].balanceInTarget = Math.round(bInTarget * 100) / 100;
      netSavings += bInTarget;
    });

    res.json({
      currency: targetCurrency,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netSavings: Math.round(netSavings * 100) / 100,
      methodBalances,
      currencyTotals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch finance summary' });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const {
      date,
      type,
      title,
      amount,
      currency,
      category,
      paymentMethod,
      toPaymentMethod,
      toCurrency,
      toAmount,
      notes,
    } = req.body;

    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    if (date !== undefined) tx.date = date;
    if (type !== undefined) tx.type = type;
    const txTitle = title !== undefined ? title : req.body.description;
    if (txTitle !== undefined) tx.title = txTitle.trim();
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }
      tx.amount = numAmount;
    }
    if (currency !== undefined) tx.currency = currency ? currency.toUpperCase() : tx.currency;
    if (category !== undefined) tx.category = category.trim();
    if (paymentMethod !== undefined) tx.paymentMethod = paymentMethod;
    if (toPaymentMethod !== undefined) tx.toPaymentMethod = toPaymentMethod;
    if (toCurrency !== undefined) tx.toCurrency = toCurrency ? toCurrency.toUpperCase() : tx.toCurrency;
    if (toAmount !== undefined) tx.toAmount = Number(toAmount);
    if (notes !== undefined) tx.notes = notes.trim();

    await tx.save();
    res.json(tx);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update transaction' });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete transaction' });
  }
};

