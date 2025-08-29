#!/usr/bin/env node

/**
 * CI Summary Script
 * Checks log files for actual failures, not just the word "error"
 */

const fs = require('fs');
const path = require('path');

const logsDir = '.logs';
const logs = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));

const failedLogs = [];

logs.forEach(logFile => {
  const content = fs.readFileSync(path.join(logsDir, logFile), 'utf8');
  
  // Check for actual failures based on log type
  let hasFailed = false;
  
  if (logFile.includes('lint')) {
    // Lint logs: check for ESLint error summary
    hasFailed = content.includes('✖') && content.includes('problem');
  } else if (logFile.includes('test')) {
    // Test logs: check for test failures - looking for explicit failure indicators
    // Must check the actual test summary lines, not debug output
    const testFilesMatch = content.match(/Test Files\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?/);
    const testsMatch = content.match(/Tests\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?/);
    
    hasFailed = (testFilesMatch && testFilesMatch[2] && parseInt(testFilesMatch[2]) > 0) ||
                (testsMatch && testsMatch[2] && parseInt(testsMatch[2]) > 0) ||
                content.includes('FAIL src/');
  } else if (logFile.includes('typecheck')) {
    // TypeScript: check for compilation errors
    hasFailed = content.includes('error TS');
  } else if (logFile.includes('build')) {
    // Build logs: check for npm error exit codes
    hasFailed = /npm error code [1-9]/.test(content);
  }
  
  if (hasFailed) {
    failedLogs.push(logFile);
  }
});

if (failedLogs.length > 0) {
  console.log('❌ CI FAILED - Errors in:', failedLogs.join(', '));
  process.exit(1);
} else {
  console.log('✅ All quality gates passed!');
  process.exit(0);
}