import { Journal } from '../models/Journal.js';
import { JournalPrompt } from '../models/JournalPrompt.js';
import { TimeLog } from '../models/TimeLog.js';
import { StudySession } from '../models/StudySession.js';
import { Meal } from '../models/Meal.js';
import { Workout } from '../models/Workout.js';
import { Transaction } from '../models/Transaction.js';
import { SalahLog } from '../models/SalahLog.js';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { Goal } from '../models/Goal.js';
import { WaterLog } from '../models/WaterLog.js';
import { QuranLog } from '../models/QuranLog.js';
import { AdhkarLog } from '../models/AdhkarLog.js';
import { HadithLog } from '../models/HadithLog.js';

// Helper: calculate absolute integer calendar day difference using UTC to avoid DST/timezone jitter
const parseYMD = (str) => {
  if (!str || typeof str !== 'string') return 0;
  const parts = str.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return 0;
  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
};

const getDaysDiff = (d1, d2) => {
  const t1 = parseYMD(d1);
  const t2 = parseYMD(d2);
  return Math.round((t1 - t2) / (1000 * 3600 * 24));
};

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const monthStart = `${date.substring(0, 7)}-01`;

    // Calculate a 180-day bounded window for active streak calculation to leverage compound indexes
    const lookbackDateObj = new Date(date);
    lookbackDateObj.setDate(lookbackDateObj.getDate() - 180);
    const streakLookbackDate = lookbackDateObj.toISOString().split('T')[0];
    const streakDateFilter = { $gte: streakLookbackDate, $lte: date };

    const [
      journal,
      prompts,
      timeLogs,
      studies,
      meals,
      workouts,
      transactionsMonth,
      salahLogs,
      habits,
      habitLogs,
      goals,
      waterLogs,
      quranLogs,
      adhkarLogs,
      hadithLogs,
      // Bounded streak activity queries (parallel indexed distincts)
      pastHabitLogs,
      pastStudies,
      pastWorkouts,
      pastTimeLogs,
      pastJournals,
      pastSalahLogs,
      pastWaterLogs,
      pastMeals,
      pastQuranLogs,
      pastAdhkarLogs,
      pastHadithLogs,
    ] = await Promise.all([
      Journal.findOne({ userId, date }).lean(),
      JournalPrompt.find().sort({ lastServedAt: 1 }).limit(1).lean(),
      TimeLog.find({ userId, date }).lean(),
      StudySession.find({ userId, date }).lean(),
      Meal.find({ userId, date }).lean(),
      Workout.find({ userId, date }).lean(),
      Transaction.find({ userId, date: { $gte: monthStart, $lte: date } }).lean(),
      SalahLog.find({ userId, date }).lean(),
      Habit.find({ userId, archived: false }).lean(),
      HabitLog.find({ userId, date }).lean(),
      Goal.find({ userId, status: 'active' }).lean(),
      WaterLog.find({ userId, date }).lean(),
      QuranLog.find({ userId, date }).lean(),
      AdhkarLog.find({ userId, date }).lean(),
      HadithLog.find({ userId, date }).lean(),
      // Streak lookups (bounded to last 180 days)
      HabitLog.distinct('date', { userId, completed: true, date: streakDateFilter }),
      StudySession.distinct('date', { userId, date: streakDateFilter }),
      Workout.distinct('date', { userId, date: streakDateFilter }),
      TimeLog.distinct('date', { userId, date: streakDateFilter }),
      Journal.distinct('date', { userId, date: streakDateFilter }),
      SalahLog.distinct('date', { userId, status: { $nin: ['missed', 'pending'] }, date: streakDateFilter }),
      WaterLog.distinct('date', { userId, date: streakDateFilter, $or: [{ glasses: { $gt: 0 } }, { ml: { $gt: 0 } }] }),
      Meal.distinct('date', { userId, date: streakDateFilter }),
      QuranLog.distinct('date', { userId, date: streakDateFilter }),
      AdhkarLog.distinct('date', { userId, date: streakDateFilter, $or: [{ morningCompleted: true }, { eveningCompleted: true }] }),
      HadithLog.distinct('date', { userId, date: streakDateFilter }),
    ]);

    // Derive today transactions from the month query to eliminate redundant DB roundtrip
    const transactionsToday = transactionsMonth.filter((t) => t.date === date);

    // Time calculation
    const timeMinutesTotal = timeLogs.reduce((sum, item) => sum + item.durationMinutes, 0);
    const timeByCategory = {};
    timeLogs.forEach((item) => {
      timeByCategory[item.category] = (timeByCategory[item.category] || 0) + item.durationMinutes;
    });

    // Calories & Net Balance Calculation
    const totalCaloriesIn = meals.reduce((sum, item) => sum + (item.totalCalories || 0), 0);
    const totalProtein = meals.reduce((sum, item) => sum + (item.totalProtein || 0), 0);
    const totalCaloriesBurned = workouts.reduce((sum, item) => sum + (item.caloriesBurned || 0), 0);
    const calorieGoal = req.user.dailyCalorieGoal || 2000;
    const netCalories = totalCaloriesIn - totalCaloriesBurned;
    const remainingCalories = Math.max(0, calorieGoal - netCalories);

    // Salah calculation & pill status map
    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const salahMap = {};
    prayerNames.forEach((name) => {
      const found = salahLogs.find((s) => (s.salah || s.prayerName) === name);
      salahMap[name] = found ? found.status : 'pending';
    });
    const salahCompletedCount = salahLogs.filter((s) => s.status && s.status !== 'missed' && s.status !== 'pending').length;

    // Finance calculation
    const expensesToday = transactionsToday
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesMonth = transactionsMonth
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeToday = transactionsToday
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Habit completion count
    const habitsCompletedToday = habitLogs.filter((h) => h.completed).length;

    // Cross-Module Global Continuous Streak Calculation
    const allCompletedDatesToday = new Set([
      ...habitLogs.filter((h) => h.completed).map((h) => h.date),
      ...studies.map((s) => s.date),
      ...workouts.map((w) => w.date),
      ...timeLogs.map((t) => t.date),
      ...(journal ? [journal.date] : []),
      ...salahLogs.filter((s) => s.status && s.status !== 'missed' && s.status !== 'pending').map((s) => s.date),
      ...waterLogs.filter((w) => (w.glasses || 0) > 0 || (w.ml || 0) > 0).map((w) => w.date),
      ...meals.map((m) => m.date),
      ...quranLogs.map((q) => q.date),
      ...adhkarLogs.filter((a) => a.morningCompleted || a.eveningCompleted).map((a) => a.date),
      ...hadithLogs.map((h) => h.date),
    ]);

    const globalActiveDates = Array.from(new Set([
      ...pastHabitLogs,
      ...pastStudies,
      ...pastWorkouts,
      ...pastTimeLogs,
      ...pastJournals,
      ...pastSalahLogs,
      ...pastWaterLogs,
      ...pastMeals,
      ...pastQuranLogs,
      ...pastAdhkarLogs,
      ...pastHadithLogs,
      ...Array.from(allCompletedDatesToday),
    ])).sort((a, b) => (a < b ? 1 : -1));

    const todayDateStr = date;
    const isSecuredToday = globalActiveDates.includes(todayDateStr);

    // Filter to dates up to todayDateStr to prevent scheduled/future records from zeroing streak
    const pastOrTodayActiveDates = globalActiveDates.filter((d) => d <= todayDateStr);

    let globalStreak = 0;

    if (pastOrTodayActiveDates.length > 0) {
      const mostRecent = pastOrTodayActiveDates[0];
      const diffFromToday = getDaysDiff(todayDateStr, mostRecent);

      if (diffFromToday === 0 || diffFromToday === 1) {
        globalStreak = 1;
        for (let i = 0; i < pastOrTodayActiveDates.length - 1; i++) {
          const stepDiff = getDaysDiff(pastOrTodayActiveDates[i], pastOrTodayActiveDates[i + 1]);
          if (stepDiff === 1) {
            globalStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Fallback prompt if database is empty
    const fallbackPrompt = {
      category: 'Self-Growth',
      question: 'What is one intentional choice you made today that your future self will thank you for?',
    };

    res.json({
      date,
      userGoals: {
        dailyCalorieGoal: calorieGoal,
        weightGoal: req.user.weightGoal || 70,
        screenTimeGoalMinutes: req.user.screenTimeGoalMinutes || 120,
        currency: (req.user.currency || 'USD').toUpperCase(),
      },
      summary: {
        journal: journal || null,
        prompt: prompts[0] || fallbackPrompt,
        streak: {
          currentStreak: globalStreak,
          isSecuredToday,
          activeDatesCount: globalActiveDates.length,
          todayActionsCount: allCompletedDatesToday.size,
        },
        time: {
          totalMinutes: timeMinutesTotal,
          byCategory: timeByCategory,
          count: timeLogs.length,
        },
        study: {
          totalMinutes: studies.reduce((sum, s) => sum + s.durationMinutes, 0),
          sessionsCount: studies.length,
        },
        calories: {
          consumed: totalCaloriesIn,
          intake: totalCaloriesIn,
          burned: totalCaloriesBurned,
          net: netCalories,
          remaining: remainingCalories,
          protein: totalProtein,
          goal: calorieGoal,
        },
        fitness: {
          caloriesBurned: totalCaloriesBurned,
          workoutsCount: workouts.length,
        },
        salah: {
          completedCount: salahCompletedCount,
          total: 5,
          logs: salahLogs,
          prayerMap: salahMap,
        },
        finance: {
          expensesToday,
          expensesMonth,
          incomeToday,
          currency: (req.user.currency || 'USD').toUpperCase(),
        },
        habits: {
          activeCount: habits.length,
          completedTodayCount: habitsCompletedToday,
        },
        goalsCount: goals.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch dashboard summary' });
  }
};
