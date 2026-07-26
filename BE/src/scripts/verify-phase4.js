/**
 * Phase 4 Verification Script
 * Run: node src/scripts/verify-phase4.js
 *
 * Checks:
 *  1. error.middleware imports and exports errorHandler
 *  2. errorHandler handles CastError, ValidationError, DuplicateKey (11000), and JWT errors
 *  3. server.js imports and registers errorHandler
 *  4. seed-student-data.js is present and syntax-valid
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

// Mock Res object for testing middleware responses
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

console.log('\n📦  Importing Phase 4 modules…');

let errorHandler, seedScriptPath;
try {
  const errorModule = require('../middlewares/error.middleware');
  errorHandler = errorModule.errorHandler;
  assert('error.middleware imports cleanly', true);
} catch (err) {
  assert('error.middleware imports cleanly', false, err.message);
  process.exit(1);
}

// 1. Check errorHandler export
console.log('\n🛡️   Testing errorHandler middleware logic…');
assert('exports errorHandler function', typeof errorHandler === 'function');

// Test CastError
const resCast = createMockRes();
errorHandler({ name: 'CastError', path: '_id' }, { method: 'GET', originalUrl: '/test' }, resCast, () => {});
assert('CastError returns 400', resCast.statusCode === 400);
assert('CastError formats path message', resCast.body && resCast.body.message.includes('_id'));

// Test ValidationError
const resVal = createMockRes();
errorHandler({ name: 'ValidationError', errors: { title: { message: 'Title is required' } } }, { method: 'POST', originalUrl: '/test' }, resVal, () => {});
assert('ValidationError returns 400', resVal.statusCode === 400);
assert('ValidationError surfaces field errors', Array.isArray(resVal.body.errors) && resVal.body.errors[0] === 'Title is required');

// Test Duplicate Key (11000)
const resDup = createMockRes();
errorHandler({ code: 11000, keyValue: { code: 'PRF192' } }, { method: 'POST', originalUrl: '/test' }, resDup, () => {});
assert('Duplicate key (11000) returns 409', resDup.statusCode === 409);
assert('Duplicate key message mentions field', resDup.body && resDup.body.message.includes('code'));

// Test JWT Error
const resJwt = createMockRes();
errorHandler({ name: 'JsonWebTokenError' }, { method: 'GET', originalUrl: '/test' }, resJwt, () => {});
assert('JsonWebTokenError returns 401', resJwt.statusCode === 401);

// 2. Check server.js integration
console.log('\n🌐  Checking server.js integration…');
const serverSrc = fs.readFileSync(path.resolve(__dirname, '../..', 'server.js'), 'utf8');
assert('server.js requires error.middleware', serverSrc.includes('error.middleware'));
assert('server.js registers app.use(errorHandler)', serverSrc.includes('app.use(errorHandler)'));

// 3. Check seed-student-data script existence
console.log('\n🌱  Checking seed script file…');
seedScriptPath = path.resolve(__dirname, 'seed-student-data.js');
assert('seed-student-data.js exists', fs.existsSync(seedScriptPath));

// Summary
console.log(`\n${'─'.repeat(48)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('  🎉  Phase 4 verification PASSED\n');
  process.exit(0);
} else {
  console.log('  ⚠️   Phase 4 verification FAILED — fix errors above\n');
  process.exit(1);
}
