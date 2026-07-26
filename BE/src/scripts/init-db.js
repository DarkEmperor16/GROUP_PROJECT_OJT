/**
 * Database Initialization Script for MongoDB
 *
 * Initializes MongoDB collections and synchronizes indexes for all existing models:
 *  - User (unique email, role, status)
 *  - Course (unique code, status, teacherId)
 *  - Quiz (courseId + status, status)
 *  - QaHistory (studentId + createdAt, studentId + courseId + createdAt)
 *
 * Run: npm run db:init  OR  node src/scripts/init-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, initIndexes } = require('../config/db');

const User = require('../models/User');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QaHistory = require('../models/QaHistory');

const models = [
  { name: 'User', model: User },
  { name: 'Course', model: Course },
  { name: 'Quiz', model: Quiz },
  { name: 'QaHistory', model: QaHistory },
];

async function initializeDatabase() {
  console.log('🚀  Starting MongoDB Database Initialization...\n');

  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log('✅  Database connection established.\n');

    // 2. Initialize collections & sync indexes
    console.log('📦  Initializing Collections & Schema Indexes...');
    for (const item of models) {
      const { name, model } = item;
      
      // Ensure collection is created
      await model.createCollection().catch(() => {});
      
      // Sync indexes defined on model schema
      const synced = await model.syncIndexes();
      
      // Fetch active index information from DB
      const indexes = await model.collection.indexes();
      const indexNames = indexes.map((idx) => idx.name).join(', ');

      console.log(`  - Collection [${model.collection.name}] (${name}):`);
      console.log(`    • Synced indexes: ${synced ? JSON.stringify(synced) : 'none/up-to-date'}`);
      console.log(`    • Active indexes: ${indexNames}`);
    }

    console.log('\n🎉  MongoDB Database Initialization Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌  Database Initialization Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

initializeDatabase();
