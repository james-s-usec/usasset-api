# Find Broken Windows (Technical Debt)

Search for and report technical debt that needs immediate fixing:

1. Search for TODO/FIXME comments older than 1 week
2. Find any TypeScript `any` types
3. Locate console.log statements in production code  
4. Find commented-out code blocks
5. Identify functions over 30 lines (violating CLAUDE.md rules)
6. Check for unused imports
7. Find missing error handling

Report findings in priority order with fix suggestions.

Search scope: $ARGUMENTS