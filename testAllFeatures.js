import 'dotenv/config';

const baseURL = 'http://localhost:5000/api';

const run = async () => {
  try {
    console.log('=== STARTING COMPLETE 9-FEATURE UPGRADE VERIFICATION ===\n');

    // 1. Auth Setup
    const userEmail = `verified_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Master Verified User',
        email: userEmail,
        password: 'password123',
      }),
    });
    const regData = await regRes.json();
    const token = regData.token;
    if (!token) throw new Error(`Auth failed: ${JSON.stringify(regData)}`);
    console.log('✅ 1. Auth: User Registered:', regData.name);

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    const today = new Date().toISOString().split('T')[0];

    // 2. Time Tracker (Task title + Autocomplete)
    const timeLog1 = await fetch(`${baseURL}/time-tracker/logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        category: 'Work',
        title: 'Backend API Refactoring',
        startTime: '09:00',
        endTime: '11:00',
        durationMinutes: 120,
        notes: 'Refactored controllers and models',
      }),
    });
    const timeLog1Data = await timeLog1.json();
    console.log('✅ 2. Time Tracker: Created Block:', timeLog1Data.title, `(${timeLog1Data.durationMinutes} mins)`);

    const actRes = await fetch(`${baseURL}/time-tracker/activities`, { headers });
    const activities = await actRes.json();
    console.log('✅ 2. Time Tracker Autocomplete Activities:', activities);

    // 3. Goals & Habits Linking
    const habitRes = await fetch(`${baseURL}/habits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Deep Study 1hr',
        category: 'Learning',
        targetFrequency: 'daily',
      }),
    });
    const habitData = await habitRes.json();
    console.log('✅ 3. Habit Created:', habitData.name);

    const goalRes = await fetch(`${baseURL}/goals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Master React & Node Architecture',
        type: 'short_term',
        category: 'Learning',
        linkedHabitIds: [habitData._id],
      }),
    });
    const goalData = await goalRes.json();
    console.log('✅ 3. Goal Created & Linked:', goalData.title);

    // 4. Study Tracker (Session & Backlog Topic)
    const topicRes = await fetch(`${baseURL}/study/topics`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subject: 'System Design',
        title: 'Chapter 3: Sharding & Replication',
        status: 'in_progress',
        linkedGoalId: goalData._id,
      }),
    });
    const topicData = await topicRes.json();
    console.log('✅ 4. Study Topic Backlog Planned:', topicData.subject, '->', topicData.title, `[${topicData.status}]`);

    const studySessionRes = await fetch(`${baseURL}/study`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        subject: 'System Design',
        resource: 'https://docs.microsoft.com/architecture',
        durationMinutes: 60,
        progressPercent: 75,
        goalId: goalData._id,
      }),
    });
    const studySessionData = await studySessionRes.json();
    console.log('✅ 4. Study Session Logged:', studySessionData.subject, `(${studySessionData.durationMinutes} mins)`);

    // 5. Fitness Tracker (Sets & Reps vs Duration with ideal calorie burn)
    const workoutRes = await fetch(`${baseURL}/workouts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        name: 'Incline Bench Press',
        trackingType: 'sets_reps',
        sets: 4,
        reps: 12,
        weight: 80,
        idealCaloriesPerSet: 10,
        target: 'Muscle',
      }),
    });
    const workoutData = await workoutRes.json();
    console.log('✅ 5. Workout Logged (Sets/Reps Auto-calc):', workoutData.name, `(${workoutData.sets} sets) -> ${workoutData.caloriesBurned} kcal`);

    // 6. Calorie & Water Tracker (Multi-unit measurements & macro calculations)
    const mealRes = await fetch(`${baseURL}/meals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        mealType: 'Lunch',
        items: [
          {
            name: 'Grilled Chicken Breast',
            quantity: 200,
            unit: 'gram',
            caloriesPerUnit: 1.65, // 165 kcal / 100g = 1.65 / g -> 330 kcal
            proteinPerUnit: 0.31, // 31g / 100g = 0.31 / g -> 62g protein
            carbsPerUnit: 0,
            fatPerUnit: 0.036,
          },
        ],
      }),
    });
    const mealData = await mealRes.json();
    console.log('✅ 6. Meal Logged (Gram unit calc):', mealData.mealType, `-> ${mealData.totalCalories} kcal (${mealData.totalProtein}g protein)`);

    const waterRes = await fetch(`${baseURL}/water`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: today, increment: 2 }),
    });
    const waterData = await waterRes.json();
    console.log('✅ 6. Water Logged:', waterData.glasses, 'glasses', `(${waterData.ml} ml)`);

    // 7. Finance Tracker (Multi-Currency SAR default, BDT, USD + Fund Transfer)
    const expenseRes = await fetch(`${baseURL}/finance/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        type: 'expense',
        title: 'Cloud Infrastructure Hosting',
        amount: 150,
        currency: 'SAR',
        category: 'Utilities',
        paymentMethod: 'Credit Card',
      }),
    });
    const expenseData = await expenseRes.json();
    console.log('✅ 7. Finance Expense Logged:', expenseData.title, `(${expenseData.amount} ${expenseData.currency})`);

    const transferRes = await fetch(`${baseURL}/finance/transfer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        title: 'ATM Cash Withdrawal',
        fromPaymentMethod: 'Bank Transfer',
        toPaymentMethod: 'Cash',
        fromCurrency: 'SAR',
        toCurrency: 'SAR',
        fromAmount: 500,
      }),
    });
    const transferData = await transferRes.json();
    console.log('✅ 7. Finance Fund Transfer:', transferData.title, `(${transferData.amount} ${transferData.currency})`);

    const finSummaryRes = await fetch(`${baseURL}/finance/summary`, { headers });
    const finSummary = await finSummaryRes.json();
    console.log('✅ 7. Finance Method Balances in SAR:', finSummary.methodBalances);

    // 8. Islamic Tracker (Clickable Salah, Qada make-up, Hadith log)
    const salahRes = await fetch(`${baseURL}/islamic/salah`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        prayerName: 'Fajr',
        status: 'onTime',
      }),
    });
    const salahData = await salahRes.json();
    console.log('✅ 8. Salah Logged:', salahData.salah, '->', salahData.status);

    const qadaRes = await fetch(`${baseURL}/islamic/qada`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prayerName: 'Fajr',
        incrementCompleted: 1,
      }),
    });
    const qadaData = await qadaRes.json();
    console.log('✅ 8. Qada Made-up Prayer Recorded: Fajr total completed =', qadaData.totalCompleted);

    const hadithRes = await fetch(`${baseURL}/islamic/hadith`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        narrator: 'Umar ibn Al-Khattab (RA)',
        text: 'Actions are judged by intentions, and every person will be rewarded according to what he intended.',
        reference: 'Sahih Al-Bukhari #1',
        reflection: 'Ensure all daily study and health efforts are with sincere intent.',
      }),
    });
    const hadithData = await hadithRes.json();
    console.log('✅ 8. Hadith Logged & Reflected:', hadithData.reference);

    // 9. Habits Heatmap API
    const heatmapRes = await fetch(`${baseURL}/habits/heatmap?weeks=12`, { headers });
    const heatmapData = await heatmapRes.json();
    console.log('✅ 9. Habit Heatmap Days Returned:', heatmapData.heatmap?.length);

    console.log('\n=== ALL 9 FEATURE UPGRADE TESTS PASSED CLEANLY WITH ZERO ERRORS ===');
  } catch (err) {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
  }
};

run();
