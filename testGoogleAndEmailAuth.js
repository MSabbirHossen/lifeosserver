import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from './models/User.js';
import * as authCtrl from './controllers/authController.js';

async function runAuthTests() {
  console.log('--- STARTING GOOGLE & EMAIL AUTH TEST SUITE ---');

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log('✓ Connected to test database');

  const mockRes = () => {
    const res = {};
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

  // 1. Test Email Registration
  console.log('\n[1] Testing Email Registration:');
  const regRes = mockRes();
  await authCtrl.registerUser(
    {
      body: {
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        password: 'SecurePassword123!',
      },
    },
    regRes
  );
  if (regRes.statusCode !== 201 || !regRes.jsonData.token) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.jsonData)}`);
  }
  console.log('✓ User registered successfully:', regRes.jsonData.email, 'Token:', regRes.jsonData.token.substring(0, 15) + '...');

  // 2. Test Email Login Success
  console.log('\n[2] Testing Email Login (Valid Credentials):');
  const loginRes = mockRes();
  await authCtrl.loginUser(
    {
      body: {
        email: 'sarah@example.com',
        password: 'SecurePassword123!',
      },
    },
    loginRes
  );
  if (!loginRes.jsonData?.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.jsonData)}`);
  }
  console.log('✓ Login succeeded for:', loginRes.jsonData.email);

  // 3. Test Email Login Failure (Invalid Password)
  console.log('\n[3] Testing Email Login (Invalid Password):');
  const failRes = mockRes();
  await authCtrl.loginUser(
    {
      body: {
        email: 'sarah@example.com',
        password: 'WrongPassword!',
      },
    },
    failRes
  );
  if (failRes.statusCode !== 401) {
    throw new Error(`Expected 401 for wrong password, got: ${failRes.statusCode}`);
  }
  console.log('✓ Correctly rejected wrong password with 401:', failRes.jsonData.message);

  // 4. Test Google OAuth: Register new user via Google
  console.log('\n[4] Testing Google OAuth (New User):');
  const googleNewRes = mockRes();
  await authCtrl.googleAuth(
    {
      body: {
        testUser: {
          googleId: 'google_sub_987654321',
          email: 'alex.google@gmail.com',
          name: 'Alex Rivera',
          avatar: 'https://lh3.googleusercontent.com/a/mock_avatar',
        },
      },
    },
    googleNewRes
  );
  if (!googleNewRes.jsonData?.token || googleNewRes.jsonData.authProvider !== 'google') {
    throw new Error(`Google Auth failed: ${JSON.stringify(googleNewRes.jsonData)}`);
  }
  console.log('✓ Google user created:', googleNewRes.jsonData.name, 'Provider:', googleNewRes.jsonData.authProvider, 'Avatar:', googleNewRes.jsonData.avatar);

  // 5. Test Google OAuth: Account Linking (existing email signs in with Google)
  console.log('\n[5] Testing Google OAuth Account Linking with Existing Email:');
  const googleLinkRes = mockRes();
  await authCtrl.googleAuth(
    {
      body: {
        testUser: {
          googleId: 'google_sub_11223344',
          email: 'sarah@example.com', // existing email from Test 1
          name: 'Sarah Connor Updated',
          avatar: 'https://lh3.googleusercontent.com/a/sarah_avatar',
        },
      },
    },
    googleLinkRes
  );
  if (!googleLinkRes.jsonData?.token) {
    throw new Error(`Google account linking failed: ${JSON.stringify(googleLinkRes.jsonData)}`);
  }
  const linkedUserInDb = await User.findById(regRes.jsonData._id);
  if (linkedUserInDb.googleId !== 'google_sub_11223344') {
    throw new Error('Google ID was not linked to existing user!');
  }
  console.log('✓ Existing user linked with Google ID:', linkedUserInDb.googleId);

  // 6. Test Guard: Google user with no password attempting password login
  console.log('\n[6] Testing Password Login on Google-only Account:');
  const googleNoPassRes = mockRes();
  await authCtrl.loginUser(
    {
      body: {
        email: 'alex.google@gmail.com',
        password: 'AnyPassword123!',
      },
    },
    googleNoPassRes
  );
  if (googleNoPassRes.statusCode !== 400 || !googleNoPassRes.jsonData.message.includes('Google')) {
    throw new Error(`Expected Google guard message, got: ${JSON.stringify(googleNoPassRes.jsonData)}`);
  }
  console.log('✓ Password login prevented for Google-only account with clear guidance:', googleNoPassRes.jsonData.message);

  console.log('\n===========================================');
  console.log('ALL AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('===========================================');

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

runAuthTests().catch((err) => {
  console.error('AUTH TEST FAILED:', err);
  process.exit(1);
});
