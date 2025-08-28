# Refactoring Strategy Commands

## Pre-Refactor Validation
```bash
# Always run before starting any refactoring
npm run ci
```

## Complexity Analysis Commands

### Find Large Files (Violating Size Budget)
```bash
# Find files over 100 lines
rg --count '' --glob '*.ts' | awk -F: '$2 > 100 {print $2 " lines: " $1}' | sort -nr

# Find services with too many methods (>5)
rg "^\s*(public|private|protected)?\s*\w+\s*\(" --glob '*service.ts' -c | awk -F: '$2 > 5 {print $2 " methods: " $1}'

# Find files with high cyclomatic complexity (nested if/for/while)
rg "(if|for|while|switch|catch)\s*\(" --count --glob '*.ts' | awk -F: '$2 > 10 {print $2 " branches: " $1}' | sort -nr
```

### Detect Architectural Violations
```bash
# Find controllers doing business logic (should only handle HTTP)
rg "(new|import.*Service)" --glob '*controller.ts' -A2 -B2

# Find services talking to database directly (should use repositories)
rg "(query|findOne|save|delete|create)" --glob '*service.ts' --exclude '*repository*' -n

# Find circular dependencies
rg "import.*from.*\.\." --glob '*.ts' | sort | uniq -c | sort -nr

# Find feature cross-contamination
rg "import.*from.*/(auth|user|asset|order)" --glob '*.ts' -n | grep -v "from './"
```

## Refactoring Strategies

### 1. Extract Service Methods (When Service >5 methods)

**Before (UserService.ts - 8 methods):**
```typescript
class UserService {
  async createUser() { /* 30 lines */ }
  async updateProfile() { /* 25 lines */ }
  async changePassword() { /* 20 lines */ }
  async uploadAvatar() { /* 35 lines */ }
  async sendNotification() { /* 40 lines */ }
  async generateReport() { /* 50 lines */ }
  async exportData() { /* 45 lines */ }
  async validateUser() { /* 15 lines */ }
}
```

**Refactoring Commands:**
```bash
# Create focused services
mkdir -p src/user/{auth,profile,notification,reporting}

# Extract authentication logic
touch src/user/auth/user-auth.service.ts
# Move createUser, changePassword, validateUser

# Extract profile logic  
touch src/user/profile/user-profile.service.ts
# Move updateProfile, uploadAvatar

# Extract notification logic
touch src/user/notification/user-notification.service.ts
# Move sendNotification

# Extract reporting logic
touch src/user/reporting/user-reporting.service.ts
# Move generateReport, exportData
```

**After:**
```typescript
// user-auth.service.ts (3 methods)
class UserAuthService {
  async createUser() { /* 30 lines */ }
  async changePassword() { /* 20 lines */ }
  async validateUser() { /* 15 lines */ }
}

// user-profile.service.ts (2 methods)
class UserProfileService {
  async updateProfile() { /* 25 lines */ }
  async uploadAvatar() { /* 35 lines */ }
}
```

### 2. Split Controller Responsibilities

**Before (Mixed concerns):**
```typescript
@Controller('users')
class UserController {
  async createUser() {
    // HTTP handling + validation + business logic + database
    const data = req.body;
    if (!data.email) throw new Error('Email required');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepo.save({ ...data, password: hashedPassword });
    await this.emailService.sendWelcome(user.email);
    return { id: user.id, message: 'User created' };
  }
}
```

**Refactoring Commands:**
```bash
# Create proper layers
touch src/user/dto/create-user.dto.ts
touch src/user/user.service.ts  
touch src/user/user.repository.ts

# Move validation to DTO
# Move business logic to Service
# Move data access to Repository
```

**After (Separated concerns):**
```typescript
// user.controller.ts (HTTP only)
@Controller('users')
class UserController {
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    return { id: user.id, message: 'User created' };
  }
}

// user.service.ts (Business logic only)
class UserService {
  async createUser(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepo.create({ ...data, password: hashedPassword });
    await this.emailService.sendWelcome(user.email);
    return user;
  }
}

// user.repository.ts (Database only)
class UserRepository {
  async create(userData: any) {
    return this.userEntity.save(userData);
  }
}
```

### 3. Break Down Large Methods (>30 lines)

**Before:**
```typescript
async processOrder(orderData: any) {
  // 80 lines of mixed logic
  const validation = /* 15 lines validation */
  const inventory = /* 20 lines inventory check */
  const payment = /* 25 lines payment processing */
  const shipping = /* 20 lines shipping calculation */
}
```

**Refactoring Commands:**
```bash
# Extract private methods
rg "// \d+ lines" src/order/order.service.ts -n
# Identify logical blocks to extract
```

