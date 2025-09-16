// Test runner for Scratch module tests
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Function to execute Jest tests
function runTests(testPattern) {
    return new Promise((resolve, reject) => {
        const command = `npx jest ${testPattern}`;
        console.log(`\nRunning: ${command}\n`);

        exec(command, (error, stdout, stderr) => {
            console.log(stdout);
            if (error) {
                console.error("Test execution failed:", stderr);
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Main test execution
async function runAllScratchTests() {
    console.log("Running all Scratch module tests...\n");

    try {
        // Get all scratch test files
        const testFiles = fs
            .readdirSync(path.join(process.cwd(), "tests"))
            .filter(
                (file) =>
                    file.startsWith("scratch") ||
                    file === "markedExtension.test.js"
            )
            .map((file) => path.basename(file, ".js"));

        console.log("Found test files:", testFiles);

        // Run each test suite individually
        for (const testFile of testFiles) {
            await runTests(testFile);
        }

        console.log("\nAll Scratch module tests completed successfully!");
    } catch (error) {
        console.error("\nTest execution failed:", error);
        process.exit(1);
    }
}

runAllScratchTests();
