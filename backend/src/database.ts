import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/acrms';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global as any;

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };

    cached.mongoose.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('⚠️  Server will continue without database connection');
      console.log('💡 To fix: Install MongoDB locally or check your cloud MongoDB settings');
      // Don't throw error, allow server to start
      return null;
    });
  }

  try {
    cached.mongoose.conn = await cached.mongoose.promise;
  } catch (e) {
    cached.mongoose.promise = null;
    console.error('MongoDB connection error:', e);
    // Don't throw, allow server to start
  }

  return cached.mongoose.conn;
}

export default connectToDatabase;