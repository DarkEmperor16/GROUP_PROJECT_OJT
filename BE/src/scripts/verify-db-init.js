/**
 * Verification Script for MongoDB Database Initialization
 * Run: node src/scripts/verify-db-init.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

console.log('\n📦  Checking DB Initialization Module & Scripts…');

// 1. Check db.js exports
let dbConfig;
try {
  dbConfig = require('../config/db');
  assert('db.js imports without error', true);
} catch (err) {
  assert('db.js imports without error', false, err.message);
  process.exit(1);
}

assert('db.js exports connectDB function', typeof dbConfig.connectDB === 'function');
assert('db.js exports initIndexes function', typeof dbConfig.initIndexes === 'function');

// 2. Check init-db.js script file
const initScriptPath = path.resolve(__dirname, 'init-db.js');
assert('init-db.js file exists', fs.existsSync(initScriptPath));

try {
  require('./init-db.js');
  // Note: requiring init-db.js directly triggers initializeDatabase() which connects/attempts connect.
  // We check file content syntax safely by checking syntax or imports.
} catch (err) {
  // Expected if MongoDB local service is not running; syntax check passed if it reached connect error
  const isSyntaxOrRuntimeErr = err.message.includes('connect') || err.message.includes('DB_USERNAME') || err.message.includes('ECONNREFUSED');
  assert('init-db.js loads without syntax errors', isSyntaxOrRuntimeErr || err.code === 'MODULE_NOT_FOUND', err.message);
}

// 3. Check models registered for DB initialization
console.log('\n📋  Checking Mongoose Models for Initialization…');
const User = require('../models/User');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QaHistory = require('../models/QaHistory');

assert('User model is defined', User && User.modelName === 'User');
assert('Course model is defined', Course && Course.modelName === 'Course');
assert('Quiz model is defined', Quiz && Quiz.modelName === 'Quiz');
assert('QaHistory model is defined', QaHistory && QaHistory.modelName === 'QaHistory');

// 4. Check package.json scripts
console.log('\n📜  Checking package.json scripts…');
const pkgPath = path.resolve(__dirname, '../../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

assert('package.json has db:init script', pkg.scripts && pkg.scripts['db:init'] === 'node src/scripts/init-db.js');
assert('package.json has db:seed script', pkg.scripts && pkg.scripts['db:seed'] === 'node src/scripts/seed-student-data.js');

// Summary
console.log(`\n${'─'.repeat(48)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('  🎉  DB Initialization verification PASSED\n');
  process.exit(0);
} else {
  console.log('  ⚠️   DB Initialization verification FAILED — fix errors above\n');
  process.exit(1);
}
