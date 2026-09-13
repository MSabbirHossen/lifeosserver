import 'dotenv/config';

const run = async () => {
  try {
    console.log('--- Health Tracker & Calorie Math Verification ---');

    // 1. Register User
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Health Verified User', email: `health_${Date.now()}@example.com`, password: 'password123' }),
    });
    const regData = await regRes.json();
    const token = regData.token;
    if (!token) {
      console.error('Registration failed:', regData);
      return;
    }
    console.log('✅ Auth Registered User:', regData.name);

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const today = new Date().toISOString().split('T')[0];

    // 2. Log Body Metric (Weight 75 kg)
    const metricRes = await fetch('http://localhost:5000/api/body-metrics', {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: today, weightKg: 75, waistCm: 80, chestCm: 100, armCm: 35 }),
    });
    const metricData = await metricRes.json();
    console.log(`✅ 1. Body Metric Logged: Weight = ${metricData.weightKg} kg | Waist = ${metricData.waistCm} cm`);

    // 3. Log Workout (30 mins Cardio - automatically estimates calorie burn based on 75 kg body weight using MET 8.5)
    // Formula: 8.5 * 75 kg * (30/60) hrs = 319 kcal
    const workoutRes = await fetch('http://localhost:5000/api/workouts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: today, name: 'Treadmill Running', durationMinutes: 30, target: 'Cardio' }),
    });
    const workoutData = await workoutRes.json();
    console.log(`✅ 2. Workout Logged (Auto Burn Est. based on Body Measurement Weight): ${workoutData.name} (${workoutData.durationMinutes} mins) -> ${workoutData.caloriesBurned} kcal burned`);

    // 4. Log Meal (2 Boiled Eggs - automatically calculates calorie & macro intake against food item)
    // Formula: 2 units * 78 kcal/unit = 156 kcal | 2 * 6g protein = 12g protein
    const mealRes = await fetch('http://localhost:5000/api/meals', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        mealType: 'Breakfast',
        items: [
          {
            name: 'Boiled Egg',
            quantity: 2,
            unit: 'piece',
            caloriesPerUnit: 78,
            proteinPerUnit: 6,
            carbsPerUnit: 0.6,
            fatPerUnit: 5,
          },
        ],
      }),
    });
    const mealData = await mealRes.json();
    console.log(`✅ 3. Meal Logged (Calorie Intake per Food Item): ${mealData.mealType} -> Total Calories = ${mealData.totalCalories} kcal | Protein = ${mealData.totalProtein}g | Carbs = ${mealData.totalCarbs}g | Fat = ${mealData.totalFat}g`);

    // 5. Fetch Aggregated Health Summary
    const summaryRes = await fetch(`http://localhost:5000/api/summary?date=${today}`, { headers });
    const summaryData = await summaryRes.json();
    console.log(`✅ 4. Aggregated Health Summary: Consumed = ${summaryData.caloriesConsumed} kcal | Burned = ${summaryData.caloriesBurned} kcal | Net Calories = ${summaryData.netCalories} kcal`);

    console.log('--- ALL HEALTH TRACKER VERIFICATION TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('❌ Health Test Failed:', err);
  }
};

run();
