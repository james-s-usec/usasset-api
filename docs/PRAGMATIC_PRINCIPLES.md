# Pragmatic Programmer Principles Applied to USAsset

## Core Principles for Daily Development

### 1. 🔧 The Broken Window Theory
**"Don't leave broken windows"** - Fix bad code immediately or it spreads.

#### Implementation in USAsset:
```bash
# Check for broken windows
npm run ci  # If ANY test fails, fix it NOW

# Broken windows to fix immediately:
- Any TypeScript `any` type
- Console.log statements in production code
- Commented-out code blocks
- TODO comments older than 1 week
- Functions over 30 lines (CLAUDE.md rule)
```

#### Command: `broken-windows`
```
User: broken-windows
Claude: Scanning for technical debt...
- Found 3 TODO comments > 1 week old
- Found 2 console.log statements
- Found 1 function with 45 lines
Let's fix these NOW before they multiply.
```

### 2. 🎯 DRY - Don't Repeat Yourself
**"Every piece of knowledge must have a single, unambiguous, authoritative representation"**

#### Examples in Our Code:
```typescript
// ❌ BAD - Knowledge duplicated
const MAX_NAME_LENGTH = 50; // in user.dto.ts
const NAME_LIMIT = 50;      // in validation.ts

// ✅ GOOD - Single source of truth
// constants.ts
export const USER_CONSTRAINTS = {
  MAX_NAME_LENGTH: 50,
  MIN_NAME_LENGTH: 2,
};
```

#### Command: `find-duplication`
```
User: find-duplication
Claude: Searching for duplicated code patterns...
- Found 3 similar validation functions
- Found duplicate error messages in 5 files
- Found repeated API call patterns
```

### 3. 🎪 Tracer Bullets
**"Use tracer bullets to find the target"** - Build end-to-end slices to validate approach.

#### How to Build Features:
```bash
# Instead of building all layers separately:
# ❌ Build all DTOs → Build all services → Build all controllers

# Build a tracer bullet:
# ✅ One DTO → One service method → One controller → One test
# Then iterate and expand
```

#### Command: `tracer [feature]`
```
User: tracer user-registration
Claude: Building minimal end-to-end slice:
1. Create basic DTO with just email/password
2. Create service with just create method
3. Create controller with just POST endpoint
4. Create one integration test
5. Deploy and test in real environment
THEN add validation, error handling, etc.
```

### 4. 🔮 Reversibility
**"There are no final decisions"** - Design for change.

#### Applied to USAsset:
```typescript
// ❌ BAD - Hardcoded dependency
class UserService {
  private db = new PostgreSQLDatabase(); // Can't change
}

// ✅ GOOD - Reversible
class UserService {
  constructor(private db: DatabaseInterface) {} // Can swap
}
```

#### Design Decisions That Are Reversible:
- Database choice (Prisma abstraction)
- Frontend framework (component isolation)
- Deployment platform (containerized)
- Authentication method (strategy pattern)

### 5. 📦 Orthogonality
**"Eliminate effects between unrelated things"** - Changes in one area shouldn't affect others.

#### Our Architecture:
```
Frontend ←→ API ←→ Service ←→ Repository ←→ Database
   ↓         ↓        ↓           ↓           ↓
Can change  Can      Can         Can        Can
UI library  change   change      change     change
            protocol business     ORM        database
                     logic
```

#### Command: `check-coupling`
```
User: check-coupling UserService
Claude: Analyzing UserService dependencies...
- ✅ Depends on interfaces, not implementations
- ⚠️  Direct import from HealthModule (should use events)
- ❌ Contains HTTP logic (should be in controller)
```

### 6. 🎨 Good Enough Software
**"Make it good enough for your users, for future maintainers, for your own peace of mind"**

#### Quality Thresholds:
```yaml
Good Enough Means:
  - ✅ All tests pass
  - ✅ No lint errors
  - ✅ Functions under 30 lines
  - ✅ 80% code coverage
  - ✅ Sub-second response times
  
NOT Good Enough:
  - ❌ "Works on my machine"
  - ❌ "We'll document it later"
  - ❌ "That's an edge case"
  - ❌ "The user won't do that"
```

### 7. 🗑️ Don't Assume, Prove
**"Assumptions are the termites of projects"**

#### Verification Commands:
```bash
# Don't assume the database is up
./verify-deployment.sh

# Don't assume the API works
curl https://api.example.com/health

# Don't assume tests are comprehensive
npm run test:coverage

# Don't assume performance is fine
npm run profile
```

### 8. 📝 The Power of Plain Text
**"Keep knowledge in plain text"** - Human-readable, version-controllable, greppable.

#### What We Keep in Plain Text:
- Configuration (.env files)
- Documentation (Markdown)
- Infrastructure (Bicep/YAML)
- Migrations (SQL)
- Logs (structured text)

