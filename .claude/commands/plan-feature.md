# Pragmatic Feature Planning - Build on What Exists

Plan new feature by finding and reusing existing patterns:

Feature to plan: $ARGUMENTS

## 1. Find Similar Existing Code
Search for patterns we can copy and modify:
```
- Similar controllers (same CRUD pattern?)
- Similar services (same business logic pattern?)
- Similar DTOs (same validation needs?)
- Similar tests (same test structure?)
```

## 2. Copy-Paste-Modify Strategy
**Pragmatic Principle**: "Prefer boring code over clever code"

Instead of creating from scratch:
1. Find the most similar existing feature
2. Copy the entire module structure
3. Modify for new requirements
4. Refactor common parts later (if needed)

## 3. Feature Template Based on Existing Code

### From User Module → New Feature Module
```bash
# Example: Creating "Asset" feature from "User" feature
cp -r src/user src/asset
find src/asset -type f -exec sed -i 's/user/asset/g' {} +
find src/asset -type f -exec sed -i 's/User/Asset/g' {} +

# Now you have:
src/asset/
├── asset.controller.ts  # Based on user.controller.ts
├── asset.service.ts     # Based on user.service.ts
├── asset.module.ts      # Based on user.module.ts
├── dto/
│   ├── create-asset.dto.ts
│   └── update-asset.dto.ts
└── repositories/
    └── asset.repository.ts
```

## 4. Tracer Bullet Approach
Build minimal version first:
```
Step 1: Copy simplest existing endpoint
Step 2: Modify for new feature
Step 3: Test it works end-to-end
Step 4: Add complexity incrementally
```

## 5. Reuse Existing Patterns

### Controller Pattern (from existing):
```typescript
// Found pattern in UserController - reuse structure
@Controller('assets')
export class AssetController {
  // Copy exact same pattern
  @Post()
  create(@Body() dto: CreateAssetDto) {
    return this.service.create(dto);
  }
  
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.service.findAll(query);
  }
  // ... same CRUD pattern
}
```

### Service Pattern (from existing):
```typescript
// Found pattern in UserService - reuse structure
@Injectable()
export class AssetService {
  // Copy same constructor pattern
  constructor(
    private repository: AssetRepository,
    private logger: DatabaseLoggerService,
  ) {}
  
  // Copy same method patterns
  async create(dto: CreateAssetDto): Promise<Asset> {
    // Same validation pattern
    // Same error handling pattern
    // Same logging pattern
  }
}
```

## 6. Test Pattern Reuse
Copy test structure from similar feature:
```typescript
// Copy from user.service.spec.ts → asset.service.spec.ts
describe('AssetService', () => {
  // Exact same test structure
  // Just change data and expectations
});
```

## 7. Migration Pattern
Based on existing migrations:
```sql
-- Copy structure from create-users-table.sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  -- Same audit fields as users
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 8. Feature Checklist (from existing patterns)

Based on existing features, new feature needs:
- [ ] Controller (copy from similar)
- [ ] Service (copy from similar)
- [ ] Repository (copy from similar)
- [ ] DTOs (copy and modify)
- [ ] Module registration
- [ ] Tests (copy structure)
- [ ] Database migration
- [ ] API documentation
- [ ] Error handling (reuse existing)
- [ ] Logging (reuse existing)
- [ ] Validation (reuse patterns)

## 9. Anti-Patterns to Avoid
DON'T:
- Create new patterns when existing ones work
- Add clever abstractions
- Over-engineer for future possibilities
- Break existing conventions

DO:
- Copy working code
- Modify incrementally
- Keep same structure
- Follow boring patterns

## 10. Output

Generate:
1. List of files to copy from
2. Sed commands to rename
3. Specific modifications needed
4. Test cases to copy
5. Order of implementation

Example output:
```bash
# Feature: Asset Management
# Based on: User Management

# Step 1: Copy structure
cp -r src/user src/asset

# Step 2: Rename (automated)
./scripts/rename-feature.sh user asset

# Step 3: Modify these specific parts:
- Change validation rules in DTOs
- Update repository queries
- Adjust business logic in service

# Step 4: Copy tests
cp test/user.e2e-spec.ts test/asset.e2e-spec.ts

# Step 5: Run tracer bullet
npm test asset.e2e-spec.ts
```

**Remember**: The best code is code you don't have to write!