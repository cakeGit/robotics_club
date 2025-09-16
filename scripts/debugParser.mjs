import { parseScratchLine } from "../src/lib/scratch/scratchBlockParser.js";

const examples = [
    "[control] if <<[sensing] Key {down arrow} pressed> and <[sensing] Key {up arrow} pressed>>",
    "when flag clicked",
    "if <<key {down arrow} pressed> and <key {up arrow} pressed>>",
    "say (((5) * (2)))",
    "[operators] ((5) + (10))",
    "move ([operators] ((10) * (2))) steps",
];

for (const ex of examples) {
    console.log("--- Example:", ex);
    console.log(JSON.stringify(parseScratchLine(ex), null, 2));
}
