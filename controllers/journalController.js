import { Journal } from '../models/Journal.js';
import { JournalPrompt } from '../models/JournalPrompt.js';
import { DEFAULT_JOURNAL_PROMPTS } from '../config/journalPrompts.js';

// Keyword dictionary for deterministic auto-tagging
const TAG_DICTIONARY = [
  { tag: '#study', keywords: ['code', 'javascript', 'react', 'study', 'python', 'learn', 'course', 'reading', 'exam'] },
  { tag: '#fitness', keywords: ['gym', 'workout', 'run', 'fitness', 'exercise', 'cardio', 'weights', 'walk', 'pushups'] },
  { tag: '#islamic', keywords: ['salah', 'quran', 'namaz', 'prayer', 'adhkar', 'hadith', 'tafsir', 'fajr', 'masjid'] },
  { tag: '#finance', keywords: ['money', 'spend', 'salary', 'budget', 'expense', 'bdt', 'usd', 'buy', 'paid'] },
  { tag: '#productivity', keywords: ['focus', 'completed', 'tasks', 'accomplished', 'goal', 'work', 'project'] },
];

const generateAutoTags = (text) => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const matchedTags = new Set();

  TAG_DICTIONARY.forEach(({ tag, keywords }) => {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      matchedTags.add(tag);
    }
  });

  return Array.from(matchedTags);
};

// @desc    Get a weighted random guided reflection prompt
// @route   GET /api/journal/prompt
// @access  Private
export const getJournalPrompt = async (req, res) => {
  try {
    let prompts = await JournalPrompt.find().sort({ lastServedAt: 1 });

    // Seed default prompts if none exist
    if (prompts.length === 0) {
      await JournalPrompt.insertMany(DEFAULT_JOURNAL_PROMPTS);
      prompts = await JournalPrompt.find().sort({ lastServedAt: 1 });
    }

    // Pick randomly from the bottom 50% (least recently served)
    const poolSize = Math.max(1, Math.ceil(prompts.length / 2));
    const pool = prompts.slice(0, poolSize);
    const selectedPrompt = pool[Math.floor(Math.random() * pool.length)];

    // Update lastServedAt
    selectedPrompt.lastServedAt = new Date();
    await selectedPrompt.save();

    res.json(selectedPrompt);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch prompt' });
  }
};

// @desc    Get journal entries for current user (with date filtering)
// @route   GET /api/journal
// @access  Private
export const getJournalEntries = async (req, res) => {
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

    const entries = await Journal.find(filter).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch journal entries' });
  }
};

// @desc    Create or upsert a journal entry for a date
// @route   POST /api/journal
// @access  Private
export const createJournalEntry = async (req, res) => {
  try {
    const {
      date,
      summary,
      moods,
      highlights,
      problemsFaced,
      gratitude,
      notesForTomorrow,
      promptQuestion,
      promptAnswer,
      photos,
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required for a journal entry' });
    }

    // Combined text for auto-tagging
    const combinedText = `
      ${summary || ''} 
      ${highlights || ''} 
      ${problemsFaced || ''} 
      ${(gratitude || []).join(' ')} 
      ${notesForTomorrow || ''} 
      ${promptAnswer || ''}
    `;
    const autoTags = generateAutoTags(combinedText);

    // Upsert entry per user and date
    let entry = await Journal.findOne({ userId: req.user._id, date });

    if (entry) {
      entry.summary = summary !== undefined ? summary : entry.summary;
      entry.moods = moods || entry.moods;
      entry.highlights = highlights !== undefined ? highlights : entry.highlights;
      entry.problemsFaced = problemsFaced !== undefined ? problemsFaced : entry.problemsFaced;
      entry.gratitude = gratitude || entry.gratitude;
      entry.notesForTomorrow = notesForTomorrow !== undefined ? notesForTomorrow : entry.notesForTomorrow;
      entry.promptQuestion = promptQuestion || entry.promptQuestion;
      entry.promptAnswer = promptAnswer !== undefined ? promptAnswer : entry.promptAnswer;
      entry.photos = photos || entry.photos;
      entry.autoTags = autoTags;
      await entry.save();
    } else {
      entry = await Journal.create({
        userId: req.user._id,
        date,
        summary,
        moods: moods || [],
        highlights: highlights || '',
        problemsFaced: problemsFaced || '',
        gratitude: gratitude || [],
        notesForTomorrow: notesForTomorrow || '',
        promptQuestion: promptQuestion || '',
        promptAnswer: promptAnswer || '',
        photos: photos || [],
        autoTags,
      });
    }

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create journal entry' });
  }
};

// @desc    Update a journal entry
// @route   PUT /api/journal/:id
// @access  Private
export const updateJournalEntry = async (req, res) => {
  try {
    const entry = await Journal.findOne({ _id: req.params.id, userId: req.user._id });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    const {
      summary,
      moods,
      highlights,
      problemsFaced,
      gratitude,
      notesForTomorrow,
      promptQuestion,
      promptAnswer,
      photos,
    } = req.body;

    if (summary !== undefined) entry.summary = summary;
    if (moods !== undefined) entry.moods = moods;
    if (highlights !== undefined) entry.highlights = highlights;
    if (problemsFaced !== undefined) entry.problemsFaced = problemsFaced;
    if (gratitude !== undefined) entry.gratitude = gratitude;
    if (notesForTomorrow !== undefined) entry.notesForTomorrow = notesForTomorrow;
    if (promptQuestion !== undefined) entry.promptQuestion = promptQuestion;
    if (promptAnswer !== undefined) entry.promptAnswer = promptAnswer;
    if (photos !== undefined) entry.photos = photos;

    const combinedText = `
      ${entry.summary} ${entry.highlights} ${entry.problemsFaced} 
      ${entry.gratitude.join(' ')} ${entry.notesForTomorrow} ${entry.promptAnswer}
    `;
    entry.autoTags = generateAutoTags(combinedText);

    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update journal entry' });
  }
};

// @desc    Delete a journal entry
// @route   DELETE /api/journal/:id
// @access  Private
export const deleteJournalEntry = async (req, res) => {
  try {
    const entry = await Journal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json({ message: 'Journal entry deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete journal entry' });
  }
};
