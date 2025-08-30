# Profile Performance

Analyze performance of specific operation:

Operation to profile: $ARGUMENTS

Steps:
1. Add timing measurements at key points
2. Check database query performance
3. Look for N+1 query problems
4. Analyze memory usage
5. Check for unnecessary loops
6. Review algorithm complexity

Measurement points:
- Request start
- Validation complete
- Database query start/end
- Business logic processing
- Response serialization
- Total request time

Tools to use:
- console.time() for quick measurements
- Performance hooks for detailed timing
- EXPLAIN ANALYZE for SQL queries
- Memory profiling for heap usage

Report format:
```
Operation: GET /users
Total time: 250ms
Breakdown:
- Validation: 5ms
- DB Query: 180ms (N+1 detected!)
- Processing: 45ms
- Serialization: 20ms

Bottlenecks:
1. Database query using multiple selects instead of join
2. Unnecessary data fetching (selecting all columns)

Recommendations:
1. Use eager loading to prevent N+1
2. Select only needed columns
3. Add database index on user.email
```