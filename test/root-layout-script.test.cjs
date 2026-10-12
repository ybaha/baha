'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { it } = require('node:test');

it('restores the accent in the existing React client component, not an inline script', () => {
  const layout = readFileSync(join(__dirname, '../src/app/layout.tsx'), 'utf8');
  const menu = readFileSync(join(__dirname, '../src/components/menu-content.tsx'), 'utf8');
  assert.doesNotMatch(layout, /<script\b|<Script\b|ACCENT_SCRIPT/);
  assert.match(menu, /useLayoutEffect\(\(\) => \{[\s\S]*?readStoredAccent\(\)[\s\S]*?applyAccent\(stored\)/);
});

it('uses native text balancing instead of script-generating wrappers', () => {
  for (const file of ['page-title.tsx', 'floating-header.tsx', 'journey-card.tsx']) {
    const source = readFileSync(join(__dirname, '../src/components', file), 'utf8');
    assert.doesNotMatch(source, /react-wrap-balancer|<Balancer/);
    assert.match(source, /text-balance/);
  }
});
