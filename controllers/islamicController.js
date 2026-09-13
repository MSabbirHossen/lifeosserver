import { SalahLog } from '../models/SalahLog.js';
import { SalahVow } from '../models/SalahVow.js';
import { QuranLog } from '../models/QuranLog.js';
import { AdhkarLog } from '../models/AdhkarLog.js';
import { HadithLog } from '../models/HadithLog.js';
import { QadaLog } from '../models/QadaLog.js';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];

// --- Daily 5 Salah ---

export const getSalahLogs = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date parameter required' });

    const logs = await SalahLog.find({ userId: req.user._id, date });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch salah logs' });
  }
};

export const logSalah = async (req, res) => {
  try {
    const { date, salah, prayerName, status } = req.body;
    const name = prayerName || salah;
    if (!date || !name || !status) {
      return res.status(400).json({ message: 'Date, prayer name, and status are required' });
    }

    const log = await SalahLog.findOneAndUpdate(
      { userId: req.user._id, date, salah: name },
      { status },
      { new: true, upsert: true }
    );

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log salah' });
  }
};

export const getSalahSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const allLogs = await SalahLog.find({ userId: req.user._id });
    const todayLogs = date ? await SalahLog.find({ userId: req.user._id, date }) : [];

    const expected = 5;
    const completed = todayLogs.filter((l) => l.status === 'onTime' || l.status === 'jamaah' || l.status === 'late' || l.status === 'qada').length;
    const remaining = Math.max(0, expected - completed);

    const counts = {
      onTime: allLogs.filter((l) => l.status === 'onTime').length,
      jamaah: allLogs.filter((l) => l.status === 'jamaah').length,
      late: allLogs.filter((l) => l.status === 'late').length,
      missed: allLogs.filter((l) => l.status === 'missed').length,
      qada: allLogs.filter((l) => l.status === 'qada').length,
    };

    res.json({
      expected,
      completed,
      remaining,
      counts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch salah summary' });
  }
};

// --- Qada (Missing & Make-up) Prayers ---

export const getQadaLogs = async (req, res) => {
  try {
    let qadaRecords = await QadaLog.find({ userId: req.user._id });

    // Initialize all 5 prayers if not existing
    if (qadaRecords.length < 5) {
      for (const p of PRAYERS) {
        if (!qadaRecords.some((q) => q.prayerName === p)) {
          await QadaLog.create({ userId: req.user._id, prayerName: p, totalOwed: 0, totalCompleted: 0 });
        }
      }
      qadaRecords = await QadaLog.find({ userId: req.user._id });
    }

    res.json(qadaRecords);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch Qada logs' });
  }
};

export const updateQada = async (req, res) => {
  try {
    const { prayerName, prayers, totalOwed, incrementCompleted, setCompleted } = req.body;

    // Support batch update if prayerName is 'All' or if array of prayers is passed
    if (prayerName === 'All' || Array.isArray(prayers) || Array.isArray(prayerName)) {
      const targets = Array.isArray(prayers)
        ? prayers
        : Array.isArray(prayerName)
        ? prayerName
        : ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];

      const updatedRecords = [];
      for (const p of targets) {
        let record = await QadaLog.findOne({ userId: req.user._id, prayerName: p });
        if (!record) {
          record = new QadaLog({ userId: req.user._id, prayerName: p, totalOwed: 0, totalCompleted: 0 });
        }
        if (totalOwed !== undefined) record.totalOwed = Math.max(0, Number(totalOwed));
        if (incrementCompleted) record.totalCompleted = Math.max(0, record.totalCompleted + Number(incrementCompleted));
        if (setCompleted !== undefined) record.totalCompleted = Math.max(0, Number(setCompleted));
        await record.save();
        updatedRecords.push(record);
      }
      return res.json(updatedRecords);
    }

    if (!prayerName) return res.status(400).json({ message: 'Prayer name is required' });

    let record = await QadaLog.findOne({ userId: req.user._id, prayerName });
    if (!record) {
      record = new QadaLog({ userId: req.user._id, prayerName, totalOwed: 0, totalCompleted: 0 });
    }

    if (totalOwed !== undefined) record.totalOwed = Math.max(0, Number(totalOwed));
    if (incrementCompleted) record.totalCompleted = Math.max(0, record.totalCompleted + Number(incrementCompleted));
    if (setCompleted !== undefined) record.totalCompleted = Math.max(0, Number(setCompleted));

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update Qada record' });
  }
};

// --- Hadith Logs ---

export const getHadithLogs = async (req, res) => {
  try {
    const hadiths = await HadithLog.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 });
    res.json(hadiths);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch hadith logs' });
  }
};

export const createHadithLog = async (req, res) => {
  try {
    const { date, text, narrator, reference, bookRef, reflection } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Hadith text is required' });

    const hadith = await HadithLog.create({
      userId: req.user._id,
      date: date || new Date().toISOString().split('T')[0],
      text: text.trim(),
      narrator: narrator?.trim() || '',
      reference: (reference !== undefined ? reference : bookRef)?.trim() || '',
      reflection: reflection?.trim() || '',
    });

    res.status(201).json(hadith);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log hadith' });
  }
};

