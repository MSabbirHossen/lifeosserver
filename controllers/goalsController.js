import { Goal } from '../models/Goal.js';
import { HabitLog } from '../models/HabitLog.js';
import { StudySession } from '../models/StudySession.js';

export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).populate('linkedHabitIds').sort({ createdAt: -1 });
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute dynamic completion progress from linked habits and study sessions
    const processedGoals = await Promise.all(
      goals.map(async (goal) => {
        const goalObj = goal.toObject();

        let habitPercent = null;
        let todayLinkedHabitsTotal = 0;
        let todayLinkedHabitsCompleted = 0;
        let todayCompletedHabitIds = [];
        let totalCompletedCount = 0;

        if (goal.linkedHabitIds && goal.linkedHabitIds.length > 0) {
          const habitIds = goal.linkedHabitIds.map((h) => h._id || h);
          todayLinkedHabitsTotal = habitIds.length;

          const completedLogs = await HabitLog.find({
            userId: req.user._id,
            habitId: { $in: habitIds },
            completed: true,
          });

          totalCompletedCount = completedLogs.length;
          const targetCompletions = goal.targetCompletions || 30;
          habitPercent = Math.min(100, Math.round((totalCompletedCount / targetCompletions) * 100));

          const todayLogs = completedLogs.filter((l) => l.date === todayStr);
          todayLinkedHabitsCompleted = todayLogs.length;
          todayCompletedHabitIds = todayLogs.map((l) => l.habitId.toString());
        }

        // Check linked study sessions
        const studySessionsCount = await StudySession.countDocuments({
          userId: req.user._id,
          goalId: goal._id,
        });

        let finalPercent = 0;
        if (goal.manualProgressPercent !== null && goal.manualProgressPercent !== undefined) {
          finalPercent = goal.manualProgressPercent;
        } else if (habitPercent !== null) {
          finalPercent = habitPercent;
        } else if (studySessionsCount > 0) {
          finalPercent = Math.min(100, studySessionsCount * 10);
        }

        goalObj.computedProgressPercent = habitPercent !== null ? habitPercent : (studySessionsCount * 10);
        goalObj.progressPercent = finalPercent;
        goalObj.todayLinkedHabitsTotal = todayLinkedHabitsTotal;
        goalObj.todayLinkedHabitsCompleted = todayLinkedHabitsCompleted;
        goalObj.todayCompletedHabitIds = todayCompletedHabitIds;
        goalObj.totalCompletedCount = totalCompletedCount;

        return goalObj;
      })
    );

    res.json(processedGoals);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch goals' });
  }
};

export const createGoal = async (req, res) => {
  try {
    const {
      title,
      type,
      category,
      description,
      linkedHabits,
      linkedHabitIds,
      targetDate,
      targetCompletions,
      manualProgressPercent,
      status,
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: 'Goal title is required' });

    const habitIds = linkedHabitIds || linkedHabits || [];

    const goal = await Goal.create({
      userId: req.user._id,
      title: title.trim(),
      type: type || 'short_term',
      category: category || 'General',
      description: description?.trim() || '',
      linkedHabitIds: habitIds,
      targetDate: targetDate || '',
      targetCompletions: targetCompletions ? Number(targetCompletions) : 30,
      manualProgressPercent: manualProgressPercent !== undefined && manualProgressPercent !== null ? Number(manualProgressPercent) : null,
      status: status || 'active',
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create goal' });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const {
      title,
      type,
      category,
      description,
      linkedHabits,
      linkedHabitIds,
      targetDate,
      targetCompletions,
      manualProgressPercent,
      status,
    } = req.body;

    if (title) goal.title = title.trim();
    if (type) goal.type = type;
    if (category) goal.category = category;
    if (description !== undefined) goal.description = description.trim();
    if (linkedHabitIds || linkedHabits) goal.linkedHabitIds = linkedHabitIds || linkedHabits;
    if (targetDate !== undefined) goal.targetDate = targetDate;
    if (targetCompletions !== undefined) goal.targetCompletions = Number(targetCompletions);
    if (manualProgressPercent !== undefined) {
      goal.manualProgressPercent = manualProgressPercent !== null ? Number(manualProgressPercent) : null;
    }
    if (status) goal.status = status;

    const updated = await goal.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update goal' });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete goal' });
  }
};
