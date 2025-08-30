# Find Code Duplication (DRY Violations)

Analyze codebase for duplicated code that violates DRY principle:

1. Search for similar code patterns across files
2. Find duplicated constants/magic numbers
3. Locate repeated error messages
4. Identify copy-pasted functions with minor variations
5. Find duplicated validation logic
6. Check for repeated API call patterns

Use ripgrep to find patterns, then analyze for similarity.

Focus area: $ARGUMENTS

Report format:
- Show each duplication with file locations
- Suggest how to refactor into shared code
- Prioritize by impact (how many times duplicated)