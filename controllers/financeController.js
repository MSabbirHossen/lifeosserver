import { Transaction } from '../models/Transaction.js';

export const SUPPORTED_CURRENCIES = ['SAR', 'BDT', 'USD'];
export const DEFAULT_PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Debit Card', 'Credit Card', 'Mobile Wallet', 'Other'];

export const getMeta = async (req, res) => {
  try {
    res.json({
      currencies: SUPPORTED_CURRENCIES,
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      defaultCurrency: 'SAR',
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
    if (currency && currency !== 'all') filter.currency = currency;

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

    const transaction = await Transaction.create({
      userId: req.user._id,
      date,
      type: type || 'expense',
      title: title?.trim() || category,
      amount: numAmount,
      currency: currency || 'SAR',
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

    const transferTx = await Transaction.create({
      userId: req.user._id,
      date,
      type: 'transfer',
      title: title?.trim() || `Transfer: ${fromPaymentMethod} → ${toPaymentMethod}`,
      amount: numFromAmount,
      currency: fromCurrency || 'SAR',
      category: 'Transfer',
      paymentMethod: fromPaymentMethod,
      toPaymentMethod,
      toCurrency: toCurrency || fromCurrency || 'SAR',
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
    const { currency = 'SAR' } = req.query;
    const allTx = await Transaction.find({ userId: req.user._id });

    // Currency conversions fallback (approximate standard rates if mixed)
    // 1 USD = 3.75 SAR, 1 USD = 120 BDT, 1 SAR = 32 BDT
    const toSAR = (amt, curr) => {
      if (curr === 'SAR') return amt;
      if (curr === 'USD') return amt * 3.75;
      if (curr === 'BDT') return amt / 32;
      return amt;
    };

    let totalIncome = 0;
    let totalExpenses = 0;
    const methodBalances = {};
    const currencyTotals = { SAR: { income: 0, expense: 0 }, BDT: { income: 0, expense: 0 }, USD: { income: 0, expense: 0 } };

    DEFAULT_PAYMENT_METHODS.forEach((m) => {
      methodBalances[m] = 0;
    });

    allTx.forEach((tx) => {
      const txCurr = tx.currency || 'SAR';
      const amtInSAR = toSAR(tx.amount, txCurr);

      if (currencyTotals[txCurr]) {
        if (tx.type === 'income') currencyTotals[txCurr].income += tx.amount;
        if (tx.type === 'expense') currencyTotals[txCurr].expense += tx.amount;
      }

      if (tx.type === 'income') {
        totalIncome += amtInSAR;
        methodBalances[tx.paymentMethod] = (methodBalances[tx.paymentMethod] || 0) + amtInSAR;
      } else if (tx.type === 'expense') {
        totalExpenses += amtInSAR;
        methodBalances[tx.paymentMethod] = (methodBalances[tx.paymentMethod] || 0) - amtInSAR;
      } else if (tx.type === 'transfer') {
        methodBalances[tx.paymentMethod] = (methodBalances[tx.paymentMethod] || 0) - amtInSAR;
        const toAmtInSAR = toSAR(tx.toAmount || tx.amount, tx.toCurrency || txCurr);
        methodBalances[tx.toPaymentMethod] = (methodBalances[tx.toPaymentMethod] || 0) + toAmtInSAR;
      }
    });

    res.json({
      currency: 'SAR',
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netSavings: Math.round((totalIncome - totalExpenses) * 100) / 100,
      methodBalances,
      currencyTotals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch finance summary' });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { date, type, title, amount, currency, category, paymentMethod, notes } = req.body;

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
    if (currency !== undefined) tx.currency = currency;
    if (category !== undefined) tx.category = category.trim();
    if (paymentMethod !== undefined) tx.paymentMethod = paymentMethod;
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

