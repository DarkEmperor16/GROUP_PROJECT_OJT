/**
 * Phase 3 Verification Script
 * Run: node src/scripts/verify-phase3.js
 *
 * Checks:
 *  1. aiService imports and exports sendQuestionToAI
 *  2. sendQuestionToAI returns fallback string when AI_SERVICE_URL is unset
 *  3. student.controller exports askAi
 *  4. student.routes registers POST /ask-ai
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

async function runVerification() {
  console.log('\n📦  Importing Phase 3 modules…');

  let aiService, controller, router;
  try {
    aiService  = require('../utils/aiService');
    controller = require('../controllers/student.controller');
    router     = require('../routes/student.routes');
    assert('All Phase 3 modules import without error', true);
  } catch (err) {
    assert('All Phase 3 modules import without error', false, err.message);
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. aiService checks
  // ─────────────────────────────────────────────────────────────
  console.log('\n🤖  aiService checks…');
  assert('exports sendQuestionToAI', typeof aiService.sendQuestionToAI === 'function');

  delete process.env.AI_SERVICE_URL;
  const fallbackAnswer = await aiService.sendQuestionToAI({
    question: 'What is agile development?',
    courseCode: 'PRF192',
    courseTitle: 'Software Engineering Principles',
  });

  assert('sendQuestionToAI returns a non-empty string fallback', typeof fallbackAnswer === 'string' && fallbackAnswer.length > 0);
  assert('fallback answer mentions the course code', fallbackAnswer.includes('PRF192'));

  // ─────────────────────────────────────────────────────────────
  // 2. Controller askAi check
  // ─────────────────────────────────────────────────────────────
  console.log('\n🎮  student.controller askAi check…');
  assert('exports askAi handler', typeof controller.askAi === 'function');
  assert('askAi is async function', controller.askAi.constructor.name === 'AsyncFunction');

  // ─────────────────────────────────────────────────────────────
  // 3. Router askAi registration
  // ─────────────────────────────────────────────────────────────
  console.log('\n🗺️   student.routes POST /ask-ai check…');
  const layers = (router.stack || []).filter((l) => l.route);
  const askAiRoute = layers.find((l) => l.route.path === '/ask-ai' && l.route.methods.post);

  assert('POST /ask-ai route is registered on student router', !!askAiRoute);

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(48)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('  🎉  Phase 3 verification PASSED\n');
    process.exit(0);
  } else {
    console.log('  ⚠️   Phase 3 verification FAILED — fix errors above\n');
    process.exit(1);
  }
}

runVerification();
