import express from 'express';
import {
  getReviews,
  createOrUpdateReview,
  deleteReview,
  exportUserDataJson,
} from '../controllers/reportsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/reviews').get(getReviews).post(createOrUpdateReview);
router.delete('/reviews/:id', deleteReview);
router.get('/export/json', exportUserDataJson);
router.get('/export', exportUserDataJson);

export default router;
