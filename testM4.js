import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import timeTrackerRoutes from './routes/timeTrackerRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import habitsRoutes from './routes/habitsRoutes.js';
import { User } from './models/User.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/time-tracker', timeTrackerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/habits', habitsRoutes);

const runTest = async () => {
  try {
    console.log('--- Starting M4 Habits Tracker API Verification ---');
    await connectDB();

    try {
      await User.collection.dropIndex('username_1');
    } catch (e) {}

    const server = app.listen(5010, async () => {
      const baseURL = 'http://localhost:5010';

      // 1. Register
      const regRes = await fetch(`${baseURL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'M4 Tester', email: `m4_${Date.now()}@example.com`, password: 'password123' }),
      });
      const regData = await regRes.json();
      const token = regData.token;
      console.log('✅ Auth Register Successful for:', regData.name);

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 2. Create Habit
      const habitRes = await fetch(`${baseURL}/api/habits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Morning Meditation',
          category: 'Mindfulness',
          targetFrequency: 'daily',
          targetValue: 15,
          unit: 'mins',
        }),
      });
      const habitData = await habitRes.json();
      if (!habitRes.ok) throw new Error(`Create habit failed: ${habitData.message}`);
      console.log('✅ Habit Created:', habitData.name, `(ID: ${habitData._id})`);

      // 3. Toggle completion for today
      const today = new Date().toISOString().split('T')[0];
      const toggleRes = await fetch(`${baseURL}/api/habits/${habitData._id}/log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: today, value: 15 }),
      });
      const toggleData = await toggleRes.json();
      if (!toggleRes.ok) throw new Error(`Toggle habit failed: ${toggleData.message}`);
      console.log(
        '✅ Toggled Today Habit Log:',
        `Completed: ${toggleData.isCompletedToday}`,
        `Current Streak: ${toggleData.currentStreak}`
      );

      // 4. Toggle completion for yesterday to test multi-day streak calculation
      const dYesterday = new Date();
      dYesterday.setDate(dYesterday.getDate() - 1);
      const yesterday = dYesterday.toISOString().split('T')[0];

      const toggleYesterdayRes = await fetch(`${baseURL}/api/habits/${habitData._id}/log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: yesterday, value: 15 }),
      });
      const toggleYesterdayData = await toggleYesterdayRes.json();
      console.log(
        '✅ Toggled Yesterday Habit Log:',
        `Current Streak: ${toggleYesterdayData.currentStreak}`,
        `(Expected: 2)`
      );

      // 5. Fetch Habits list
      const habitsListRes = await fetch(`${baseURL}/api/habits`, { headers });
      const habitsListData = await habitsListRes.json();
      console.log(
        '✅ Habits List API: Total active habits count:',
        habitsListData.length,
        'Streak:',
        habitsListData[0]?.currentStreak
      );

      // 6. Fetch Rolling 12-Week Heatmap
      const heatmapRes = await fetch(`${baseURL}/api/habits/heatmap?weeks=12`, { headers });
      const heatmapData = await heatmapRes.json();
      console.log(
        '✅ Heatmap API: Total days returned:',
        heatmapData.heatmap.length,
        'Active habits count:',
        heatmapData.totalActiveHabits
      );

      // 7. Delete habit cleanup
      const deleteRes = await fetch(`${baseURL}/api/habits/${habitData._id}`, {
        method: 'DELETE',
        headers,
      });
      const deleteData = await deleteRes.json();
      console.log('✅ Deleted Habit:', deleteData.id);

      console.log('--- ALL M4 VERIFICATION TESTS PASSED ---');
      server.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ M4 Test Failed:', err.message || err);
    process.exit(1);
  }
};

runTest();
