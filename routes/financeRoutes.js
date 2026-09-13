import express from 'express';
import {
  getTransactions,
  createTransaction,
  createFundTransfer,
  getFinanceSummary,
  getMeta,
  updateTransaction,
  deleteTransaction,
} from '../controllers/financeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getTransactions).post(createTransaction);
router.route('/transactions').get(getTransactions).post(createTransaction);
router.route('/transfer').post(createFundTransfer);
router.route('/summary').get(getFinanceSummary);
router.route('/meta').get(getMeta);
router.route('/transactions/:id').put(updateTransaction).delete(deleteTransaction);
router.route('/:id').put(updateTransaction).delete(deleteTransaction);

export default router;
