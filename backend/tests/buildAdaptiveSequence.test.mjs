import assert from 'assert';
import { buildAdaptiveSequence } from '../index.js';

function findRevision(sequence) {
  return sequence.some((w) => /Revision/i.test(w.title));
}

// Test 1: burnout high should insert revision days
const seq1 = buildAdaptiveSequence('Machine Learning', 'High', 75, 50, 'Moderate');
assert.ok(seq1.length > 0, 'Sequence should not be empty');
assert.ok(findRevision(seq1), 'Should include revision days when burnout is high or cognitive load is High');
console.log('Test 1 passed: revision days present for high burnout/cognitive load');

// Test 2: high consistency should mark accelerated (or at least not include revision days)
const seq2 = buildAdaptiveSequence('Machine Learning', 'Moderate', 30, 90, 'Moderate');
assert.ok(seq2.length > 0, 'Sequence should not be empty');
const hasAccelerated = seq2.some((w) => w.accelerated === true);
assert.ok(hasAccelerated, 'High consistency should mark accelerated weeks');
console.log('Test 2 passed: accelerated flag present for high consistency');

console.log('All buildAdaptiveSequence tests passed');
