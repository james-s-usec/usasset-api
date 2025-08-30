# Add Fail-Fast Checks

Add defensive programming checks to fail fast with clear errors:

Module/Function to protect: $ARGUMENTS

Add these checks:
1. Precondition validation (inputs)
2. Invariant checks (state)
3. Postcondition validation (outputs)
4. Null/undefined checks
5. Type guards for external data

Example transformations:
```typescript
// BEFORE - Silent failure
async function getUser(id: string) {
  const user = await db.find(id);
  return user?.name;
}

// AFTER - Fail fast
async function getUser(id: string) {
  // Precondition
  if (!id) throw new Error('User ID is required');
  if (!isValidUUID(id)) throw new Error('Invalid user ID format');
  
  const user = await db.find(id);
  
  // Postcondition
  if (!user) throw new UserNotFoundError(id);
  if (!user.name) throw new DataIntegrityError('User missing name');
  
  return user.name;
}
```