import express from 'express';
import {
  getStudySessions,
  createStudySession,
  getSubjects,
  updateStudySession,
  deleteStudySession,
  getStudyTopics,
  createStudyTopic,
  updateStudyTopic,
  deleteStudyTopic,
} from '../controllers/studyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getStudySessions).post(createStudySession);
router.route('/subjects').get(getSubjects);
router.route('/topics').get(getStudyTopics).post(createStudyTopic);
router.route('/topics/:id').put(updateStudyTopic).delete(deleteStudyTopic);
router.route('/:id').put(updateStudySession).delete(deleteStudySession);

export default router;
