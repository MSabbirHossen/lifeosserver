import 'dotenv/config';
import mongoose from 'mongoose';

const testConnect = async () => {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('SUCCESS! Host:', conn.connection.host);
    await mongoose.disconnect();
  } catch (err) {
    console.error('CONNECT ERROR:', err);
  }
};

testConnect();
