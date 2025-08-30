# Track Technical Debt

Scan codebase and create/update technical debt inventory:

Scope: $ARGUMENTS

Scan for:
1. TODO/FIXME/HACK comments with dates
2. Functions exceeding complexity limits
3. Files exceeding size limits
4. Duplicated code blocks
5. Missing tests for public methods
6. Deprecated dependencies
7. Security vulnerabilities
8. Performance bottlenecks marked with comments

Create/Update TECH_DEBT.md with:
```markdown
# Technical Debt Register

## Critical (Fix within 1 week)
- [ ] SQL injection risk in UserRepository.findByEmail()
- [ ] No rate limiting on auth endpoints

## High (Fix within sprint)  
- [ ] UserService.createUser() is 85 lines (limit: 30)
- [ ] 5 TODO comments older than 30 days

## Medium (Fix within month)
- [ ] Duplicated validation logic in 3 controllers
- [ ] Missing unit tests for PaymentService

## Low (Fix when touching area)
- [ ] Console.log statements in production code
- [ ] Unused imports in 12 files

## Metrics
- Total debt items: 23
- Critical items: 2
- Debt ratio: 8% (debt lines / total lines)
- Oldest debt: 45 days
```

Interest calculation:
- Debt "interest" increases over time
- After 30 days, priority increases
- Track fix rate vs accumulation rate