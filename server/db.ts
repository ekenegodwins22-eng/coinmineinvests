import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://clonedatabase:clonedatabase@clonedatabase.hfmunxm.mongodb.net/?retryWrites=true&w=majority&appName=CLONEDATABASE";

if (!MONGODB_URI) {
  throw new Error('MongoDB URI must be set');
}

// Global is used here to maintain a cached connection across hot reloads in development
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;