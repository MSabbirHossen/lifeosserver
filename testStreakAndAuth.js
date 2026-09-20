import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from './models/User.js';
import { Habit } from './models/Habit.js';
import { HabitLog } from './models/HabitLog.js';
import { SalahLog } from './models/SalahLog.js';
import { Journal } from './models/Journal.js';
import { Workout } from './models/Workout.js';
import { WaterLog } from './models/WaterLog.js';
import * as authCtrl from './controllers/authController.js';
import * as dashCtrl from './controllers/dashboardController.js';
import * as habitsCtrl from './controllers/habitsController.js';
import { protect } from './middleware/auth.js';

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

const mockReq = (body = {}, user = {}, query = {}, headers = {}) => ({
  body,
  user,
  query,
  headers,
  params: {},
});

async function runVerification() {
  console.log('--- STARTING LOGIN PERSISTENCE & STREAK VERIFICATION SUITE ---');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('✓ Connected to isolated in-memory test database');

  // Test 1: User creation and 10-Year Token Expiration
  console.log('\n[Test 1] Verifying 10-Year (3650d) Token Expiration:');
  const user = await User.create({
    name: 'Streak Tester',
    email: 'streak@lifeos.app',
    passwordHash: 'password123',
    authProvider: 'email',
  });

  const regRes = mockRes();
  await authCtrl.loginUser(
    mockReq({ email: 'streak@lifeos.app', password: 'password123' }),
    regRes
  );

  const token = regRes.jsonData?.token;
  if (!token) throw new Error('Login failed to return token');

  const decoded = jwt.decode(token);
  const durationDays = Math.round((decoded.exp - decoded.iat) / (60 * 60 * 24));
  console.log(`✓ Token expiration duration: ${durationDays} days (~10 years)`);
  if (durationDays < 3600) {
    throw new Error(`Token expiration is too short! Expected >= 3600 days, got ${durationDays}`);
  }

  // Test 2: Profile fetch returns refreshed token
  console.log('\n[Test 2] Verifying Profile Fetch Returns Refreshed Token:');
  const profRes = mockRes();
  await authCtrl.getUserProfile(mockReq({}, user), profRes);
  if (!profRes.jsonData?.token) {
    throw new Error('getUserProfile failed to return refreshed token');
  }
  console.log('✓ Profile fetch successfully returned refreshed session token');

  // Test 3: Auth Middleware resilience on DB error vs Token error
  console.log('\n[Test 3] Verifying Auth Middleware Decoupling:');
  const invalidTokenRes = mockRes();
  await protect(
    mockReq({}, {}, {}, { authorization: 'Bearer invalid.token.payload' }),
    invalidTokenRes,
    () => {}
  );
  console.log('✓ Invalid token returns 401:', invalidTokenRes.statusCode === 401);
  if (invalidTokenRes.statusCode !== 401) {
    throw new Error(`Invalid token should return 401, got ${invalidTokenRes.statusCode}`);
  }

  // Test 4: Multi-Module Cross-Day Streak Calculation
  console.log('\n[Test 4] Verifying Multi-Module Cross-Day Streak Calculation:');

  const today = '2026-09-20';
  const yesterday = '2026-09-19';
  const twoDaysAgo = '2026-09-18';
  const threeDaysAgo = '2026-09-17';

  // Day -3 (2026-09-17): User did Workout
  await Workout.create({
    userId: user._id,
    date: threeDaysAgo,
    name: 'Running',
    trackingType: 'duration',
    durationMinutes: 30,
    caloriesBurned: 300,
  });

  // Day -2 (2026-09-18): User did Salah
  await SalahLog.create({
    userId: user._id,
    date: twoDaysAgo,
    salah: 'Fajr',
    status: 'onTime',
  });

  // Day -1 (2026-09-19): User logged Journal
  await Journal.create({
    userId: user._id,
    date: yesterday,
    summary: 'Great productive day!',
  });

  // Check streak before today's task is completed (pending today)
  const dashPendingRes = mockRes();
  await dashCtrl.getDashboardSummary(
    mockReq({}, user, { date: today }),
    dashPendingRes
  );

  const pendingStreak = dashPendingRes.jsonData?.summary?.streak;
  console.log('✓ Streak state before today action (pending):', pendingStreak);
  if (pendingStreak.currentStreak !== 3) {
    throw new Error(`Expected current streak of 3 from past 3 consecutive days, got ${pendingStreak.currentStreak}`);
  }
  if (pendingStreak.isSecuredToday !== false) {
    throw new Error(`Expected isSecuredToday to be false before today action, got ${pendingStreak.isSecuredToday}`);
  }

  // Complete a Habit today (2026-09-20)
  const habit = await Habit.create({
    userId: user._id,
    name: 'Morning Meditation',
    category: 'Mindset',
  });

  const toggleRes = mockRes();
  await habitsCtrl.toggleHabitLog(
    { ...mockReq({ date: today }, user), params: { id: habit._id } },
    toggleRes
  );
  console.log('✓ Habit toggled complete today. Habit streak:', toggleRes.jsonData?.currentStreak);

  // Check streak after today's action is completed
  const dashSecuredRes = mockRes();
  await dashCtrl.getDashboardSummary(
    mockReq({}, user, { date: today }),
    dashSecuredRes
  );

  const securedStreak = dashSecuredRes.jsonData?.summary?.streak;
  console.log('✓ Streak state after today action (secured):', securedStreak);
  if (securedStreak.currentStreak !== 4) {
    throw new Error(`Expected current streak of 4 after today action, got ${securedStreak.currentStreak}`);
  }
  if (securedStreak.isSecuredToday !== true) {
    throw new Error(`Expected isSecuredToday to be true after today action, got ${securedStreak.isSecuredToday}`);
  }

  console.log('\n===========================================');
  console.log('ALL LOGIN PERSISTENCE & STREAK TESTS PASSED!');
  console.log('===========================================');

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('TEST VERIFICATION FAILED:', err);
  process.exit(1);
});
