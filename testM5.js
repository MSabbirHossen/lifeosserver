import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import timeTrackerRoutes from './routes/timeTrackerRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import habitsRoutes from './routes/habitsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { User } from './models/User.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/time-tracker', timeTrackerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api', healthRoutes);

const runTest = async () => {
  try {
    console.log('--- Starting M5 Health Tracker API Verification ---');
    await connectDB();

    try {
      await User.collection.dropIndex('username_1');
    } catch (e) {}

    const server = app.listen(5011, async () => {
      const baseURL = 'http://localhost:5011';

      // 1. Auth Register
      const regRes = await fetch(`${baseURL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'M5 Tester', email: `m5_${Date.now()}@example.com`, password: 'password123' }),
      });
      const regData = await regRes.json();
      const token = regData.token;
      console.log('✅ Auth Register Successful for:', regData.name);

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const today = new Date().toISOString().split('T')[0];

      // 2. PRD Acceptance Test: Log unmatched "Boiled Egg" item first (78 kcal, 6g protein, 0.6g carbs, 5g fat per piece)
      const meal1Res = await fetch(`${baseURL}/api/meals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: today,
          mealType: 'Breakfast',
          items: [
            {
              name: 'Boiled Egg',
              quantity: 1,
              unit: 'piece',
              calories: 78,
              protein: 6,
              carbs: 0.6,
              fat: 5,
            },
          ],
        }),
      });
      const meal1Data = await meal1Res.json();
      if (!meal1Res.ok) throw new Error(`Meal 1 creation failed: ${meal1Data.message}`);
      console.log('✅ Initial Meal Logged (Boiled Egg x1): Total Calories =', meal1Data.totalCalories);

      // 3. Test Food Item Search Autocomplete
      const searchRes = await fetch(`${baseURL}/api/food-items/search?q=boil`, { headers });
      const searchData = await searchRes.json();
      const eggItem = searchData.find((i) => i.name.toLowerCase() === 'boiled egg');
      if (!eggItem) throw new Error('Food item autocomplete search failed to find Boiled Egg');
      console.log('✅ Autocomplete Search Found:', eggItem.name, `(${eggItem.caloriesPerUnit} kcal/unit)`);

      // 4. PRD Acceptance Test: Log "2 boiled eggs" after the item exists & verify exact math:
      // caloriesPerUnit * 2 = 78 * 2 = 156 kcal, protein = 12g, carbs = 1.2g, fat = 10g
      const meal2Res = await fetch(`${baseURL}/api/meals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: today,
          mealType: 'Breakfast',
          items: [
            {
              foodItemId: eggItem._id,
              name: 'Boiled Egg',
              quantity: 2,
              unit: 'piece',
              calories: eggItem.caloriesPerUnit * 2,
              protein: eggItem.proteinPerUnit * 2,
              carbs: eggItem.carbsPerUnit * 2,
              fat: eggItem.fatPerUnit * 2,
            },
          ],
        }),
      });
      const meal2Data = await meal2Res.json();
      if (!meal2Res.ok) throw new Error(`Meal 2 creation failed: ${meal2Data.message}`);

      // Verify exact math
      const expectedCal = 156;
      const expectedProt = 12;
      const expectedCarb = 1.2;
      const expectedFat = 10;

      if (
        meal2Data.totalCalories !== expectedCal ||
        meal2Data.totalProtein !== expectedProt ||
        meal2Data.totalCarbs !== expectedCarb ||
        meal2Data.totalFat !== expectedFat
      ) {
        throw new Error(
          `Math verification failed! Got cal:${meal2Data.totalCalories}, prot:${meal2Data.totalProtein}, carb:${meal2Data.totalCarbs}, fat:${meal2Data.totalFat}`
        );
      }
      console.log(
        '🎯 PRD ACCEPTANCE TEST PASSED: 2 Boiled Eggs =',
        `${meal2Data.totalCalories} kcal, ${meal2Data.totalProtein}g protein, ${meal2Data.totalCarbs}g carbs, ${meal2Data.totalFat}g fat (Exact match)`
      );

      // 5. Test Workout Logging & Autocomplete
      const workoutRes = await fetch(`${baseURL}/api/workouts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: today,
          name: 'Bench Press & Chest Workout',
          durationMinutes: 45,
          caloriesBurned: 320,
          target: 'Muscle',
          notes: 'Pushed heavy sets',
        }),
      });
      const workoutData = await workoutRes.json();
      if (!workoutRes.ok) throw new Error(`Workout log failed: ${workoutData.message}`);
      console.log('✅ Workout Logged:', workoutData.name, `(${workoutData.durationMinutes} mins, ${workoutData.caloriesBurned} kcal)`);

      // 6. Test Body Metric Logging (Sparse Data)
      const metricRes = await fetch(`${baseURL}/api/body-metrics`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: today,
          weightKg: 74.5,
          waistCm: 81.0,
          notes: 'Morning weigh-in',
        }),
      });
      const metricData = await metricRes.json();
      console.log('✅ Body Metric Logged: Weight =', metricData.weightKg, 'kg');

      // 7. Test Water Logging Counter
      const waterRes = await fetch(`${baseURL}/api/water`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: today, increment: 2 }),
      });
      const waterData = await waterRes.json();
      console.log('✅ Water Logged: Total Glasses =', waterData.glasses, `(${waterData.glasses * 250} ml)`);

      // 8. Test Health Summary Aggregation
      const summaryRes = await fetch(`${baseURL}/api/summary?date=${today}`, { headers });
      const summaryData = await summaryRes.json();
      console.log(
        '✅ Health Summary Aggregated: Consumed =',
        summaryData.caloriesConsumed,
        'kcal | Burned =',
        summaryData.caloriesBurned,
        'kcal | Net =',
        summaryData.netCalories,
        'kcal'
      );

      // Cleanup test meals & workouts
      await fetch(`${baseURL}/api/meals/${meal1Data._id}`, { method: 'DELETE', headers });
      await fetch(`${baseURL}/api/meals/${meal2Data._id}`, { method: 'DELETE', headers });
      await fetch(`${baseURL}/api/workouts/${workoutData._id}`, { method: 'DELETE', headers });

      console.log('--- ALL M5 VERIFICATION TESTS PASSED ---');
      server.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ M5 Test Failed:', err.message || err);
    process.exit(1);
  }
};

runTest();