**After:**
```typescript
async processOrder(orderData: CreateOrderDto) {
  await this.validateOrder(orderData);
  await this.checkInventory(orderData.items);
  const payment = await this.processPayment(orderData.payment);
  const shipping = await this.calculateShipping(orderData.address);
  return this.createOrder({ orderData, payment, shipping });
}

private async validateOrder(data: CreateOrderDto) { /* 15 lines */ }
private async checkInventory(items: OrderItem[]) { /* 20 lines */ }
private async processPayment(payment: PaymentData) { /* 25 lines */ }
```

### 4. Eliminate Feature Cross-Dependencies

**Before (Bad - Direct feature imports):**
```typescript
// In src/order/order.service.ts
import { UserService } from '../user/user.service';
import { ProductService } from '../product/product.service';
import { PaymentService } from '../payment/payment.service';
```

**Refactoring Commands:**
```bash
# Create shared interfaces
mkdir -p src/shared/interfaces
touch src/shared/interfaces/user.interface.ts
touch src/shared/interfaces/product.interface.ts

# Create shared services for cross-feature communication
mkdir -p src/shared/services
touch src/shared/services/user-lookup.service.ts
```

**After (Good - Through shared services):**
```typescript
// In src/order/order.service.ts
import { UserLookupService } from '../../shared/services/user-lookup.service';
import { ProductLookupService } from '../../shared/services/product-lookup.service';

// In src/shared/services/user-lookup.service.ts
@Injectable()
export class UserLookupService {
  constructor(private userService: UserService) {}
  
  async findById(id: string): Promise<UserSummary> {
    return this.userService.findById(id);
  }
}
```

## Automated Refactoring Commands

### Mass Rename Operations
```bash
# Rename interface from IUser to User
rg -l "IUser" --glob '*.ts' | xargs sed -i 's/IUser/User/g'

# Rename service methods consistently
rg -l "getUserById" --glob '*.service.ts' | xargs sed -i 's/getUserById/findUserById/g'

# Fix import paths after moving files
rg -l "from '../old/path" --glob '*.ts' | xargs sed -i "s|from '../old/path|from '../new/path|g"
```

### Create Standard File Structure
```bash
# Create feature structure template
create_feature() {
  local feature=$1
  mkdir -p "src/$feature"/{dto,entities,interfaces,services,controllers,repositories}
  touch "src/$feature/$feature.module.ts"
  touch "src/$feature/controllers/$feature.controller.ts"
  touch "src/$feature/services/$feature.service.ts"
  touch "src/$feature/repositories/$feature.repository.ts"
  echo "Created $feature with standard structure"
}

# Usage: create_feature "inventory"
```

### Complexity Budget Enforcement
```bash
# Check method line counts
check_method_complexity() {
  rg "^\s*(async\s+)?\w+\s*\([^)]*\)\s*{" --glob '*.ts' -A 50 | \
  awk '/^[^:]*:\s*(async\s+)?\w+\s*\([^)]*\)\s*{/ {
    method=$0; lines=0
  } 
  /^[^:]*:\s*}/ && method {
    if(lines > 30) print method " has " lines " lines (MAX: 30)"
    method=""
  } 
  method {lines++}'
}

# Check service method counts  
check_service_size() {
  for file in $(fd -e ts -p service); do
    methods=$(rg "^\s*(public|private|protected)?\s*\w+\s*\(" "$file" -c)
    if [ "$methods" -gt 5 ]; then
      echo "$file has $methods methods (MAX: 5)"
    fi
  done
}
```

## Post-Refactor Validation

### Always Run After Each Refactor Step
```bash
# 1. Verify quality gates still pass
npm run ci

# 2. Check for new architectural violations
rg "(TODO|FIXME|HACK)" --glob '*.ts' -n

# 3. Verify no dead code
rg "export.*=.*{}" --glob '*.ts' -n

# 4. Check import consistency
rg "import.*from.*'\.\./" --count --glob '*.ts' | sort -t: -k2 -nr | head -10
```

## Emergency Rollback Commands
```bash
# If refactoring breaks something, quick rollback
git stash
git reset --hard HEAD~1

# Or selective rollback
git checkout HEAD~1 -- src/problematic/file.ts
```

## Refactoring Workflow
1. **`npm run ci`** - Ensure clean state
2. **Identify violation** - Use analysis commands above  
3. **Plan refactoring** - Choose strategy from examples
4. **Execute step by step** - One change at a time
5. **`npm run ci`** - Validate after each step
6. **Commit** - Small, focused commits
7. **Repeat** - Until all violations resolved

**Golden Rule: Never break the CI pipeline during refactoring**