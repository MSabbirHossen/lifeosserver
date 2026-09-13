import express from 'express';
import {
  getTimeLogs,
  createTimeLog,
  updateTimeLog,
  deleteTimeLog,
  getDistinctActivities,
  getTimeSummary,
} from '../controllers/timeTrackerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/activities').get(getDistinctActivities);
router.route('/summary').get(getTimeSummary);
router.route('/logs').get(getTimeLogs).post(createTimeLog);
router.route('/logs/:id').put(updateTimeLog).delete(deleteTimeLog);
router.route('/').get(getTimeLogs).post(createTimeLog);
router.route('/:id').put(updateTimeLog).delete(deleteTimeLog);

export default router;
