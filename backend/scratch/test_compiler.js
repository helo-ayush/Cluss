// Import dotenv to read COMPILER_URL1
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const compilerManager = require('../src/services/compilerManager');

async function testSingle(language, code, expectedOutput, testName) {
    console.log(`[Test] Running: ${testName} (${language})...`);
    try {
        const result = await compilerManager.runCode(code, language);
        const cleanOut = (result.stdout || '').trim();
        const success = cleanOut.includes(expectedOutput) && result.exit_code === 0;
        
        console.log(`  Exit Code: ${result.exit_code}`);
        console.log(`  Time Taken: ${result.execution_time}s`);
        if (result.stdout) console.log(`  Stdout: ${result.stdout.trim()}`);
        if (result.stderr) console.log(`  Stderr: ${result.stderr.trim()}`);
        
        if (success) {
            console.log(`  => SUCCESS ✅`);
        } else {
            console.log(`  => FAILED ❌ (Expected to find: "${expectedOutput}")`);
        }
    } catch (err) {
        console.error(`  => ERROR ❌:`, err.message);
    }
    console.log('-'.repeat(50));
}

async function testTimeout() {
    console.log(`[Test] Running Infinite Loop Timeout Test (python)...`);
    const code = `
import time
while True:
    time.sleep(0.1)
`;
    try {
        const result = await compilerManager.runCode(code, 'python');
        console.log(`  Exit Code: ${result.exit_code}`);
        console.log(`  Stdout: ${result.stdout}`);
        console.log(`  Stderr: ${result.stderr}`);
        if (result.stderr.includes("Time Limit Exceeded") || result.exit_code === 124) {
            console.log(`  => SUCCESS ✅ (Timeout caught)`);
        } else {
            console.log(`  => FAILED ❌ (Did not timeout correctly)`);
        }
    } catch (err) {
        console.error(`  => ERROR ❌:`, err.message);
    }
    console.log('-'.repeat(50));
}

async function runTests() {
    console.log("=== STARTING COMPILER SERVICES TESTS ===");
    
    // Python Test
    await testSingle(
        'python',
        'print("Hello Python")',
        'Hello Python',
        'Simple Print'
    );

    // Javascript Test
    await testSingle(
        'javascript',
        'console.log("Hello Node.js");',
        'Hello Node.js',
        'JS Console Log'
    );

    // Timeout Test
    await testTimeout();
}

runTests();