export const updateHadithLog = async (req, res) => {
  try {
    const hadith = await HadithLog.findOne({ _id: req.params.id, userId: req.user._id });
    if (!hadith) return res.status(404).json({ message: 'Hadith log not found' });

    const { date, text, narrator, reference, bookRef, reflection } = req.body;
    if (date) hadith.date = date;
    if (text) hadith.text = text.trim();
    if (narrator !== undefined) hadith.narrator = narrator.trim();
    const ref = reference !== undefined ? reference : bookRef;
    if (ref !== undefined) hadith.reference = ref.trim();
    if (reflection !== undefined) hadith.reflection = reflection.trim();

    await hadith.save();
    res.json(hadith);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update hadith' });
  }
};

export const deleteHadithLog = async (req, res) => {
  try {
    const hadith = await HadithLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!hadith) return res.status(404).json({ message: 'Hadith log not found' });
    res.json({ message: 'Hadith deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete hadith' });
  }
};

// --- Vows (Nazr & Commitments) ---

export const getVows = async (req, res) => {
  try {
    const vows = await SalahVow.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(vows);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch vows' });
  }
};

export const createVow = async (req, res) => {
  try {
    const { description, targetDate, title, relatedSalah, notes } = req.body;
    const vowTitle = description?.trim() || title?.trim();
    if (!vowTitle) return res.status(400).json({ message: 'Vow description is required' });

    const vow = await SalahVow.create({
      userId: req.user._id,
      title: vowTitle,
      relatedSalah: relatedSalah || 'All',
      startDate: targetDate || new Date().toISOString().split('T')[0],
      targetDate: targetDate || '',
      notes: notes?.trim() || '',
    });

    res.status(201).json(vow);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create vow' });
  }
};

export const updateVow = async (req, res) => {
  try {
    const vow = await SalahVow.findOne({ _id: req.params.id, userId: req.user._id });
    if (!vow) return res.status(404).json({ message: 'Vow not found' });

    const { title, description, targetDate, relatedSalah, notes, isCompleted, status } = req.body;
    const vowTitle = title?.trim() || description?.trim();
    if (vowTitle) vow.title = vowTitle;
    if (targetDate !== undefined) vow.targetDate = targetDate;
    if (relatedSalah !== undefined) vow.relatedSalah = relatedSalah;
    if (notes !== undefined) vow.notes = notes.trim();

    if (isCompleted !== undefined) {
      vow.status = isCompleted ? 'Completed' : 'Active';
    } else if (status) {
      vow.status = status;
    }

    await vow.save();
    res.json(vow);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update vow' });
  }
};

export const deleteVow = async (req, res) => {
  try {
    const vow = await SalahVow.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!vow) return res.status(404).json({ message: 'Vow not found' });
    res.json({ message: 'Vow deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete vow' });
  }
};

// --- Quran & Adhkar ---

export const getQuranLogs = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { userId: req.user._id };
    if (date) filter.date = date;

    const logs = await QuranLog.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch Quran logs' });
  }
};

export const logQuran = async (req, res) => {
  try {
    const { date, surahName, surah, pagesRead, ayatsRead, notes } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const name = (surahName !== undefined ? surahName : surah)?.trim() || '';
    const log = await QuranLog.create({
      userId: req.user._id,
      date,
      surah: name,
      surahName: name,
      pagesRead: Number(pagesRead) || 1,
      ayatsRead: ayatsRead !== undefined ? ayatsRead : 0,
      notes: notes?.trim() || '',
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log Quran' });
  }
};

export const updateQuranLog = async (req, res) => {
  try {
    const log = await QuranLog.findOne({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ message: 'Quran log not found' });

    const { date, surahName, surah, pagesRead, ayatsRead, notes } = req.body;
    if (date) log.date = date;
    const name = (surahName !== undefined ? surahName : surah);
    if (name !== undefined) {
      log.surah = name.trim();
      log.surahName = name.trim();
    }
    if (pagesRead !== undefined) log.pagesRead = Number(pagesRead) || 1;
    if (ayatsRead !== undefined) log.ayatsRead = ayatsRead;
    if (notes !== undefined) log.notes = notes.trim();

    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update Quran log' });
  }
};

export const deleteQuranLog = async (req, res) => {
  try {
    const log = await QuranLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ message: 'Quran log not found' });
    res.json({ message: 'Quran log deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete Quran log' });
  }
};

export const getAdhkarLog = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const log = await AdhkarLog.findOne({ userId: req.user._id, date });
    res.json(log || { date, morningCompleted: false, eveningCompleted: false });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch Adhkar' });
  }
};

export const logAdhkar = async (req, res) => {
  try {
    const { date, morningCompleted, eveningCompleted } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const log = await AdhkarLog.findOneAndUpdate(
      { userId: req.user._id, date },
      {
        morningCompleted: morningCompleted !== undefined ? morningCompleted : false,
        eveningCompleted: eveningCompleted !== undefined ? eveningCompleted : false,
      },
      { new: true, upsert: true }
    );

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log Adhkar' });
  }
};
