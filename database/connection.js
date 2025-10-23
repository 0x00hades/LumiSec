import mongoose from 'mongoose';

export function dbConnection() {
  const uri = process.env.DB_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/phish_mvp';
  mongoose
    .connect(uri)
    .then(() => {
      console.log('Database connected successfully!');
    })
    .catch((err) => {
      console.log('Database connection error:', err);
      process.exit(1);
    });
}

export { mongoose };


