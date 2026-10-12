'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
require('tsx/cjs/api').register();
const { createSparklinePaths } = require('../src/components/live-operations/chart-path.ts');

describe('smooth request sparkline', () => {
  it('uses cubic curves through the samples and closes the matching area', () => {
    const { line, area } = createSparklinePaths([20, 60, 30, 70]);
    assert.ok(line.startsWith('M0,38'));
    assert.equal((line.match(/ C/g) ?? []).length, 3);
    assert.ok(line.endsWith('100,13'));
    assert.equal(area, `${line} L100,50 L0,50 Z`);
    assert.ok(!line.includes('NaN'));
  });

  it('handles empty, single-point, and flat data', () => {
    assert.deepEqual(createSparklinePaths([]), { line: '', area: '' });
    assert.deepEqual(createSparklinePaths([20]), { line: 'M0,38 H100', area: 'M0,50 V38 H100 V50 Z' });
    const flat = createSparklinePaths([20, 20, 20]);
    assert.ok(!flat.line.includes('NaN'));
    assert.ok(!flat.line.includes('Infinity'));
  });

  it('keeps control points within each segment to avoid overshoot', () => {
    const values = [18, 72, 20, 20, 60, 64, 22, 48];
    const curves = createSparklinePaths(values).line.split(' C').slice(1);
    curves.forEach((curve, index) => {
      const coordinates = curve.split(/[ ,]/).map(Number);
      const first = 48 - values[index] * 0.5;
      const second = 48 - values[index + 1] * 0.5;
      for (const y of [coordinates[1], coordinates[3]]) {
        assert.ok(y >= Math.min(first, second) && y <= Math.max(first, second));
      }
    });
  });
});
