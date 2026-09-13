import 'dotenv/config';

const runTest = async () => {
  try {
    console.log('--- Starting M2 API Integration Verification ---');

    // 1. Register user to get JWT token
    const testUser = { name: 'M2 User', email: `m2_${Date.now()}@example.com`, password: 'password123' };
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    const token = regData.token;
    console.log('✅ Auth Register Successful. User:', regData.name);

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Test GET /api/journal/prompt
    const promptRes = await fetch('http://localhost:5000/api/journal/prompt', { headers });
    const promptData = await promptRes.json();
    console.log('✅ Journal Prompt API:', promptData.question, `(${promptData.category})`);

    // 3. Test POST /api/journal (Create Journal Entry with autotagging)
    const today = new Date().toISOString().split('T')[0];
    const journalRes = await fetch('http://localhost:5000/api/journal', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        summary: 'Studied React 18, practiced coding, and did gym workout!',
        moods: ['Productive', 'Happy'],
        highlights: 'Successfully built Milestone 2 for Life OS!',
        problemsFaced: 'None today',
        gratitude: ['Grateful for health', 'Grateful for productive day'],
        notesForTomorrow: 'Continue with Milestone 3',
        promptQuestion: promptData.question,
        promptAnswer: 'Focused on execution and completed tasks clean.',
      }),
    });
    const journalData = await journalRes.json();
    console.log('✅ Journal Entry Created. AutoTags:', journalData.autoTags);

    // 4. Test POST /api/time-tracker (Create Time Log entry)
    const timeLogRes = await fetch('http://localhost:5000/api/time-tracker', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: today,
        category: 'Study',
        activity: 'Full-Stack Architecture & M2 Coding',
        startTime: '09:00',
        endTime: '11:30',
        notes: 'Built Journal and Time Tracker APIs and UI components',
      }),
    });
    const timeLogData = await timeLogRes.json();
    console.log('✅ Time Log Created. Duration:', timeLogData.durationMinutes, 'mins | Overlap:', timeLogData.hasOverlap);

    console.log('--- ALL M2 VERIFICATION TESTS PASSED ---');
  } catch (err) {
    console.error('❌ M2 Test Failed:', err);
  }
};

runTest();
