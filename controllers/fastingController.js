import { IntermittentFast } from '../models/IntermittentFast.js';

const getOrCreateFastingRecord = async (userId) => {
  let doc = await IntermittentFast.findOne({ userId });
  if (!doc) {
    doc = await IntermittentFast.create({
      userId,
      activeState: {
        isActive: false,
        startTime: null,
        protocolId: '16:8',
        targetHours: 16,
      },
      stats: {
        completedCount: 0,
        partialCount: 0,
        earlyEndedCount: 0,
        streak: 0,
        totalHoursFasted: 0,
        lastCompletedDate: null,
      },
      history: [],
    });
  }
  return doc;
};

// @desc    Get user's live fasting timer state & cumulative stats
// @route   GET /api/fasting
// @access  Private
export const getFastingData = async (req, res) => {
  try {
    const doc = await getOrCreateFastingRecord(req.user._id);
    return res.json({
      activeState: doc.activeState,
      stats: doc.stats,
      history: doc.history || [],
    });
  } catch (error) {
    console.error('Error fetching fasting data:', error);
    return res.status(500).json({ message: error.message || 'Failed to fetch fasting data' });
  }
};

// @desc    Update live active fasting timer state (start, cancel, reset timer)
// @route   PUT /api/fasting/state
// @access  Private
export const updateActiveState = async (req, res) => {
  try {
    const { isActive, startTime, protocolId, targetHours } = req.body;
    const doc = await getOrCreateFastingRecord(req.user._id);

    if (isActive !== undefined) doc.activeState.isActive = Boolean(isActive);
    if (startTime !== undefined) doc.activeState.startTime = startTime;
    if (protocolId !== undefined) doc.activeState.protocolId = protocolId;
    if (targetHours !== undefined) doc.activeState.targetHours = Number(targetHours) || 16;

    await doc.save();
    return res.json({
      activeState: doc.activeState,
      stats: doc.stats,
      history: doc.history || [],
    });
  } catch (error) {
    console.error('Error updating fasting state:', error);
    return res.status(500).json({ message: error.message || 'Failed to update fasting state' });
  }
};

