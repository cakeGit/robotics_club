# Copilot instructions — robotics_club

Purpose: quickly orient an AI coding agent to be productive in this repo.

Quick commands

-   **Install:** `npm install`
-   **Dev server:** `npm run dev` (Vite)
-   **Build:** `npm run build`
-   **Preview build:** `npm run preview`
-   **Lint:** `npm run lint` (ESLint)
-   **Run parser smoke tests / helpers:** `node scripts/testScratchBlocks.mjs`, `node scripts/debugParser.mjs`, `node scripts/testRenderer.mjs`
-   **Run the test runner (uses `npx jest`):** `node scripts/testRunner.mjs`
-   **Serve test HTML pages:** `node tests/server.js` then open `http://localhost:8080/boolean_operations_test.html`

High-level architecture

-   **Frontend:** React + Vite in `src/` (`main.jsx`, `App.jsx`, components under `src/components/`). Tailwind is configured (`tailwind.config.js`, `postcss.config.js`, `index.css`).
-   **Markdown/content:** site pages live under `data/` and are processed by `src/lib/markedExtension.js` and components in `src/components/docs/`.
-   **Scratch parser & renderer:** the primary custom logic lives in `src/lib/scratch/`.
    -   Parser: `scratchBlockParser.js` — exposes `parseScratchLine`, `parseCategory`, `parseComponents`.
    -   Renderers: `scratchSvgRenderer.js`, `scratchBlockRendererSvg.js` — exports include `renderScratchBlock`, `renderScratchBlocks`, `renderScratchCode`, `renderAST`, `getBlockDimensions`, `getTheme`.
    -   Entry: `src/lib/scratch/index.js` re-exports the parser + renderer API; prefer importing from this index for consistency.

Key data flows and conventions

-   The parser returns a plain-Object AST node with fields: `original`, `category`, `shape` (one of `hat`, `stack`, `c-block`), and `components` (array). Components are typed objects: `text`, `field`, `boolean`, `booleanOperation`, `selection`, `codeBlock`, `operator`.
-   Nested arithmetic and boolean expressions are represented via `components` arrays and/or `nested`/`components` properties on `field` nodes.
-   Renderers accept either the parsed AST or block text (see `index.js` exports). Many tests call parser directly and then pass the parsed object into renderer utilities.

Project-specific patterns and gotchas

-   Module format: `package.json` sets `type: "module"` so source is ESM. Scripts sometimes use `.mjs`; prefer `import`/`export` when editing source.
-   Multiple renderer entrypoints: there are two renderer files (`scratchSvgRenderer.js` and `scratchBlockRendererSvg.js`) and tests sometimes import different names (e.g. `renderScratchBlockSVG`). When refactoring, update all usages and re-run `node scripts/testRenderer.mjs` and the `tests/` scripts.
-   Tests produce SVG outputs into `tests/output/` and create an HTML viewer at `tests/boolean_operations_test.html` — use `node tests/server.js` to preview.
-   Test runner: `scripts/testRunner.mjs` uses `npx jest <testName>`; tests live in `tests/` and include both browser HTML fixtures and Node test files.

Where to look first when changing parser/renderer

-   `src/lib/scratch/scratchBlockParser.js` — parse rules, boolean operation handling, matching parentheses logic.
-   `src/lib/scratch/scratchSvgRenderer.js` and `scratchBlockRendererSvg.js` — shape layout, color/theme, and SVG assembly.
-   `scripts/testRenderer.mjs`, `scripts/testScratchBlocks.mjs` — quick runnable examples to verify parsing and SVG output.
-   `tests/booleanOperationsTest.mjs` and `tests/output/` — integration-style examples and expected visual outputs.

Editing and test workflow recommendations

-   Make small parser changes and validate with `node scripts/debugParser.mjs` and `node scripts/testScratchBlocks.mjs` first.
-   When touching rendering/layout, run `node scripts/testRenderer.mjs` to produce `test-block.svg` and inspect `tests/output/` for other cases.
-   Use `node scripts/testRunner.mjs` to run the Jest suites referenced by the project.

If unsure, ask about

-   Whether to prefer `scratchSvgRenderer.js` or `scratchBlockRendererSvg.js` as the canonical renderer.
-   Any missing CI steps (this repo has no `.github/workflows` checked in).

Primary files to reference

-   `src/lib/scratch/scratchBlockParser.js`
-   `src/lib/scratch/scratchSvgRenderer.js`
-   `src/lib/scratch/scratchBlockRendererSvg.js`
-   `src/lib/scratch/index.js`
-   `scripts/testRunner.mjs`, `scripts/testRenderer.mjs`, `scripts/testScratchBlocks.mjs`
-   `tests/booleanOperationsTest.mjs`, `tests/output/`, `tests/boolean_operations_test.html`, `tests/server.js`

End — ask here if any areas need more detail or additional run/debug commands.
