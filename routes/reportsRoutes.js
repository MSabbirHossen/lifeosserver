import express from 'express';
import {
  getReviews,
  createOrUpdateReview,
  exportUserDataJson,
} from '../controllers/reportsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/reviews').get(getReviews).post(createOrUpdateReview);
router.get('/export/json', exportUserDataJson);

export default router;
