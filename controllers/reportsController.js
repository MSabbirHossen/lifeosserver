import { Review } from '../models/Review.js';
import { Journal } from '../models/Journal.js';
import { TimeLog } from '../models/TimeLog.js';
import { StudySession } from '../models/StudySession.js';
import { Meal } from '../models/Meal.js';
import { Workout } from '../models/Workout.js';
import { BodyMetric } from '../models/BodyMetric.js';
import { Transaction } from '../models/Transaction.js';
import { SalahLog } from '../models/SalahLog.js';
import { SalahVow } from '../models/SalahVow.js';
import { QuranLog } from '../models/QuranLog.js';
import { AdhkarLog } from '../models/AdhkarLog.js';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { Goal } from '../models/Goal.js';

export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id }).sort({ periodIdentifier: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch reviews' });
  }
};

export const createOrUpdateReview = async (req, res) => {
  try {
    const { type, periodIdentifier, whatWentWell, whatDidnt, howToImprove } = req.body;
    if (!type || !periodIdentifier) {
      return res.status(400).json({ message: 'Review type and period identifier are required' });
    }

    const review = await Review.findOneAndUpdate(
      { userId: req.user._id, type, periodIdentifier },
      { whatWentWell, whatDidnt, howToImprove },
      { new: true, upsert: true }
    );

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save review' });
  }
};

// Export all user data to single JSON object
export const exportUserDataJson = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      journals,
      timeLogs,
      studies,
      meals,
      workouts,
      bodyMetrics,
      transactions,
      salahLogs,
      salahVows,
      quranLogs,
      adhkarLogs,
      habits,
      habitLogs,
      goals,
      reviews,
    ] = await Promise.all([
      Journal.find({ userId }),
      TimeLog.find({ userId }),
      StudySession.find({ userId }),
      Meal.find({ userId }),
      Workout.find({ userId }),
      BodyMetric.find({ userId }),
      Transaction.find({ userId }),
      SalahLog.find({ userId }),
      SalahVow.find({ userId }),
      QuranLog.find({ userId }),
      AdhkarLog.find({ userId }),
      Habit.find({ userId }),
      HabitLog.find({ userId }),
      Goal.find({ userId }),
      Review.find({ userId }),
    ]);

    const fullBackupPayload = {
      exportMetadata: {
        userId,
        userName: req.user.name,
        userEmail: req.user.email,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      },
      journals,
      timeLogs,
      studies,
      meals,
      workouts,
      bodyMetrics,
      transactions,
      salahLogs,
      salahVows,
      quranLogs,
      adhkarLogs,
      habits,
      habitLogs,
      goals,
      reviews,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=lifeos-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(fullBackupPayload, null, 2));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to export user data' });
  }
};
