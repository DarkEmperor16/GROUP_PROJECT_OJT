/**
 * Phase 2 Verification Script
 * Run: node src/scripts/verify-phase2.js
 *
 * Checks (no live DB required):
 *  1. All new modules import without error
 *  2. student.controller exports exactly the 5 required functions
 *  3. Each controller function is async
 *  4. student.routes is a valid Express Router with the correct routes registered
 *  5. server.js source text registers /api/student
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

// ─────────────────────────────────────────────────────────────
// 1. Imports
// ─────────────────────────────────────────────────────────────
console.log('\n📦  Importing modules…');

let controller, router;
try {
  controller = require('../controllers/student.controller');
  assert('student.controller imports without error', true);
} catch (err) {
  assert('student.controller imports without error', false, err.message);
  process.exit(1);
}

try {
  router = require('../routes/student.routes');
  assert('student.routes imports without error', true);
} catch (err) {
  assert('student.routes imports without error', false, err.message);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// 2. Controller exports
// ─────────────────────────────────────────────────────────────
console.log('\n🎮  Controller exports…');

const EXPECTED_HANDLERS = ['getCourses', 'getQuizzes', 'getQuizById', 'submitQuiz', 'getHistory'];

EXPECTED_HANDLERS.forEach((name) => {
  assert(`exports ${name}`, typeof controller[name] === 'function');
});

// ─────────────────────────────────────────────────────────────
// 3. Controllers are async
// ─────────────────────────────────────────────────────────────
console.log('\n⚡  Controllers are async…');

EXPECTED_HANDLERS.forEach((name) => {
  const fn = controller[name];
  const isAsync = fn.constructor.name === 'AsyncFunction';
  assert(`${name} is async`, isAsync);
});

// ─────────────────────────────────────────────────────────────
// 4. Routes registered on the Express router
// ─────────────────────────────────────────────────────────────
console.log('\n🗺️   Routes registered on Express router…');

assert('router is an Express Router', typeof router === 'function' && router.stack !== undefined);

// Flatten route layers
const layers = (router.stack || []).filter((l) => l.route);
const routes = layers.map((l) => ({
  method: Object.keys(l.route.methods)[0].toUpperCase(),
  path:   l.route.path,
}));

const routeStr = (method, p) => routes.some((r) => r.method === method && r.path === p);

assert('GET  /courses',                routeStr('GET',  '/courses'));
assert('GET  /quizzes',                routeStr('GET',  '/quizzes'));
assert('GET  /quizzes/:quizId',        routeStr('GET',  '/quizzes/:quizId'));
assert('POST /quizzes/:quizId/submit', routeStr('POST', '/quizzes/:quizId/submit'));
assert('GET  /history',                routeStr('GET',  '/history'));

// ─────────────────────────────────────────────────────────────
// 5. Route-level middleware (auth guards)
// ─────────────────────────────────────────────────────────────
console.log('\n🔐  Auth middleware applied to router…');

// Router-level middleware sits in non-route stack entries
const middlewareLayers = (router.stack || []).filter((l) => !l.route);
assert(
  'router has middleware layers (authenticateToken + authorizeRoles)',
  middlewareLayers.length >= 2,
  `found ${middlewareLayers.length} middleware layer(s)`,
);

// ─────────────────────────────────────────────────────────────
// 6. server.js registers /api/student
// ─────────────────────────────────────────────────────────────
console.log('\n🌐  server.js integration…');

const serverSrc = fs.readFileSync(
  path.resolve(__dirname, '../..', 'server.js'),
  'utf8',
);

assert(
  "server.js requires student.routes",
  serverSrc.includes('student.routes'),
);
assert(
  "server.js registers /api/student",
  serverSrc.includes("'/api/student'") || serverSrc.includes('"/api/student"'),
);

// ─────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(48)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('  🎉  Phase 2 verification PASSED\n');
  process.exit(0);
} else {
  console.log('  ⚠️   Phase 2 verification FAILED — fix the errors above\n');
  process.exit(1);
}
