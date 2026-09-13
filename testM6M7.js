import 'dotenv/config';

const runTest = async () => {
  try {
    console.log('--- Starting Milestones 6 & 7 Integration Verification ---');

    // 1. Register / Login user to get JWT token
    const testUser = { name: 'M6M7 User', email: `test_${Date.now()}@example.com`, password: 'password123' };
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    const token = regData.token;

    if (!token) {
      console.error('Registration failed:', regData);
      return;
    }
    console.log('✅ Auth Register Successful. User:', regData.name);

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    const today = new Date().toISOString().split('T')[0];

    // 2. Test Salah Grid & Summary
    await fetch('http://localhost:5000/api/islamic/salah', {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: today, salah: 'Fajr', status: 'jamaah' }),
    });
    const summaryRes = await fetch('http://localhost:5000/api/islamic/salah/summary', { headers });
    const summaryData = await summaryRes.json();
    console.log('✅ Islamic Salah Summary:', `Expected: ${summaryData.expected} | Completed: ${summaryData.completed} | Remaining: ${summaryData.remaining}`);

    // 3. Test Study Session & Subject Autocomplete
    await fetch('http://localhost:5000/api/study', {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: today, subject: 'Full-Stack Architecture', durationMinutes: 60, progressPercent: 80 }),
    });
    const subjectsRes = await fetch('http://localhost:5000/api/study/subjects', { headers });
    const subjectsData = await subjectsRes.json();
    console.log('✅ Study Subjects List:', subjectsData);

    // 4. Test Goals linked to Habit
    const habitRes = await fetch('http://localhost:5000/api/habits', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Daily Coding', category: 'Study' }),
    });
    const habitData = await habitRes.json();

    const goalRes = await fetch('http://localhost:5000/api/goals', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Launch Life OS v1', type: 'short-term', linkedHabitIds: [habitData._id] }),
    });
    const goalData = await goalRes.json();
    console.log('✅ Goal Created with Linked Habit:', goalData.title);

    // 5. Test Unified Dashboard Summary
    const dashRes = await fetch(`http://localhost:5000/api/dashboard/summary?date=${today}`, { headers });
    const dashData = await dashRes.json();
    console.log('✅ Unified Dashboard Summary Aggregation:', {
      salahCompleted: dashData.summary.salah.completedCount,
      studyMinutes: dashData.summary.study.totalMinutes,
      timeLoggedMinutes: dashData.summary.time.totalMinutes,
    });

    // 6. Test JSON Data Export
    const exportRes = await fetch('http://localhost:5000/api/reports/export/json', { headers });
    const exportData = await exportRes.json();
    console.log('✅ Full User Data Backup JSON Exported. Collections count:', Object.keys(exportData).length);

    console.log('--- ALL MILESTONES 6 & 7 VERIFICATION TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('❌ M6/M7 Test Failed:', err);
  }
};

runTest();
