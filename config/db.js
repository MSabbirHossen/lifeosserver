import mongoose from 'mongoose';
import dns from 'dns';

// Only set custom public DNS servers on local Windows machines (never inside Vercel serverless sandbox)
if (process.platform === 'win32' && !process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {}
}

let cachedConn = null;
export let lastDbError = null;

const seedDemoUser = async () => {
  try {
    const existing = await mongoose.connection.collection('users').findOne({ email: 'demo@lifeos.app' });
    if (!existing) {
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('password123', salt);
      await mongoose.connection.collection('users').insertOne({
        name: 'Demo User',
        email: 'demo@lifeos.app',
        passwordHash: hash,
        authProvider: 'email',
        theme: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('[Life OS] Demo user ready: demo@lifeos.app');
    }
  } catch (err) {
    console.warn('[Life OS] Demo seed notice:', err.message);
  }
};

/**
 * Check if the Atlas host is reachable via DNS TXT lookup without hanging the driver.
 */
const checkAtlasReachable = async (uri) => {
  if (!uri || !uri.startsWith('mongodb+srv://')) return true;
  const match = uri.match(/@([^/?]+)/);
  if (!match) return true;
  const host = match[1];

  try {
    await Promise.race([
      dns.promises.resolveTxt(host),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DNS TXT preflight timeout (2000ms)')), 2000)
      ),
    ]);
    return true;
  } catch (err) {
    console.warn(`[MongoDB Atlas Preflight]: DNS TXT query failed (${err.message})`);
    return false;
  }
};

/**
 * Connect to MongoDB with connection caching and fallback.
 */
export const connectDB = async () => {
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  // Prevent Mongoose from queuing queries for 10s if disconnected
  mongoose.set('bufferCommands', false);

  const uri = process.env.MONGODB_URI;

  // In Vercel / serverless environment, connect directly to MongoDB Atlas
  if (process.env.VERCEL) {
    if (!uri) {
      const missingErr = new Error(
        'MONGODB_URI is not set in Vercel Environment Variables. Please add MONGODB_URI in your Vercel Project Settings.'
      );
      lastDbError = missingErr.message;
      throw missingErr;
    }

    try {
      console.log('[MongoDB Vercel] Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 6000,
        connectTimeoutMS: 6000,
        socketTimeoutMS: 30000,
        maxPoolSize: 10,
      });
      console.log(`[MongoDB Vercel Connected] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
      lastDbError = null;

      try {
        await mongoose.connection.collection('users').dropIndex('username_1');
      } catch (e) {}

      cachedConn = conn;
      await seedDemoUser();
      return conn;
    } catch (err) {
      lastDbError = err.message;
      console.error('[MongoDB Vercel Error]:', err.message);
      throw err;
    }
  }

  const resolvedUri = uri || 'mongodb://127.0.0.1:27017/lifeos';
  const isReachable = await checkAtlasReachable(resolvedUri);

  if (isReachable) {
    try {
      console.log(`[MongoDB] Connecting to primary database...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 20000,
        family: 4,
        maxPoolSize: 10,
      });
      console.log(`[MongoDB Connected] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);

      try {
        await mongoose.connection.collection('users').dropIndex('username_1');
      } catch (e) {}

      cachedConn = conn;
      await seedDemoUser();
      return conn;
    } catch (primaryError) {
      console.warn(`[MongoDB Primary Connection Failed]: ${primaryError.message}. Switching to fallback...`);
    }
  }

  // Fallback to in-memory database if not on Vercel
  if (!process.env.VERCEL) {
    try {
      console.log(`[MongoDB] Initializing in-memory database fallback...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB Connected In-Memory Fallback] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
      cachedConn = conn;
      await seedDemoUser();
      return conn;
    } catch (fallbackError) {
      console.error(`[MongoDB Fallback Error]: ${fallbackError.message}`);
    }
  } else {
    throw new Error('Please set MONGODB_URI in your Vercel Environment Variables to connect to MongoDB Atlas.');
  }
};

export default connectDB;
