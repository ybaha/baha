"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { describe, it } = require("node:test");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const loadConfig = require("tailwindcss/loadConfig");
require("tsx/cjs/api").register();
const { cn } = require("../src/lib/utils.ts");

const repoRoot = join(__dirname, "..");

function readRepoFile(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("style token contracts", () => {
  it("merges typography sizes independently of colors", () => {
    const sizes = loadConfig(join(repoRoot, "tailwind.config.ts")).theme.extend.fontSize;
    for (const role of Object.keys(sizes)) {
      assert.equal(cn(`text-${role} text-subtle`), `text-${role} text-subtle`);
      assert.equal(cn("text-sm text-content", `text-${role}`), `text-content text-${role}`);
      assert.equal(cn(`text-${role} text-subtle`, "text-base"), "text-subtle text-base");
    }
    assert.equal(cn("text-body text-subtle", "text-caption"), "text-subtle text-caption");
    assert.equal(cn("text-body text-subtle", "text-content"), "text-body text-content");
  });

  it("emits semantic text utilities with the configured sizes and font variables", async () => {
    const config = loadConfig(join(repoRoot, "tailwind.config.ts"));
    const sizes = config.theme.extend.fontSize;
    const utilities = ["text-content", "text-subtle", "font-sans", "font-mono", "font-serif",
      ...Object.keys(sizes).map(role => `text-${role}`)];
    const result = await postcss([tailwindcss({
      ...config,
      content: [{ raw: utilities.join(" ") }],
    })]).process(readRepoFile("src/global.css"), { from: undefined });
    const rules = new Map();
    result.root.walkRules(rule => {
      rules.set(rule.selector, Object.fromEntries(
        rule.nodes.filter(node => node.type === "decl").map(node => [node.prop, node.value])
      ));
    });
    for (const [role, [size, { lineHeight }]] of Object.entries(sizes)) {
      assert.equal(rules.get(`.text-${role}`)["font-size"], size);
      assert.equal(rules.get(`.text-${role}`)["line-height"], lineHeight);
    }
    for (const token of ["content", "subtle"]) {
      assert.ok(rules.get(`.text-${token}`).color.includes(`var(--color-${token})`));
    }
    for (const [family, variable] of [["sans", "geist-sans"], ["mono", "geist-mono"], ["serif", "cormorant"]]) {
      assert.ok(rules.get(`.font-${family}`)["font-family"].includes(`var(--font-${variable})`));
    }
  });

  it("keeps secondary text readable on the plain light and dark page surfaces", () => {
    const css = postcss.parse(readRepoFile("src/global.css"));
    function luminance(channels) {
      return channels.map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    }
    for (const theme of [":root", "[data-theme='dark']"]) {
      let vars;
      css.walkRules(theme, rule => {
        if (rule.nodes.some(node => node.prop === "--color-subtle")) {
          vars = Object.fromEntries(rule.nodes.filter(node => node.type === "decl").map(node => [node.prop, node.value]));
        }
      });
      const channels = value => value.split(/\s+/).map(Number);
      const text = luminance(channels(vars["--color-subtle"]));
      // The light canvas has only a 1% accent wash; its darkest endpoint is the worst case.
      const page = theme === ":root" ? [244, 246, 250].map(value => value * 0.99) : channels(vars["--color-background"]);
      for (const surface of [page, channels(vars["--color-background-tertiary"])]) {
        const bg = luminance(surface);
        const contrast = (Math.max(text, bg) + 0.05) / (Math.min(text, bg) + 0.05);
        assert.ok(contrast >= 4.5, `${theme} secondary contrast ${contrast.toFixed(2)}:1`);
      }
    }
  });

  it("renders main prose with the same body color on Projects, Tech Stack, and MDX", () => {
    const React = require("react");
    const { renderToStaticMarkup } = require("react-dom/server");
    const previousReact = global.React;
    const previousImageLoader = require.extensions[".webp"];
    global.React = React;
    // Next normally provides static image metadata; images are irrelevant to this text contract.
    require.extensions[".webp"] = (module, filename) => {
      module.exports = { src: filename, width: 1600, height: 900 };
    };
    try {
      const Projects = require("../src/app/projects/page.tsx").default;
      const TechStack = require("../src/app/tech-stack/page.tsx").default;
      const { mdxComponentMap } = require("../src/components/mdx/mdx-component-map.tsx");
      const projectsHtml = renderToStaticMarkup(React.createElement(Projects));
      const techHtml = renderToStaticMarkup(React.createElement(TechStack));
      const paragraphs = [
        [projectsHtml, "Products I’m proud of"],
        [projectsHtml, "Ask a question about Turkish law."],
        [projectsHtml, "One shared calendar"],
        [projectsHtml, "Mobile releases and earlier experiments"],
        [projectsHtml, "Mert and I made it"],
        [techHtml, "Times have changed."],
        [techHtml, "Herdr is always open"],
        [techHtml, "Reusable instructions"],
        [renderToStaticMarkup(React.createElement(mdxComponentMap.p, null, "Article body")), "Article body"],
      ];
      for (const [html, text] of paragraphs) {
        const paragraph = (html.match(/<p\b[^>]*>[\s\S]*?<\/p>/g) || []).find(p => p.includes(text));
        assert.ok(paragraph, `Rendered paragraph: ${text}`);
        const classes = paragraph.match(/class="([^"]+)"/)[1].split(/\s+/);
        assert.ok(classes.includes("text-body"), `${text}: shared size`);
        assert.ok(classes.includes("text-content"), `${text}: main text color`);
        assert.ok(!classes.includes("text-subtle"), `${text}: must not be dimmed as metadata`);
      }
      assert.match(projectsHtml, /<p\b[^>]*class="[^"]*text-caption[^"]*text-subtle[^"]*"[^>]*>[^<]*registered accounts/);
      assert.match(techHtml, /<figcaption\b[^>]*class="[^"]*text-caption[^"]*text-subtle/);
      const globalCss = readRepoFile("src/global.css");
      assert.doesNotMatch(globalCss, /\.content\s*>\s*p\s*\{/);
      assert.doesNotMatch(globalCss, /article\s*\{[^}]*text-base/);
    } finally {
      if (previousReact === undefined) delete global.React;
      else global.React = previousReact;
      if (previousImageLoader === undefined) delete require.extensions[".webp"];
      else require.extensions[".webp"] = previousImageLoader;
    }
  });

  it("defines semantic content and subtle colors in both themes", () => {
    const css = readRepoFile("src/global.css");
    assert.match(css, /--color-content:\s*39 39 42/);
    assert.match(css, /--color-subtle:\s*100 100 110/);
    assert.match(css, /\[data-theme='dark'\][\s\S]*--color-content:\s*228 228 231/);
    assert.match(css, /\[data-theme='dark'\][\s\S]*--color-subtle:\s*190 190 198/);
    assert.match(css, /--color-muted-foreground:\s*var\(--color-subtle\)/);
  });

  it("wires Geist and Cormorant CSS variables in layout and Tailwind", () => {
    const layout = readRepoFile("src/app/layout.tsx");
    assert.match(layout, /GeistSans\.variable/);
    assert.match(layout, /GeistMono\.variable/);
    assert.match(layout, /variable:\s*'--font-cormorant'/);
    assert.doesNotMatch(layout, /cormorant\.className/);
    assert.match(layout, /body className=.*font-sans text-body text-content/);

    const tailwind = readRepoFile("tailwind.config.ts");
    assert.match(tailwind, /content:\s*'rgb\(var\(--color-content\)/);
    assert.match(tailwind, /subtle:\s*'rgb\(var\(--color-subtle\)/);
    assert.match(tailwind, /'muted-foreground':/);
    assert.match(tailwind, /sans:\s*\['var\(--font-geist-sans\)'/);
    assert.match(tailwind, /mono:\s*\['var\(--font-geist-mono\)'/);
    assert.match(tailwind, /serif:\s*\['var\(--font-cormorant\)'/);
    assert.match(tailwind, /'section-title':/);
    assert.match(tailwind, /body:\s*\['16px'/);
  });

  it("maps sidebar text tokens to semantic colors", () => {
    const sidebar = readRepoFile("src/components/sidebar/sidebar.css");
    assert.match(sidebar, /--sb-serif:\s*var\(--font-cormorant\)/);
    assert.match(sidebar, /--sb-text:\s*rgb\(var\(--color-content\)\)/);
    assert.match(sidebar, /--sb-text-dim:\s*rgb\(var\(--color-subtle\)\)/);
  });

  it("adopts shared section and page typography on key routes", () => {
    const projects = readRepoFile("src/app/projects/page.tsx");
    assert.match(projects, /text-section-title/);
    assert.match(projects, /text-body text-content/);

    const tech = readRepoFile("src/app/tech-stack/page.tsx");
    assert.match(tech, /text-section-title/);
    assert.match(tech, /text-body text-content/);

    const pageTitle = readRepoFile("src/components/page-title.tsx");
    assert.match(pageTitle, /text-page-title/);
    assert.match(pageTitle, /font-serif.*italic/);
    assert.match(pageTitle, /text-content/);

    const sectionLabel = readRepoFile("src/components/ui/section-label.tsx");
    assert.match(sectionLabel, /text-section-title/);
    assert.match(sectionLabel, /font-sans/);
  });
});
