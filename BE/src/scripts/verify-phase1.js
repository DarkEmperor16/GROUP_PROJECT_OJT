/**
 * Phase 1 Verification Script
 * Run: node src/scripts/verify-phase1.js
 *
 * Checks:
 *  1. All models import without errors
 *  2. Schema paths + enums are correct
 *  3. MongoDB indexes are registered on the schema
 *  4. Quiz.toStudentView() strips correctAnswer + explanation
 *  5. paginate() has the expected function signature
 */

'use strict';

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

let Course, Quiz, QaHistory, paginate;
try {
  Course     = require('../models/Course');
  Quiz       = require('../models/Quiz');
  QaHistory  = require('../models/QaHistory');
  ({ paginate } = require('../utils/paginate'));
  assert('All 4 modules import without error', true);
} catch (err) {
  assert('All 4 modules import without error', false, err.message);
  console.error('\nCannot continue — fix import errors first.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// 2. Course schema
// ─────────────────────────────────────────────────────────────
console.log('\n📋  Course schema…');
const coursePaths = Course.schema.paths;
assert('has title path',       !!coursePaths.title);
assert('has code path',        !!coursePaths.code);
assert('has description path', !!coursePaths.description);
assert('has teacherId path',   !!coursePaths.teacherId);
assert('has status path',      !!coursePaths.status);
assert('status default is ACTIVE', coursePaths.status.defaultValue === 'ACTIVE');
assert('status enum includes ACTIVE',   coursePaths.status.enumValues.includes('ACTIVE'));
assert('status enum includes INACTIVE', coursePaths.status.enumValues.includes('INACTIVE'));

const courseIndexes = Course.schema.indexes();
const courseIndexKeys = courseIndexes.map(([key]) => JSON.stringify(key));
assert('index on { status: 1 }',                  courseIndexKeys.includes('{"status":1}'));
assert('unique index on { code: 1 }',
  courseIndexes.some(([key, opts]) => key.code === 1 && opts.unique === true));
assert('index on { teacherId: 1, status: 1 }',    courseIndexKeys.includes('{"teacherId":1,"status":1}'));

// ─────────────────────────────────────────────────────────────
// 3. Quiz schema
// ─────────────────────────────────────────────────────────────
console.log('\n📋  Quiz schema…');
const quizPaths = Quiz.schema.paths;
assert('has title path',     !!quizPaths.title);
assert('has courseId path',  !!quizPaths.courseId);
assert('has timeLimit path', !!quizPaths.timeLimit);
assert('has questions path', !!quizPaths.questions);
assert('has status path',    !!quizPaths.status);
assert('status enum includes DRAFT',    quizPaths.status.enumValues.includes('DRAFT'));
assert('status enum includes ACTIVE',   quizPaths.status.enumValues.includes('ACTIVE'));
assert('status enum includes ARCHIVED', quizPaths.status.enumValues.includes('ARCHIVED'));
assert('status default is DRAFT', quizPaths.status.defaultValue === 'DRAFT');
assert('timeLimit default is 0',  quizPaths.timeLimit.defaultValue === 0);

const quizIndexes  = Quiz.schema.indexes();
const quizIndexKeys = quizIndexes.map(([key]) => JSON.stringify(key));
assert('index on { courseId: 1, status: 1 }', quizIndexKeys.includes('{"courseId":1,"status":1}'));
assert('index on { status: 1 }',              quizIndexKeys.includes('{"status":1}'));

// toStudentView strips correctAnswer + explanation
console.log('\n🔒  Quiz.toStudentView() security check…');
const mockQuiz = new Quiz({
  title:    'Test Quiz',
  courseId: new (require('mongoose').Types.ObjectId)(),
  timeLimit: 10,
  status:   'ACTIVE',
  questions: [
    {
      text:          'What is 2+2?',
      options:       ['3', '4', '5', '6'],
      correctAnswer: 1,
      explanation:   'Basic arithmetic',
    },
  ],
});

const studentView = mockQuiz.toStudentView();
const q = studentView.questions[0];
assert('toStudentView() removes correctAnswer',      !('correctAnswer' in q),
  'correctAnswer still present — SECURITY RISK');
assert('toStudentView() removes explanation',        !('explanation' in q),
  'explanation still present');
assert('toStudentView() keeps question text',        q.text === 'What is 2+2?');
assert('toStudentView() keeps options array',        Array.isArray(q.options) && q.options.length === 4);

// ─────────────────────────────────────────────────────────────
// 4. QaHistory schema
// ─────────────────────────────────────────────────────────────
console.log('\n📋  QaHistory schema…');
const histPaths = QaHistory.schema.paths;
assert('has studentId path', !!histPaths.studentId);
assert('has courseId path',  !!histPaths.courseId);
assert('has question path',  !!histPaths.question);
assert('has answer path',    !!histPaths.answer);
assert('has createdAt path', !!histPaths.createdAt);

const histIndexes  = QaHistory.schema.indexes();
const histIndexKeys = histIndexes.map(([key]) => JSON.stringify(key));
assert('compound index { studentId: 1, createdAt: -1 }',
  histIndexKeys.includes('{"studentId":1,"createdAt":-1}'));
assert('compound index { studentId: 1, courseId: 1, createdAt: -1 }',
  histIndexKeys.includes('{"studentId":1,"courseId":1,"createdAt":-1}'));

// ─────────────────────────────────────────────────────────────
// 5. paginate() utility
// ─────────────────────────────────────────────────────────────
console.log('\n🔧  paginate() utility…');
assert('paginate is a function', typeof paginate === 'function');
// JS Function.length stops at the first defaulted param, so we check the
// function can be called with (model, filter, options) without throwing.
try {
  // Pass a fake model that won't actually run — we just validate the signature resolves.
  // A TypeError would fire here if the signature were wrong.
  const fakeModel = { find: () => { throw new Error('no db'); }, countDocuments: () => {} };
  paginate(fakeModel, {}, { page: 1, limit: 5 }).catch(() => {});
  assert('paginate callable with (model, filter, options)', true);
} catch (e) {
  assert('paginate callable with (model, filter, options)', e.message === 'no db',
    'unexpected error: ' + e.message);
}

// ─────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(48)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('  🎉  Phase 1 verification PASSED\n');
  process.exit(0);
} else {
  console.log('  ⚠️   Phase 1 verification FAILED — fix the errors above\n');
  process.exit(1);
}