// @desc    Record an ended fast, update statistics, append to history, and reset active timer
// @route   POST /api/fasting/record
// @access  Private
export const recordEndedFast = async (req, res) => {
  try {
    const { protocolId = '16:8', targetHours = 16, startTime, endTime = new Date().toISOString() } = req.body;
    const doc = await getOrCreateFastingRecord(req.user._id);

    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
    const targetSeconds = Math.max(1, (Number(targetHours) || 16) * 3600);

    const percentCompleted = Math.round((elapsedSeconds / targetSeconds) * 100);
    const actualHours = Math.round((elapsedSeconds / 3600) * 10) / 10;

    let status = 'early_ended';
    let statusLabel = 'Early Ended (<20%)';

    if (percentCompleted >= 80) {
      status = 'completed';
      statusLabel = 'Completed IF (80%+)';
    } else if (percentCompleted >= 20) {
      status = 'partial';
      statusLabel = 'Partial Fast (20%–80%)';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let newStreak = doc.stats.streak || 0;

    if (status === 'completed') {
      doc.stats.completedCount = (doc.stats.completedCount || 0) + 1;

      if (doc.stats.lastCompletedDate) {
        const lastDate = new Date(doc.stats.lastCompletedDate);
        const today = new Date(todayStr);
        const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      doc.stats.lastCompletedDate = todayStr;
      doc.stats.streak = newStreak;
    } else if (status === 'partial') {
      doc.stats.partialCount = (doc.stats.partialCount || 0) + 1;
    } else {
      doc.stats.earlyEndedCount = (doc.stats.earlyEndedCount || 0) + 1;
    }

    doc.stats.totalHoursFasted = Math.round(((doc.stats.totalHoursFasted || 0) + actualHours) * 10) / 10;

    const logEntry = {
      id: `fast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: todayStr,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      protocolId,
      targetHours: Number(targetHours) || 16,
      actualHours,
      percentCompleted,
      status,
      statusLabel,
    };

    doc.history = [logEntry, ...(doc.history || [])].slice(0, 50);

    // Turn off active state
    doc.activeState.isActive = false;
    doc.activeState.startTime = null;

    await doc.save();

    return res.json({
      status,
      statusLabel,
      actualHours,
      percentCompleted,
      activeState: doc.activeState,
      stats: doc.stats,
      entry: logEntry,
      history: doc.history,
    });
  } catch (error) {
    console.error('Error recording ended fast:', error);
    return res.status(500).json({ message: error.message || 'Failed to record ended fast' });
  }
};

// @desc    Manually adjust completed, partial, or early_ended counters
// @route   POST /api/fasting/adjust
// @access  Private
export const adjustFastingCount = async (req, res) => {
  try {
    const { type, delta = 1 } = req.body;
    const doc = await getOrCreateFastingRecord(req.user._id);

    if (type === 'completed') {
      doc.stats.completedCount = Math.max(0, (doc.stats.completedCount || 0) + delta);
      if (delta > 0 && doc.stats.streak === 0) {
        doc.stats.streak = 1;
      }
    } else if (type === 'partial') {
      doc.stats.partialCount = Math.max(0, (doc.stats.partialCount || 0) + delta);
    } else if (type === 'early_ended') {
      doc.stats.earlyEndedCount = Math.max(0, (doc.stats.earlyEndedCount || 0) + delta);
    }

    await doc.save();
    return res.json({
      activeState: doc.activeState,
      stats: doc.stats,
      history: doc.history || [],
    });
  } catch (error) {
    console.error('Error adjusting fasting count:', error);
    return res.status(500).json({ message: error.message || 'Failed to adjust count' });
  }
};

// @desc    Reset all fasting stats and active timer
// @route   POST /api/fasting/reset
// @access  Private
export const resetFastingData = async (req, res) => {
  try {
    const doc = await getOrCreateFastingRecord(req.user._id);
    doc.activeState = {
      isActive: false,
      startTime: null,
      protocolId: '16:8',
      targetHours: 16,
    };
    doc.stats = {
      completedCount: 0,
      partialCount: 0,
      earlyEndedCount: 0,
      streak: 0,
      totalHoursFasted: 0,
      lastCompletedDate: null,
    };
    doc.history = [];

    await doc.save();
    return res.json({
      activeState: doc.activeState,
      stats: doc.stats,
      history: [],
    });
  } catch (error) {
    console.error('Error resetting fasting data:', error);
    return res.status(500).json({ message: error.message || 'Failed to reset fasting data' });
  }
};

// @desc    Sync / merge client local storage with server state (e.g. after login)
// @route   POST /api/fasting/sync
// @access  Private
export const syncFastingData = async (req, res) => {
  try {
    const { activeState, stats, history } = req.body;
    const doc = await getOrCreateFastingRecord(req.user._id);

    // If server doc is empty but client has stats, populate server doc
    const isServerEmpty = !doc.activeState.isActive && doc.stats.completedCount === 0 && doc.stats.totalHoursFasted === 0;

    if (isServerEmpty && stats && (stats.completedCount > 0 || stats.totalHoursFasted > 0 || activeState?.isActive)) {
      if (activeState) doc.activeState = { ...doc.activeState.toObject(), ...activeState };
      if (stats) doc.stats = { ...doc.stats.toObject(), ...stats };
      if (Array.isArray(history) && history.length > 0) doc.history = history.slice(0, 50);
      await doc.save();
    }

    return res.json({
      activeState: doc.activeState,
      stats: doc.stats,
      history: doc.history || [],
    });
  } catch (error) {
    console.error('Error syncing fasting data:', error);
    return res.status(500).json({ message: error.message || 'Failed to sync fasting data' });
  }
};
