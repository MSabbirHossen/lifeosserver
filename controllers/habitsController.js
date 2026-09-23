import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';

// Helper: Calculate difference in calendar days between two YYYY-MM-DD strings using UTC
const parseYMD = (str) => {
  if (!str || typeof str !== 'string') return 0;
  const parts = str.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return 0;
  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
};

const getDaysDifference = (d1Str, d2Str) => {
  const t1 = parseYMD(d1Str);
  const t2 = parseYMD(d2Str);
  return Math.round((t1 - t2) / (1000 * 3600 * 24));
};

// Helper: Compute current streak and best streak from completed log dates sorted DESC
const calculateStreak = (logDates, todayStr) => {
  if (!logDates || logDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Remove duplicates and ensure sorted DESC
  const uniqueSortedDates = Array.from(new Set(logDates)).sort((a, b) => (a < b ? 1 : -1));

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Compute best streak overall across all completed dates
  if (uniqueSortedDates.length > 0) {
    tempStreak = 1;
    bestStreak = 1;

    for (let i = 0; i < uniqueSortedDates.length - 1; i++) {
      const diff = getDaysDifference(uniqueSortedDates[i], uniqueSortedDates[i + 1]);
      if (diff === 1) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
  }

  // Compute current streak (filter out future dates to avoid timezone/scheduling skew)
  const validDates = uniqueSortedDates.filter((d) => d <= todayStr);

  if (validDates.length > 0) {
    const mostRecent = validDates[0];
    const diffFromToday = getDaysDifference(todayStr, mostRecent);

    if (diffFromToday === 0 || diffFromToday === 1) {
      currentStreak = 1;
      for (let i = 0; i < validDates.length - 1; i++) {
        const diff = getDaysDifference(validDates[i], validDates[i + 1]);
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }
  } else {
    currentStreak = 0;
  }

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  return { currentStreak, bestStreak };
};

// @desc    Get user habits with completion status for selected date and calculated streaks
// @route   GET /api/habits
// @access  Private
export const getHabits = async (req, res) => {
  try {
    const { date, includeArchived } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const filter = { userId: req.user._id };
    if (!includeArchived || includeArchived !== 'true') {
      filter.archived = false;
    }

    const habits = await Habit.find(filter).sort({ createdAt: 1 });

    // Fetch all logs for this user to compute streaks & current date completion
    const habitIds = habits.map((h) => h._id);
    const logs = await HabitLog.find({
      userId: req.user._id,
      habitId: { $in: habitIds },
      completed: true,
    }).sort({ date: -1 });

    // Group logs by habitId
    const logsByHabit = {};
    logs.forEach((log) => {
      const hId = log.habitId.toString();
      if (!logsByHabit[hId]) logsByHabit[hId] = [];
      logsByHabit[hId].push(log);
    });

    const enrichedHabits = habits.map((habit) => {
      const hId = habit._id.toString();
      const habitLogs = logsByHabit[hId] || [];
      const completedDates = habitLogs.map((l) => l.date);

      const { currentStreak, bestStreak } = calculateStreak(completedDates, targetDate);
      const isCompletedToday = completedDates.includes(targetDate);
      const todayLog = habitLogs.find((l) => l.date === targetDate);

      // Determine days since last completed (for incomplete habits)
      const lastCompletedDate = completedDates.length > 0 ? completedDates[0] : null;
      let daysSinceLastCompleted = 0;
      if (isCompletedToday) {
        daysSinceLastCompleted = 0;
      } else if (lastCompletedDate) {
        daysSinceLastCompleted = Math.max(1, getDaysDifference(targetDate, lastCompletedDate));
      } else {
        // Never completed: calculate days since creation + 1000 so never-completed rank as most incomplete
        const createdDateStr = habit.createdAt
          ? new Date(habit.createdAt).toISOString().split('T')[0]
          : targetDate;
        daysSinceLastCompleted = Math.max(1, getDaysDifference(targetDate, createdDateStr)) + 1000;
      }

      return {
        ...habit.toObject(),
        isCompletedToday,
        todayValue: todayLog ? todayLog.value : 0,
        currentStreak,
        bestStreak,
        totalCompletions: completedDates.length,
        lastCompletedDate,
        daysSinceLastCompleted,
      };
    });

    // Auto-sort habits: incomplete habits first (ordered by daysSinceLastCompleted DESC),
    // and completed habits automatically sorted to the last of the list for the day
    enrichedHabits.sort((a, b) => {
      if (!a.isCompletedToday && b.isCompletedToday) return -1;
      if (a.isCompletedToday && !b.isCompletedToday) return 1;

      if (!a.isCompletedToday && !b.isCompletedToday) {
        if (b.daysSinceLastCompleted !== a.daysSinceLastCompleted) {
          return b.daysSinceLastCompleted - a.daysSinceLastCompleted;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return (b.currentStreak || 0) - (a.currentStreak || 0);
    });

    res.json(enrichedHabits);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch habits' });
  }
};

// @desc    Create a new habit
// @route   POST /api/habits
// @access  Private
export const createHabit = async (req, res) => {
  try {
    const { name, category, targetFrequency, customDays, targetValue, unit, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = await Habit.create({
      userId: req.user._id,
      name: name.trim(),
      category: category || 'Productivity',
      description: description?.trim() || '',
      targetFrequency: targetFrequency || 'daily',
      customDays: Array.isArray(customDays) ? customDays : [],
      targetValue: targetValue || 1,
      unit: unit || '',
    });

    res.status(201).json({
      ...habit.toObject(),
      isCompletedToday: false,
      currentStreak: 0,
      bestStreak: 0,
      totalCompletions: 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create habit' });
  }
};

// @desc    Update a habit
// @route   PUT /api/habits/:id
// @access  Private
export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const { name, category, targetFrequency, customDays, targetValue, unit, description, archived } = req.body;

    if (name !== undefined) habit.name = name;
    if (category !== undefined) habit.category = category;
    if (description !== undefined) habit.description = description;
    if (targetFrequency !== undefined) habit.targetFrequency = targetFrequency;
    if (customDays !== undefined) habit.customDays = Array.isArray(customDays) ? customDays : [];
    if (targetValue !== undefined) habit.targetValue = targetValue;
    if (unit !== undefined) habit.unit = unit;
    if (archived !== undefined) habit.archived = archived;

    const updated = await habit.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update habit' });
  }
};

// @desc    Delete a habit & associated logs
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Delete associated logs
    await HabitLog.deleteMany({ habitId: req.params.id, userId: req.user._id });

    res.json({ message: 'Habit deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete habit' });
  }
};

// @desc    Toggle completion for a habit on a specific date
// @route   POST /api/habits/:id/log
// @access  Private
export const toggleHabitLog = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const { date, value } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const existingLog = await HabitLog.findOne({
      userId: req.user._id,
      habitId: habit._id,
      date: targetDate,
    });

    let isCompletedNow = false;

    if (existingLog) {
      if (existingLog.completed) {
        // Toggle OFF: delete log
        await HabitLog.deleteOne({ _id: existingLog._id });
        isCompletedNow = false;
      } else {
        // Toggle ON
        existingLog.completed = true;
        existingLog.value = value || habit.targetValue || 1;
        await existingLog.save();
        isCompletedNow = true;
      }
    } else {
      // Create new completion log
      await HabitLog.create({
        userId: req.user._id,
        habitId: habit._id,
        date: targetDate,
        completed: true,
        value: value || habit.targetValue || 1,
      });
      isCompletedNow = true;
    }

    // Recalculate streak
    const logs = await HabitLog.find({
      userId: req.user._id,
      habitId: habit._id,
      completed: true,
    }).sort({ date: -1 });

    const completedDates = logs.map((l) => l.date);
    const { currentStreak, bestStreak } = calculateStreak(completedDates, targetDate);

    res.json({
      habitId: habit._id,
      date: targetDate,
      isCompletedToday: isCompletedNow,
      currentStreak,
      bestStreak,
      totalCompletions: completedDates.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to toggle habit log' });
  }
};

// @desc    Get GitHub-style heatmap data (53 weeks rolling, specific year, or lifetime)
// @route   GET /api/habits/heatmap
// @access  Private
export const getHabitHeatmap = async (req, res) => {
  try {
    const { habitId, weeks = 53, year } = req.query;

    let dates = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (year && !isNaN(parseInt(year, 10))) {
      // Full Calendar Year (Jan 1 to Dec 31) aligned to Sunday start and Saturday end
      const targetYear = parseInt(year, 10);
      const janFirst = new Date(targetYear, 0, 1);
      const decLast = new Date(targetYear, 11, 31);

      // Start on Sunday of Jan 1 week
      const startDate = new Date(janFirst);
      startDate.setDate(janFirst.getDate() - janFirst.getDay());

      // End on Saturday of Dec 31 week
      const endDate = new Date(decLast);
      endDate.setDate(decLast.getDate() + (6 - decLast.getDay()));

      const cur = new Date(startDate);
      while (cur <= endDate) {
        dates.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      // Rolling N weeks (default 53 weeks = full rolling year) ending today's Saturday
      const numWeeks = parseInt(weeks, 10) || 53;
      const currentDayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat
      const currentWeekSunday = new Date(today);
      currentWeekSunday.setDate(today.getDate() - currentDayOfWeek);

      const startDate = new Date(currentWeekSunday);
      startDate.setDate(startDate.getDate() - (numWeeks - 1) * 7);

      for (let w = 0; w < numWeeks; w++) {
        for (let d = 0; d < 7; d++) {
          const dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + w * 7 + d);
          dates.push(dayDate.toISOString().split('T')[0]);
        }
      }
    }

    const filter = {
      userId: req.user._id,
      date: { $gte: dates[0], $lte: dates[dates.length - 1] },
      completed: true,
    };

    if (habitId && habitId !== 'all') {
      filter.habitId = habitId;
    }

    const [logs, allUserLogs, activeHabitsCount] = await Promise.all([
      HabitLog.find(filter),
      HabitLog.find({ userId: req.user._id, completed: true }).select('date').sort({ date: -1 }),
      Habit.countDocuments({ userId: req.user._id, archived: false }),
    ]);

    // Group logs count by date
    const countsByDate = {};
    logs.forEach((log) => {
      countsByDate[log.date] = (countsByDate[log.date] || 0) + 1;
    });

    // Compute lifetime metrics
    const allUniqueDates = Array.from(new Set(allUserLogs.map((l) => l.date)));
    const totalLifetimeCompletions = allUserLogs.length;
    const totalLifetimeActiveDays = allUniqueDates.length;

    // Available years from logs, plus current year
    const yearSet = new Set(allUniqueDates.map((d) => parseInt(d.split('-')[0], 10)));
    yearSet.add(today.getFullYear());
    const availableYears = Array.from(yearSet).sort((a, b) => b - a);

    // Lifetime best streak
    const { bestStreak: allTimeBestStreak } = calculateStreak(allUniqueDates, todayStr);

    const heatmapData = dates.map((d) => {
      const completedCount = countsByDate[d] || 0;
      let level = 0;

      if (completedCount > 0) {
        if (activeHabitsCount === 0 || completedCount === 1) level = 1;
        else if (completedCount <= Math.ceil(activeHabitsCount * 0.4)) level = 2;
        else if (completedCount <= Math.ceil(activeHabitsCount * 0.75)) level = 3;
        else level = 4;
      }

      return {
        date: d,
        count: completedCount,
        level, // 0 = none, 1 = low, 2 = med, 3 = high, 4 = max
      };
    });

    res.json({
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      totalActiveHabits: activeHabitsCount,
      heatmap: heatmapData,
      lifetimeStats: {
        totalCompletions: totalLifetimeCompletions,
        totalActiveDays: totalLifetimeActiveDays,
        bestStreak: allTimeBestStreak,
        availableYears,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch heatmap' });
  }
};
