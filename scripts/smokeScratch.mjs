import { renderScratchBlock } from "../src/lib/scratch/index.js";

const code = "[motion] say (5)";
try {
    const svg = renderScratchBlock(code);
    console.log("Rendered SVG length:", svg.length);
} catch (err) {
    console.error("Error rendering:", err);
    process.exit(1);
}