#### Why It Matters:
```bash
# Can search everything
rg "DATABASE_URL" --type-add 'config:*.{env,yaml,json}'

# Can diff everything
git diff yesterday..today

# Can process everything
awk '/ERROR/ {print $0}' .logs/*.log
```

### 9. 🔄 Iterate, Don't Big Bang
**"Plan to throw one away; you will anyway"**

#### Feature Development Process:
```
1. Prototype (explore the problem)
2. Throw it away (learn from it)
3. Build it right (apply learnings)
4. Refactor continuously (improve as you learn)
```

### 10. 💀 Design by Contract
**"If it can't happen, use assertions to ensure it can't"**

#### Contract Enforcement:
```typescript
// Service contracts
class UserService {
  async createUser(data: CreateUserDto): Promise<User> {
    // Preconditions
    assert(data.email, 'Email is required');
    assert(data.email.includes('@'), 'Valid email required');
    
    // Invariants
    assert(this.repository, 'Repository must be initialized');
    
    const user = await this.repository.create(data);
    
    // Postconditions
    assert(user.id, 'User must have ID after creation');
    assert(user.createdAt, 'User must have timestamp');
    
    return user;
  }
}
```

### 11. 🧪 Test Early, Test Often, Test Automatically
**"Testing is not about finding bugs, it's about building confidence"**

#### Testing Pyramid for USAsset:
```
        /\
       /E2E\      <- Few (5-10)
      /------\
     /  API   \   <- Some (20-30)
    /----------\
   / Unit Tests \ <- Many (100+)
  /--------------\
```

#### Command: `test-coverage [module]`
```
User: test-coverage UserService
Claude: Analyzing test coverage...
- Line coverage: 85%
- Branch coverage: 72%
- Missing tests for error cases
- No tests for edge cases with null values
```

### 12. 🚨 Fail Fast
**"Crash early, crash often"**

#### Implementation:
```typescript
// ❌ BAD - Silent failure
try {
  await saveUser(data);
} catch (error) {
  // Swallow error, continue
}

// ✅ GOOD - Fail fast
try {
  await saveUser(data);
} catch (error) {
  logger.error('User save failed', error);
  throw new InternalServerError('Cannot continue without user');
}
```

### 13. 🎯 Program Close to the Problem Domain
**"Design and code in the vocabulary of the problem"**

#### Domain Language in Code:
```typescript
// ❌ BAD - Technical language
class DataManager {
  processRecord(obj: any) {}
}

// ✅ GOOD - Domain language
class AssetInventory {
  registerAsset(asset: HVACUnit) {}
}
```

### 14. 🔍 Debugging Mindset
**"Fix the problem, not the blame"**

#### Debugging Process:
1. **Reproduce** - Can't fix what you can't reproduce
2. **Isolate** - Binary search to find the cause
3. **Understand** - Why did it happen?
4. **Fix** - Address root cause, not symptoms
5. **Verify** - Prove it's fixed
6. **Prevent** - Add test to prevent regression

### 15. 📊 Estimate to Avoid Surprises
**"How long will it take?" - Learn to estimate accurately**

#### Estimation Technique:
```
For any task, estimate:
- O (Optimistic): If everything goes perfectly
- N (Nominal): Most likely scenario  
- P (Pessimistic): If everything goes wrong

Estimate = (O + 4N + P) / 6
```

#### Command: `estimate [task]`
```
User: estimate implement-user-auth
Claude: Let's estimate using PERT:
- Optimistic: 2 days (just basic JWT)
- Nominal: 5 days (with proper testing)
- Pessimistic: 10 days (with refactoring)
Estimate: (2 + 20 + 10) / 6 = 5.3 days
```

## 🎓 Pragmatic Commands Summary

| Command | Purpose |
|---------|---------|
| `duck` | Rubber duck debugging |
| `broken-windows` | Find technical debt |
| `find-duplication` | Locate DRY violations |
| `tracer [feature]` | Build end-to-end slice |
| `check-coupling` | Analyze dependencies |
| `test-coverage` | Review test completeness |
| `estimate [task]` | PERT estimation |
| `profile [operation]` | Performance analysis |

## 📚 Pragmatic Bookshelf

Essential reading for the team:
1. **The Pragmatic Programmer** - The foundation
2. **Clean Code** - Uncle Bob's complement to PP
3. **Design Patterns** - Gang of Four patterns
4. **Refactoring** - Martin Fowler's guide
5. **Test Driven Development** - Kent Beck's approach

## 🎯 Daily Pragmatic Checklist

Start each day asking:
- [ ] What broken windows need fixing?
- [ ] What knowledge is duplicated?
- [ ] What assumptions am I making?
- [ ] What could change?
- [ ] What should I prototype first?

End each day asking:
- [ ] Did I leave the code better than I found it?
- [ ] Did I write tests for new code?
- [ ] Did I document decisions?
- [ ] Did I learn something new?
- [ ] Did I share knowledge with the team?

---

*"Kaizen" - Continuous improvement is better than delayed perfection*