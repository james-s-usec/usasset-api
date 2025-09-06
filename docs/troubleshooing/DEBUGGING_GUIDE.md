# Claude Code Debugging Guide

## Overview
This guide provides debugging techniques and custom commands for effective problem-solving in the USAsset project using Claude Code.

## 🎯 **AUTOMATIC BUSINESS LOGIC LOGGING** 

### ✅ **NO MORE CONSOLE.LOG DEBUGGING!**
The system now automatically captures ALL business operations in the database logs. Every controller method is logged with:

- **🎯 STARTING** - Operation begins with input parameters
- **✅ COMPLETED** - Successful completion with output data and timing  
- **❌ FAILED** - Errors with full context, stack traces, and input data

### How to Use the Complete Logging System

#### Get Full Operation Story
```bash
# Any failed request gives you a correlation ID
curl http://localhost:3000/api/assets/invalid-id
# Returns: {"correlationId": "abc-123"}

# Get complete story for that request
curl "http://localhost:3000/logs?correlationId=abc-123"
# Shows: STARTING → HTTP details → FAILED → Full stack trace
```

#### Debug Any Operation
```bash
# List recent errors across all operations
curl "http://localhost:3000/logs?level=ERROR&limit=20"

# See business logic for specific operations  
curl "http://localhost:3000/logs" | grep "STARTING\|COMPLETED\|FAILED"

# Trace performance issues
curl "http://localhost:3000/logs" | grep "ms" | sort
```

## 🦆 Rubber Duck Debugging Protocol

### What is Rubber Duck Debugging?
A debugging technique from "The Pragmatic Programmer" where you explain your problem step-by-step to an inanimate object (traditionally a rubber duck). The act of verbalizing forces you to think through the problem systematically.

**NOTE**: With the new automatic logging, you may not need rubber duck debugging as much since the logs now tell you the complete story!

### How to Use with Claude Code

#### Command: `duck [problem description]`
When you type "duck" followed by your problem, Claude will act as your rubber duck:

1. **Listen actively** - No immediate solutions
2. **Ask clarifying questions** - Help you verbalize assumptions
3. **Guide step-by-step** - Walk through the logic flow
4. **Point out gaps** - Highlight what you might be missing
5. **Celebrate discovery** - When you find the solution yourself

### Example Session
```
User: duck - my user creation API returns 500 but logs are empty

Claude: 🦆 *listening* - Let's start from the beginning. 
What endpoint are you calling and what data are you sending?

User: POST /api/users with {name: "John", email: "john@example.com"}

Claude: 🦆 *nods* - Walk me through what happens when the 
request hits your controller. What's the first thing it does?

User: It validates the input using a DTO... wait, I just realized 
I added a new required field but didn't update the DTO!

Claude: 🦆 *quack* - Excellent! You found it by explaining it!
```

## 🔍 Systematic Debugging Commands

### `debug-api [endpoint]`
Systematically debug an API endpoint:
```
User: debug-api POST /users

Claude will:
1. Check route configuration
2. Verify controller method
3. Trace through service layer
4. Check database operations
5. Review error handling
6. Validate response formatting
```

### `debug-import [error]`
Debug TypeScript/ESLint import errors:
```
User: debug-import "Cannot find module '../src/app.module'"

Claude will:
1. Check file existence
2. Verify tsconfig.json paths
3. Review ESLint configuration
4. Check relative path accuracy
5. Validate module exports
```

### `debug-test [test-name]`
Debug failing tests:
```
User: debug-test "UserService should create user"

Claude will:
1. Read the test file
2. Check test setup/teardown
3. Verify mocks and stubs
4. Trace actual vs expected
5. Check async handling
6. Review test isolation
```

## 📊 Log Analysis Commands

### `analyze-logs [timeframe]`
Analyze logs for patterns:
```
User: analyze-logs last-hour

Claude will:
1. Read recent log files from .logs/
2. Identify error patterns
3. Find correlation IDs
4. Track request flow
5. Highlight anomalies
```

### `trace-request [correlation-id]`
Trace a specific request:
```
User: trace-request abc-123-def

Claude will:
1. Find all logs with correlation ID
2. Order chronologically
3. Show request flow
4. Identify where it failed
5. Suggest root cause
```

