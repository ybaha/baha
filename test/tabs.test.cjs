const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { describe, it } = require('node:test');
const ts = require('@typescript/typescript6');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { clsx } = require('clsx');
const { twMerge } = require('tailwind-merge');

const file = join(__dirname, '../src/components/ui/tabs.tsx');
const output = ts.transpileModule(readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const tabsModule = { exports: {} };
new Function('exports', 'require', 'module', output)(tabsModule.exports, name => name === '@/lib/utils' ? { cn: (...values) => twMerge(clsx(...values)) } : require(name), tabsModule);
const { Tabs } = tabsModule.exports;
const items = [
  { value: 'v1', label: 'V1 Editorial', content: React.createElement('p', null, 'Editorial content') },
  { value: 'v2', label: 'V2 Workspace', content: React.createElement('p', null, 'Workspace content') },
  { value: 'v3', label: 'V3 Index', content: React.createElement('p', null, 'Index content') },
];

function render(props = {}) { return renderToStaticMarkup(React.createElement(Tabs, { items, ...props })); }

describe('reusable styled tabs', () => {
  it('defaults to the first item and renders only its panel', () => {
    const html = render();
    assert.match(html, /role="tablist"/);
    assert.match(html, /Editorial content/);
    assert.doesNotMatch(html, /Workspace content|Index content/);
    assert.equal((html.match(/tabindex="0"/g) || []).length, 2);
  });
  it('supports a controlled value and the existing selected material', () => {
    const html = render({ value: 'v2' });
    assert.match(html, /Workspace content/);
    assert.doesNotMatch(html, /Editorial content/);
    assert.match(html, /lt-sheen-s/);
    const selected = html.match(/<button[^>]*aria-selected="true"[^>]*>/)[0];
    const selectedId = selected.match(/id="([^"]+)"/)[1];
    assert.ok(html.includes(`aria-labelledby="${selectedId}"`));
  });
  it('skips a disabled default item', () => {
    const html = render({ items: [{ ...items[0], disabled: true }, ...items.slice(1)] });
    assert.match(html, /Workspace content/);
    assert.match(html, /disabled=""/);
  });
  it('handles empty and fully disabled sets without a dangling panel', () => {
    for (const value of [[], items.map(item => ({ ...item, disabled: true }))]) {
      const html = render({ items: value });
      assert.doesNotMatch(html, /role="tabpanel"|aria-controls=/);
    }
  });
});
