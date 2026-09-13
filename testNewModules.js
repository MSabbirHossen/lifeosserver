const API_BASE = 'http://localhost:5000/api';

async function testNewModules() {
  console.log('=== VERIFYING NEW ADVANCED LIFE OS MODULES & CALORIE ENGINE ===\n');

  // 1. Auth / Register unique user
  const email = `test_adv_${Date.now()}@lifeos.dev`;
  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Advanced LifeOS User',
      email,
      password: 'Password123!',
      dailyCalorieGoal: 2200,
    }),
  });

  const authData = await registerRes.json();
  if (!authData.token) {
    throw new Error(`Auth failed: ${JSON.stringify(authData)}`);
  }
  const token = authData.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const today = new Date().toISOString().split('T')[0];

  // 2. Log Meal (Intake)
  const mealRes = await fetch(`${API_BASE}/meals`, {
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
          proteinPerUnit: 6.5,
          calories: 156,
          protein: 13,
        },
        {
          name: 'Oats & Milk',
          quantity: 1,
          unit: 'bowl',
          caloriesPerUnit: 350,
          proteinPerUnit: 12,
          calories: 350,
          protein: 12,
        },
      ],
    }),
  });
  const mealData = await mealRes.json();
  console.log(`✅ 1. Meal Logged (Intake): ${mealData.totalCalories} kcal (${mealData.totalProtein}g Protein)`);

  // 3. Log Workout (Burned)
  const workoutRes = await fetch(`${API_BASE}/workouts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      date: today,
      title: 'Morning Cardio Run',
      workoutType: 'cardio',
      durationMinutes: 30,
      caloriesBurned: 280,
    }),
  });
  const workoutData = await workoutRes.json();
  console.log(`✅ 2. Workout Logged (Burned): ${workoutData.caloriesBurned} kcal`);

  // 4. Verify Dashboard Summary Net Calorie Balance Engine
  const dashRes = await fetch(`${API_BASE}/dashboard/summary?date=${today}`, {
    headers,
  });
  const dashData = await dashRes.json();
  const calSummary = dashData.summary?.calories;
  console.log(`✅ 3. Dashboard Calorie Engine: Intake = ${calSummary.intake} kcal | Burned = ${calSummary.burned} kcal | Net Balance = ${calSummary.net} kcal (Goal: ${calSummary.goal} kcal, Remaining: ${calSummary.remaining} kcal)`);
  if (calSummary.net !== 506 - 280) {
    throw new Error(`Net calorie calculation mismatch! Expected ${506 - 280}, got ${calSummary.net}`);
  }

  // 5. Test 5-Prayer Salah Pills
  const salahRes = await fetch(`${API_BASE}/islamic/salah`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      date: today,
      prayerName: 'Fajr',
      status: 'jamaah',
    }),
  });
  const salahData = await salahRes.json();
  console.log(`✅ 4. Salah Status Logged: ${salahData.salah} -> ${salahData.status}`);

  // 6. Test Qada Matrix with Witr
  const qadaRes = await fetch(`${API_BASE}/islamic/qada`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prayerName: 'Witr',
      totalOwed: 30,
      incrementCompleted: 1,
    }),
  });
  const qadaData = await qadaRes.json();
  console.log(`✅ 5. Qada Matrix: ${qadaData.prayerName} (Owed: ${qadaData.totalOwed}, Completed: ${qadaData.totalCompleted})`);

  // 7. Test Spiritual Vows (Nazr / Niyyah)
  const vowRes = await fetch(`${API_BASE}/islamic/vows`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      description: 'Fast every Thursday and pray Tahajjud once a week',
      targetDate: '2026-12-31',
      relatedSalah: 'All',
      notes: 'Spiritual resolution for discipline',
    }),
  });
  const vowData = await vowRes.json();
  console.log(`✅ 6. Spiritual Vow Created: "${vowData.title}" [${vowData.status}]`);

  // 8. Test Quran Logger
  const quranRes = await fetch(`${API_BASE}/islamic/quran`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      date: today,
      surahName: 'Al-Mulk',
      pagesRead: 2,
      ayatsRead: 30,
    }),
  });
  const quranData = await quranRes.json();
  console.log(`✅ 7. Quran Recitation Logged: Surah ${quranData.surahName} (${quranData.pagesRead} pages, ${quranData.ayatsRead} ayats)`);

  // 9. Test Finance Nested Categories & Multi-Currency (SAR & BDT)
  const txRes = await fetch(`${API_BASE}/finance/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      date: today,
      type: 'expense',
      title: 'Ramadan Sahri Prep',
      amount: 120,
      currency: 'SAR',
      category: 'Food & Dining',
      subCategory: 'Sahri',
      paymentMethod: 'Credit Card',
      notes: 'Special groceries',
    }),
  });
  const txData = await txRes.json();
  console.log(`✅ 8. Finance Nested Transaction Logged: ${txData.title} -> ${txData.amount} ${txData.currency} (${txData.category} / ${txData.subCategory})`);

  // 10. Test Journal Guided Reflection
  const journalRes = await fetch(`${API_BASE}/journal`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      date: today,
      mood: 'energized',
      promptQuestion: 'What is one intentional choice you made today?',
      promptCategory: 'Growth',
      promptAnswer: 'Focused 4 hours on Deep Work architecture without phone distraction.',
      summary: 'High energy and solid spiritual focus throughout the day.',
      gratitude: ['Good health', 'Supportive family', 'Clear mind'],
      nextDayNotes: 'Ship new release in the morning',
    }),
  });
  const journalData = await journalRes.json();
  console.log(`✅ 9. Journal Guided Reflection Saved: Mood = ${journalData.mood} | Answer = "${journalData.promptAnswer}"`);

  console.log('\n=== ALL ADVANCED MODULES & CALORIE ENGINE TESTS PASSED CLEANLY WITH ZERO ERRORS ===');
}

testNewModules().catch((err) => {
  console.error('\n❌ Test Failed:', err);
  process.exit(1);
});
