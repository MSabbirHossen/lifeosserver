import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';

// Helper: Calculate difference in days between two YYYY-MM-DD strings
const getDaysDifference = (d1Str, d2Str) => {
  const t1 = new Date(d1Str).getTime();
  const t2 = new Date(d2Str).getTime();
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

  // Compute best streak overall
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

  // Compute current streak (must start from today or yesterday)
  const mostRecent = uniqueSortedDates[0];
  const diffFromToday = getDaysDifference(todayStr, mostRecent);

  if (diffFromToday === 0 || diffFromToday === 1) {
    currentStreak = 1;
    for (let i = 0; i < uniqueSortedDates.length - 1; i++) {
      const diff = getDaysDifference(uniqueSortedDates[i], uniqueSortedDates[i + 1]);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
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

      return {
        ...habit.toObject(),
        isCompletedToday,
        todayValue: todayLog ? todayLog.value : 0,
        currentStreak,
        bestStreak,
        totalCompletions: completedDates.length,
      };
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
    const { name, category, targetFrequency, targetValue, unit, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = await Habit.create({
      userId: req.user._id,
      name: name.trim(),
      category: category || 'Health',
      description: description?.trim() || '',
      targetFrequency: targetFrequency || 'daily',
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

    const { name, category, targetFrequency, targetValue, unit, description, archived } = req.body;

    if (name !== undefined) habit.name = name;
    if (category !== undefined) habit.category = category;
    if (description !== undefined) habit.description = description;
    if (targetFrequency !== undefined) habit.targetFrequency = targetFrequency;
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

// @desc    Get rolling 84-day (12-week) heatmap data for all or specific habit
// @route   GET /api/habits/heatmap
// @access  Private
export const getHabitHeatmap = async (req, res) => {
  try {
    const { habitId, weeks = 12 } = req.query;
    const totalDays = parseInt(weeks, 10) * 7;

    // Generate date array for last N days ending today
    const dates = [];
    const today = new Date();

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const filter = {
      userId: req.user._id,
      date: { $gte: dates[0], $lte: dates[dates.length - 1] },
      completed: true,
    };

    if (habitId && habitId !== 'all') {
      filter.habitId = habitId;
    }

    const logs = await HabitLog.find(filter);

    // Group logs count by date
    const countsByDate = {};
    logs.forEach((log) => {
      countsByDate[log.date] = (countsByDate[log.date] || 0) + 1;
    });

    const activeHabitsCount = await Habit.countDocuments({
      userId: req.user._id,
      archived: false,
    });

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
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch heatmap' });
  }
};
