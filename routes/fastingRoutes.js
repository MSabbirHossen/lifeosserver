import express from 'express';
import {
  getFastingData,
  updateActiveState,
  recordEndedFast,
  adjustFastingCount,
  resetFastingData,
  syncFastingData,
} from '../controllers/fastingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFastingData);

router.route('/state')
  .put(updateActiveState)
  .post(updateActiveState);

router.route('/record')
  .post(recordEndedFast);

router.route('/adjust')
  .post(adjustFastingCount);

router.route('/reset')
  .post(resetFastingData);

router.route('/sync')
  .post(syncFastingData);

export default router;
