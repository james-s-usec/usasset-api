# PERT Estimation Technique

Estimate task duration using Program Evaluation Review Technique:

Task to estimate: $ARGUMENTS

Process:
1. Break down the task into subtasks
2. For each subtask, estimate:
   - O (Optimistic): Best case, everything goes perfectly
   - N (Nominal/Most Likely): Realistic expectation
   - P (Pessimistic): Worst case, everything goes wrong

3. Calculate PERT estimate: (O + 4N + P) / 6

4. Add up all subtask estimates

5. Add buffer for:
   - Integration time
   - Testing
   - Code review
   - Deployment

Example output:
```
Task: Implement user authentication
Subtasks:
- JWT setup: O=2h, N=4h, P=8h → 4.3h
- Login endpoint: O=1h, N=3h, P=6h → 3.2h
- Middleware: O=2h, N=4h, P=8h → 4.3h
- Tests: O=2h, N=5h, P=10h → 5.3h
Total: 17.1h (~2.5 days)
With integration buffer: 3 days
```