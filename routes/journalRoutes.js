import express from 'express';
import {
  getJournalPrompt,
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '../controllers/journalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/prompt', getJournalPrompt);
router.route('/').get(getJournalEntries).post(createJournalEntry);
router.route('/:id').put(updateJournalEntry).delete(deleteJournalEntry);

export default router;
