const mongoose = require('mongoose');

function buildMongoUri() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const username = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';
  const dbName = process.env.MONGO_DB_NAME || 'OJT-KNS';
  const authSource = process.env.MONGO_AUTH_SOURCE || 'admin';

  if (!username || !password) {
    throw new Error('DB_USERNAME and DB_PASSWORD are required to build MongoDB URI');
  }

  return `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?authSource=${authSource}`;
}

async function connectDB() {
  const mongoUri = buildMongoUri();

  await mongoose.connect(mongoUri);

  console.log(`Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

module.exports = {
  connectDB,
};
