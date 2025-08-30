# Good Enough Check - No Broken Windows

Verify code is "good enough" for production without broken windows:

Scope: $ARGUMENTS (or current branch)

## ✅ Good Enough Checklist:

### No Broken Windows (Must Fix):
```bash
- [ ] All tests pass (npm run test)
- [ ] No lint errors (npm run lint)
- [ ] No TypeScript errors (npm run typecheck)
- [ ] No console.log in production code
- [ ] No commented-out code
- [ ] No TODO older than 1 week
- [ ] Functions under 30 lines
- [ ] Build succeeds (npm run build)
```

### Quality Threshold Met:
```bash
- [ ] Test coverage > 80%
- [ ] No security vulnerabilities (npm audit)
- [ ] API response time < 1 second
- [ ] No N+1 queries
- [ ] Error handling in place
- [ ] Logging for debugging
```

### Ready for Users:
```bash
- [ ] Feature works end-to-end
- [ ] Handles edge cases gracefully
- [ ] Meaningful error messages
- [ ] Documented in README
- [ ] Deployment verified
```

## NOT Required (Can improve later):
- 100% test coverage
- Perfect performance
- Every edge case handled
- Comprehensive documentation
- Beautiful code

## Report Format:
```
🎯 Good Enough Check Results:

✅ NO BROKEN WINDOWS - Ready!
- All tests passing (42/42)
- Zero lint errors
- Zero TypeScript errors
- No technical debt

✅ QUALITY THRESHOLD - Met!
- Test coverage: 85%
- Build time: 12s
- No security issues

⚠️ IMPROVEMENTS (optional):
- Could add more unit tests
- Could optimize database queries
- Could improve error messages

VERDICT: ✅ GOOD ENOUGH - Ship it!
```

## Philosophy:
"Good enough" doesn't mean sloppy. It means:
- Works correctly for users
- Maintainable by team
- No technical debt accumulated
- Can iterate and improve

Remember: Perfect is the enemy of good.
Ship working software, then iterate.