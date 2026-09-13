import { StudySession } from '../models/StudySession.js';
import { StudyTopic } from '../models/StudyTopic.js';

export const getStudySessions = async (req, res) => {
  try {
    const { date, from, to } = req.query;
    const filter = { userId: req.user._id };

    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const sessions = await StudySession.find(filter)
      .populate('topicId', 'title subject completedChapters totalChapters status')
      .sort({ date: -1, createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch study sessions' });
  }
};

export const createStudySession = async (req, res) => {
  try {
    const { date, subject, resource, durationMinutes, duration, startTime, endTime, topicId, progressPercent, goalId, habitId, notes } = req.body;
    const finalDuration = durationMinutes !== undefined ? durationMinutes : duration;
    if (!date || !finalDuration) {
      return res.status(400).json({ message: 'Date and duration are required' });
    }

    let finalSubject = subject?.trim();
    if (topicId) {
      const topicDoc = await StudyTopic.findOne({ _id: topicId, userId: req.user._id });
      if (topicDoc) {
        if (!finalSubject) finalSubject = topicDoc.subject;
        if (topicDoc.status === 'backlog') {
          topicDoc.status = 'in_progress';
          await topicDoc.save();
        }
      }
    }

    if (!finalSubject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const session = await StudySession.create({
      userId: req.user._id,
      date,
      subject: finalSubject,
      resource: resource?.trim() || '',
      durationMinutes: Number(finalDuration),
      startTime: startTime || '',
      endTime: endTime || '',
      topicId: topicId || undefined,
      progressPercent: Number(progressPercent) || 0,
      goalId: goalId || undefined,
      habitId: habitId || undefined,
      notes: notes?.trim() || '',
    });

    const populated = await StudySession.findById(session._id).populate('topicId', 'title subject completedChapters totalChapters status');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log study session' });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { userId: req.user._id };
    if (q) {
      filter.subject = { $regex: q, $options: 'i' };
    }

    const sessionSubjects = await StudySession.distinct('subject', filter);
    const topicSubjects = await StudyTopic.distinct('subject', filter);
    const combined = Array.from(new Set([...sessionSubjects, ...topicSubjects]));
    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch subjects' });
  }
};

export const updateStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ message: 'Study session not found' });

    const { date, subject, resource, durationMinutes, duration, startTime, endTime, topicId, progressPercent, goalId, habitId, notes } = req.body;

    if (date) session.date = date;
    if (subject) session.subject = subject.trim();
    if (resource !== undefined) session.resource = resource.trim();
    const finalDuration = durationMinutes !== undefined ? durationMinutes : duration;
    if (finalDuration !== undefined) session.durationMinutes = Number(finalDuration);
    if (startTime !== undefined) session.startTime = startTime;
    if (endTime !== undefined) session.endTime = endTime;
    if (topicId !== undefined) session.topicId = topicId || undefined;
    if (progressPercent !== undefined) session.progressPercent = Number(progressPercent) || 0;
    if (goalId !== undefined) session.goalId = goalId || undefined;
    if (habitId !== undefined) session.habitId = habitId || undefined;
    if (notes !== undefined) session.notes = notes.trim();

    await session.save();
    const populated = await StudySession.findById(session._id).populate('topicId', 'title subject completedChapters totalChapters status');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update study session' });
  }
};

export const deleteStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ message: 'Study session not found' });
    res.json({ message: 'Study session deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete session' });
  }
};

// --- Study Backlog / Topics Endpoints ---

export const getStudyTopics = async (req, res) => {
  try {
    const { subject, status } = req.query;
    const filter = { userId: req.user._id };
    if (subject && subject !== 'all') filter.subject = subject;
    if (status && status !== 'all') filter.status = status;

    const topics = await StudyTopic.find(filter).sort({ createdAt: -1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch study topics' });
  }
};

export const createStudyTopic = async (req, res) => {
  try {
    const { subject, title, status, totalChapters, completedChapters, subtopics, targetDate, linkedGoalId, notes } = req.body;
    if (!subject || !title) {
      return res.status(400).json({ message: 'Subject and topic/chapter title are required' });
    }

    const total = Math.max(1, Number(totalChapters) || 1);
    const completed = Math.max(0, Math.min(total, Number(completedChapters) || 0));
    let initialStatus = status || 'backlog';
    if (completed >= total) initialStatus = 'completed';
    else if (completed > 0 && initialStatus === 'backlog') initialStatus = 'in_progress';

    // Format subtopics if passed as array of strings or objects
    let formattedSubtopics = [];
    if (Array.isArray(subtopics)) {
      formattedSubtopics = subtopics.map((st) =>
        typeof st === 'string' ? { title: st.trim(), completed: false } : { title: st.title?.trim() || '', completed: !!st.completed }
      ).filter((st) => st.title.length > 0);
    }

    const topic = await StudyTopic.create({
      userId: req.user._id,
      subject: subject.trim(),
      title: title.trim(),
      status: initialStatus,
      totalChapters: total,
      completedChapters: completed,
      subtopics: formattedSubtopics,
      targetDate: targetDate || '',
      linkedGoalId: linkedGoalId || undefined,
      notes: notes?.trim() || '',
    });

    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create study topic' });
  }
};

export const updateStudyTopic = async (req, res) => {
  try {
    const topic = await StudyTopic.findOne({ _id: req.params.id, userId: req.user._id });
    if (!topic) return res.status(404).json({ message: 'Study topic not found' });

    const { subject, title, status, totalChapters, completedChapters, subtopics, targetDate, linkedGoalId, notes, deltaChapter } = req.body;

    if (subject) topic.subject = subject.trim();
    if (title) topic.title = title.trim();
    if (targetDate !== undefined) topic.targetDate = targetDate;
    if (linkedGoalId !== undefined) topic.linkedGoalId = linkedGoalId || undefined;
    if (notes !== undefined) topic.notes = notes.trim();

    if (totalChapters !== undefined) {
      topic.totalChapters = Math.max(1, Number(totalChapters) || 1);
    }

    // Quick stepper delta support
    if (deltaChapter !== undefined) {
      topic.completedChapters = Math.max(0, Math.min(topic.totalChapters, topic.completedChapters + Number(deltaChapter)));
    } else if (completedChapters !== undefined) {
      topic.completedChapters = Math.max(0, Math.min(topic.totalChapters, Number(completedChapters) || 0));
    }

    if (Array.isArray(subtopics)) {
      topic.subtopics = subtopics.map((st) =>
        typeof st === 'string' ? { title: st.trim(), completed: false } : { title: st.title?.trim() || '', completed: !!st.completed }
      ).filter((st) => st.title.length > 0);
    }

    // Automatically update status based on chapter completion
    if (topic.completedChapters >= topic.totalChapters) {
      topic.status = 'completed';
    } else if (topic.completedChapters > 0 && (!status || status === 'backlog')) {
      topic.status = 'in_progress';
    } else if (status) {
      topic.status = status;
    }

    await topic.save();
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update study topic' });
  }
};

export const deleteStudyTopic = async (req, res) => {
  try {
    const topic = await StudyTopic.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!topic) return res.status(404).json({ message: 'Study topic not found' });
    res.json({ message: 'Study topic deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete study topic' });
  }
};