## 🏗️ Debugging Strategies

### 1. Binary Search Debugging
When dealing with a regression:
```
User: binary-debug "Feature worked yesterday, broken today"

Claude will:
1. Get recent commits
2. Binary search through them
3. Test at midpoint
4. Narrow down breaking commit
5. Identify exact change
```

### 2. Divide and Conquer
For complex issues:
```
User: divide-debug "Multiple features failing"

Claude will:
1. List all failing features
2. Find common dependencies
3. Test shared components
4. Isolate problem area
5. Focus debugging effort
```

### 3. Hypothesis Testing
Scientific debugging approach:
```
User: hypothesis "Database queries are slow"

Claude will:
1. Form specific hypothesis
2. Design test to verify
3. Run experiment
4. Analyze results
5. Refine hypothesis
```

## 🛠️ Environment Debugging

### `check-env`
Verify environment configuration:
```
User: check-env

Claude will:
1. Validate .env files
2. Check required variables
3. Verify database connection
4. Test external services
5. Confirm port availability
```

### `diff-env [environment]`
Compare environments:
```
User: diff-env production

Claude will:
1. Compare local vs production configs
2. Check version differences
3. Review deployment settings
4. Identify mismatches
5. Suggest alignments
```

## 🔧 Performance Debugging

### `profile [operation]`
Profile slow operations:
```
User: profile "user list query"

Claude will:
1. Add timing measurements
2. Check database queries
3. Review N+1 problems
4. Analyze memory usage
5. Suggest optimizations
```

## 📝 Debug Artifacts

### SCRATCHPAD.md
Claude will use this file to:
- Plan debugging approach
- Track hypotheses
- Note findings
- Document solution

### .logs/debug/
Debug-specific logs:
- `debug-session-[timestamp].log`
- `hypothesis-tests.log`
- `performance-profiles.log`

## 🎯 Quick Debug Checklist

When something breaks, Claude will check:

1. **Immediate**
   - [ ] Error messages in console
   - [ ] Network tab in browser
   - [ ] Database logs
   - [ ] Container logs

2. **Code Review**
   - [ ] Recent changes (git diff)
   - [ ] Type errors (npm run typecheck)
   - [ ] Lint issues (npm run lint)
   - [ ] Test failures (npm run test)

3. **Environment**
   - [ ] Environment variables
   - [ ] Database connection
   - [ ] External services
   - [ ] Port conflicts

4. **Data Flow**
   - [ ] Request validation
   - [ ] Service logic
   - [ ] Database queries
   - [ ] Response formatting

## 🚨 Common Issues & Solutions

### "Cannot find module"
```bash
# Check tsconfig.json includes test files
# Verify paths are relative to correct directory
# Ensure ESLint import resolver configured
```

### "500 Internal Server Error"
```bash
# Check logs in .logs/
# Add debug logging to identify failure point
# Verify async/await usage
# Check error handling middleware
```

### "CORS errors"
```bash
# Verify CORS_ORIGIN env variable
# Check backend CORS middleware
# Confirm frontend API URL
```

### "Database connection failed"
```bash
# Check DATABASE_URL format
# Verify PostgreSQL is running
# Test connection with psql
# Check port availability
```

## 🎓 Learning from Bugs

After fixing a bug, Claude will:

1. **Document the issue**
   - What broke?
   - Why did it break?
   - How was it fixed?

2. **Prevent recurrence**
   - Add test case
   - Update validation
   - Improve error messages
   - Add to CI checks

3. **Share knowledge**
   - Update CLAUDE.md
   - Add to this guide
   - Create custom command if recurring

## 💡 Pro Tips

1. **Always check the simple things first** - Is it plugged in?
2. **Read error messages carefully** - They often tell you exactly what's wrong
3. **Reproduce reliably** - Can't fix what you can't reproduce
4. **One change at a time** - Isolate variables
5. **Take breaks** - Fresh eyes see obvious problems
6. **Explain to someone/something** - Rubber duck debugging works!

## 📚 References

- [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/)
- [Debugging: The 9 Indispensable Rules](https://debuggingrules.com/)
- [Claude Code Best Practices](https://docs.anthropic.com/claude/docs/debugging-with-claude)

---

*Remember: The best debugger is a good night's sleep and a fresh perspective!* 🌟