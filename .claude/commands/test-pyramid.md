# Analyze Test Pyramid

Check if tests follow the testing pyramid (many unit, some integration, few E2E):

Module to analyze: $ARGUMENTS

Analysis:
1. Count unit tests (isolated, mocked dependencies)
2. Count integration tests (multiple components)
3. Count E2E tests (full stack)
4. Calculate ratios
5. Identify missing test types
6. Find untested code paths

Ideal pyramid:
```
        /\
       /E2E\      <- 5-10% (Few, expensive, slow)
      /------\
     /  API   \   <- 20-30% (Some, moderate cost)
    /----------\
   / Unit Tests \ <- 60-70% (Many, cheap, fast)
  /--------------\
```

Report:
- Current test distribution
- Missing test coverage
- Over-tested areas (too many E2E for simple logic)
- Under-tested areas (complex logic without unit tests)
- Recommendations for rebalancing

Check for:
- Business logic without unit tests
- API endpoints without integration tests
- Critical paths without E2E tests
- Test runtime (unit should be <100ms each)