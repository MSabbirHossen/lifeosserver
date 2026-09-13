import express from 'express';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
  getHabitHeatmap,
} from '../controllers/habitsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/heatmap', getHabitHeatmap);
router.post('/:id/log', toggleHabitLog);
router.post('/:id/toggle', toggleHabitLog);

router.route('/').get(getHabits).post(createHabit);
router.route('/:id').put(updateHabit).delete(deleteHabit);

export default router;
