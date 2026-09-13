import { TimeLog } from '../models/TimeLog.js';

// Helper to compute duration in minutes from HH:mm time strings
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return null;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let minutes = endH * 60 + endM - (startH * 60 + startM);
  if (minutes < 0) minutes += 24 * 60; // handle overnight blocks
  return minutes;
};

// Helper to detect if two time ranges [s1, e1] and [s2, e2] overlap
const checkOverlap = (s1, e1, s2, e2) => {
  if (!s1 || !e1 || !s2 || !e2) return false;
  return s1 < e2 && s2 < e1;
};

export const getTimeLogs = async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const filter = { userId: req.user._id };

    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const logs = await TimeLog.find(filter).sort({ startTime: 1, createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch time logs' });
  }
};

export const getDistinctActivities = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { userId: req.user._id };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { activity: { $regex: q, $options: 'i' } },
      ];
    }

    const titles = await TimeLog.distinct('title', filter);
    const activities = await TimeLog.distinct('activity', filter);
    const combined = Array.from(new Set([...titles, ...activities].filter(Boolean)));
    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch activities' });
  }
};

export const getTimeSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { userId: req.user._id };
    if (date) filter.date = date;

    const logs = await TimeLog.find(filter);
    const totalMinutes = logs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const byCategory = {};

    logs.forEach((l) => {
      byCategory[l.category] = (byCategory[l.category] || 0) + (l.durationMinutes || 0);
    });

    res.json({
      date,
      totalMinutes,
      byCategory,
      count: logs.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch time summary' });
  }
};

export const createTimeLog = async (req, res) => {
  try {
    const { date, category, activity, title, startTime, endTime, durationMinutes, notes } = req.body;
    const taskTitle = (title || activity || '').trim();

    if (!date || !taskTitle) {
      return res.status(400).json({ message: 'Date and task title/activity are required' });
    }

    let finalDuration = durationMinutes;
    if (startTime && endTime) {
      const computed = calculateDuration(startTime, endTime);
      if (computed !== null) finalDuration = computed;
    }

    if (!finalDuration || finalDuration <= 0) {
      return res.status(400).json({ message: 'Valid duration or start/end times are required' });
    }

    // Check for overlapping logs on the same date
    const existingLogs = await TimeLog.find({ userId: req.user._id, date });
    let hasOverlap = false;

    if (startTime && endTime) {
      hasOverlap = existingLogs.some((log) =>
        checkOverlap(startTime, endTime, log.startTime, log.endTime)
      );
    }

    const newLog = await TimeLog.create({
      userId: req.user._id,
      date,
      category: category || 'Work',
      title: taskTitle,
      activity: taskTitle,
      startTime: startTime || '',
      endTime: endTime || '',
      durationMinutes: finalDuration,
      notes: notes || '',
    });

    const responseData = newLog.toObject();
    responseData.hasOverlap = hasOverlap;

    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create time log' });
  }
};

export const updateTimeLog = async (req, res) => {
  try {
    const log = await TimeLog.findOne({ _id: req.params.id, userId: req.user._id });

    if (!log) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    const { category, activity, title, startTime, endTime, durationMinutes, notes } = req.body;

    if (category) log.category = category;
    if (title || activity) {
      log.title = (title || activity).trim();
      log.activity = (title || activity).trim();
    }
    if (startTime !== undefined) log.startTime = startTime;
    if (endTime !== undefined) log.endTime = endTime;
    if (notes !== undefined) log.notes = notes;

    if (log.startTime && log.endTime) {
      const computed = calculateDuration(log.startTime, log.endTime);
      if (computed !== null) log.durationMinutes = computed;
    } else if (durationMinutes) {
      log.durationMinutes = durationMinutes;
    }

    const updatedLog = await log.save();
    res.json(updatedLog);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update time log' });
  }
};

export const deleteTimeLog = async (req, res) => {
  try {
    const log = await TimeLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!log) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    res.json({ message: 'Time log deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete time log' });
  }
};
