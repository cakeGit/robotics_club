// Test script for Scratch block parser
import {
    parseScratchLine,
    renderScratchBlock,
} from "../src/lib/scratch/index.js";

// Test with string literal
const testStringLiteralCode = '[looks] say ("Hello World!")';
console.log("Testing string literal detection for:", testStringLiteralCode);

// Parse the block
const testStringLiteralBlock = parseScratchLine(testStringLiteralCode);

// Print out the parsed block structure
console.log("PARSED BLOCK:", JSON.stringify(testStringLiteralBlock, null, 2));

// Check if the string literal is properly identified
const fieldComponent = testStringLiteralBlock.components.find(
    (c) => c.type === "field"
);
console.log("FIELD COMPONENT:", fieldComponent);
console.log(
    "STRING LITERAL DETECTED:",
    fieldComponent.isStringLiteral === true
);
