# Search Engineering Day Notes

Search through engineering notes for specific topics:

Search query: $ARGUMENTS

## Search Scope:
- All files in `docs/engineering-notes/*.md`
- Search for:
  - Decisions about specific features
  - Problems encountered before
  - Solutions to similar issues
  - Learning notes on topics
  - TODOs that were planned

## Search Types:

### By Tag:
- `#decision` - Find architectural decisions
- `#learned` - Find learning moments
- `#problem` - Find past problems
- `#solution` - Find solutions applied

### By Date Range:
- Last week
- Last month
- Specific date range

### By Content:
- Feature names
- Error messages
- Technology/library names
- Person mentions

## Output Format:
```
Found 3 matches for "database performance":

📅 2024-01-15 - Database Query Optimization
- Problem: User list query taking 3+ seconds
- Solution: Added composite index on (status, created_at)
- Result: Query time reduced to 150ms

📅 2024-01-20 - N+1 Query Issue
- Problem: Profile page making 50+ queries
- Solution: Added eager loading with .include()
- Learned: Always check query count in dev tools

📅 2024-01-25 - Decision: Caching Strategy
- Decided: Redis for session cache, in-memory for static data
- Rationale: Balance between performance and complexity
```

## Additional Features:
- Generate trend analysis (recurring problems)
- Extract all decisions for ADR (Architecture Decision Records)
- Find patterns in problems/solutions
- Create knowledge base from learnings