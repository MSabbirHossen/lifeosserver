import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import timeTrackerRoutes from './routes/timeTrackerRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import { User } from './models/User.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/time-tracker', timeTrackerRoutes);
app.use('/api/finance', financeRoutes);

const runTest = async () => {
  try {
    console.log('--- Starting M3 Finance Tracker API Verification ---');
    await connectDB();

    // Clean up stale username_1 index if present in DB
    try {
      await User.collection.dropIndex('username_1');
      console.log('🧹 Cleaned up legacy username_1 index');
    } catch (e) {
      // index didn't exist or already dropped
    }

    const server = app.listen(5009, async () => {
      const baseURL = 'http://localhost:5009';

      // 1. Auth Login or Register
      let token;
      const loginRes = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'atlas@example.com', password: 'password123' }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        token = loginData.token;
        console.log('✅ Auth Login Successful. Token for:', loginData.name);
      } else {
        const regRes = await fetch(`${baseURL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Atlas Tester',
            email: 'atlas@example.com',
            password: 'password123',
          }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(`Auth registration failed: ${regData.message}`);
        token = regData.token;
        console.log('✅ Auth Register Successful. Token for:', regData.name);
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 2. Test GET /api/finance/meta
      const metaRes = await fetch(`${baseURL}/api/finance/meta`, { headers });
      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(`Meta failed: ${metaData.message}`);
      console.log(
        '✅ Finance Meta API: Received',
        metaData.categories.expense.length,
        'expense categories and',
        metaData.currencies.length,
        'currencies.'
      );

      const today = new Date().toISOString().split('T')[0];

      // 3. Test POST /api/finance (Income)
      const incomeRes = await fetch(`${baseURL}/api/finance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: today,
          type: 'income',
          amount: 3500,
          currency: 'USD',
          category: 'Salary',
          subCategory: 'Full-time',
          description: 'Monthly Salary Payment',
          paymentMethod: 'Bank Transfer',
        }),
      });
      const incomeData = await incomeRes.json();
      if (!incomeRes.ok) throw new Error(`Create Income failed: ${incomeData.message}`);
      console.log('✅ Created Income Transaction:', incomeData._id, `$${incomeData.amount}`);

      // 4. Test POST /api/finance (Expense)
      const expenseRes = await fetch(`${baseURL}/api/finance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: today,
          type: 'expense',
          amount: 85.5,
          currency: 'USD',
          category: 'Food & Dining',
          subCategory: 'Groceries',
          description: 'Weekly grocery shopping',
          paymentMethod: 'Credit Card',
        }),
      });
      const expenseData = await expenseRes.json();
      if (!expenseRes.ok) throw new Error(`Create Expense failed: ${expenseData.message}`);
      console.log('✅ Created Expense Transaction:', expenseData._id, `$${expenseData.amount}`);

      // 5. Test GET /api/finance
      const listRes = await fetch(`${baseURL}/api/finance`, { headers });
      const listData = await listRes.json();
      if (!listRes.ok) throw new Error(`List failed: ${listData.message}`);
      console.log('✅ List Transactions API: Total items count:', listData.pagination.total);

      // 6. Test GET /api/finance/summary
      const summaryRes = await fetch(`${baseURL}/api/finance/summary`, { headers });
      const summaryData = await summaryRes.json();
      if (!summaryRes.ok) throw new Error(`Summary failed: ${summaryData.message}`);
      console.log(
        '✅ Summary API: Total Income =',
        summaryData.totalIncome,
        '| Total Expense =',
        summaryData.totalExpense,
        '| Net Savings =',
        summaryData.netSavings
      );

      // 7. Test PUT /api/finance/:id
      const updateRes = await fetch(`${baseURL}/api/finance/${expenseData._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          amount: 92.0,
          description: 'Updated grocery shopping with extras',
        }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(`Update failed: ${updateData.message}`);
      console.log('✅ Updated Expense Amount to:', `$${updateData.amount}`);

      // 8. Test DELETE /api/finance/:id
      const deleteRes = await fetch(`${baseURL}/api/finance/${expenseData._id}`, {
        method: 'DELETE',
        headers,
      });
      const deleteData = await deleteRes.json();
      if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteData.message}`);
      console.log('✅ Deleted Expense Transaction:', deleteData.id);

      console.log('--- ALL M3 VERIFICATION TESTS PASSED ---');
      server.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ M3 Test Failed:', err.message || err);
    process.exit(1);
  }
};

runTest();
