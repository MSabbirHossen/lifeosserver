import express from 'express';
import {
  getSalahLogs,
  logSalah,
  getSalahSummary,
  getQadaLogs,
  updateQada,
  getHadithLogs,
  createHadithLog,
  updateHadithLog,
  deleteHadithLog,
  getVows,
  createVow,
  updateVow,
  deleteVow,
  getQuranLogs,
  logQuran,
  updateQuranLog,
  deleteQuranLog,
  getAdhkarLog,
  logAdhkar,
  getIslamicFasts,
  logIslamicFast,
  deleteIslamicFast,
  getIslamicFastsSummary,
} from '../controllers/islamicController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Salah
router.route('/salah').get(getSalahLogs).post(logSalah);
router.route('/salah/summary').get(getSalahSummary);

// Qada Make-up
router.route('/qada').get(getQadaLogs).post(updateQada);

// Hadiths
router.route('/hadith').get(getHadithLogs).post(createHadithLog);
router.route('/hadith/:id').put(updateHadithLog).delete(deleteHadithLog);

// Vows
router.route('/vows').get(getVows).post(createVow);
router.route('/vows/:id').put(updateVow).delete(deleteVow);

// Quran & Adhkar
router.route('/quran').get(getQuranLogs).post(logQuran);
router.route('/quran/:id').put(updateQuranLog).delete(deleteQuranLog);
router.route('/adhkar').get(getAdhkarLog).post(logAdhkar);

// Islamic Fasting (Sawm / Siyam)
router.route('/fasts').get(getIslamicFasts).post(logIslamicFast);
router.route('/fasts/summary').get(getIslamicFastsSummary);
router.route('/fasts/:id').delete(deleteIslamicFast);

export default router;

