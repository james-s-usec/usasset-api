# Design Pattern Analysis & Implementation Guide

## Pattern Detection Commands

### Current Anti-Pattern Detection
```bash
# Find God Objects (classes doing too much)
rg "class \w+" --glob '*.ts' -A 100 | awk '
/^[^:]*:class/ { file=$0; methods=0; lines=0 }
/^\s*(public|private|protected)?\s*\w+\s*\(/ { methods++ }
/^[^:]*:/ && file { lines++ }
/^--$/ && file { 
  if(methods > 5 || lines > 100) print file " - " methods " methods, " lines " lines"
  file=""
}' | head -10

# Find violation of Single Responsibility Principle
rg "(save|delete|update|find|create|send|email|validate|hash|encrypt)" --count --glob '*service.ts' | awk -F: '$2 > 3 {print $1 " has " $2 " different responsibilities"}'

# Find tight coupling (too many imports)
rg "^import" --count --glob '*.ts' | awk -F: '$2 > 8 {print $1 " has " $2 " imports (high coupling)"}'

# Find missing abstractions (concrete implementations everywhere)
rg "new \w+Service\(" --glob '*.ts' -n | head -10
echo "^ Should use dependency injection instead"
```

### Pattern Implementation Opportunities
```bash
# Find repetitive code (Strategy Pattern candidates)
rg "if.*type.*==.*'(create|update|delete|process)'" --glob '*.ts' -B2 -A2 | head -20

# Find complex object creation (Factory Pattern candidates)  
rg "new \w+\(" --count --glob '*.ts' | awk -F: '$2 > 5 {print $1 " creates " $2 " objects (needs Factory)"}'

# Find event handling mess (Observer Pattern candidates)
rg "(emit|trigger|fire|notify|send).*Event" --glob '*.ts' -n | head -10

# Find data transformation chains (Chain of Responsibility candidates)
rg "(validate|transform|process|filter|map)\(" --count --glob '*.ts' | awk -F: '$2 > 4 {print $1 " has " $2 " transformation steps"}'
```

## Approved Patterns (Following CLAUDE.md Rules)

### 1. Repository Pattern (Data Access Layer)
**✅ GOOD - Follows simple data flow**
```typescript
// user.repository.ts (One thing per file - database only)
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private userEntity: Repository<User>
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userEntity.findOne({ where: { id } });
  }

  async create(userData: CreateUserData): Promise<User> {
    return this.userEntity.save(userData);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    await this.userEntity.update(id, data);
    return this.findById(id);
  }
}
```

**Implementation Command:**
```bash
# Create repository template
create_repository() {
  local entity=$1
  cat > "src/$entity/$entity.repository.ts" << EOF
@Injectable()
export class ${entity^}Repository {
  constructor(
    @InjectRepository($entity^) private ${entity}Entity: Repository<$entity^>
  ) {}

  async findById(id: string): Promise<$entity^ | null> {
    return this.${entity}Entity.findOne({ where: { id } });
  }

  async create(data: Create${entity^}Data): Promise<$entity^> {
    return this.${entity}Entity.save(data);
  }
}
EOF
}
```

### 2. Factory Pattern (Object Creation)
**✅ GOOD - Shallow dependencies, explicit**
```typescript
// user-factory.service.ts (One thing per file - creation only)
@Injectable()
export class UserFactory {
  
  createUser(type: 'admin' | 'customer' | 'vendor', data: CreateUserData): User {
    switch (type) {
      case 'admin':
        return this.createAdminUser(data);
      case 'customer':
        return this.createCustomerUser(data);
      case 'vendor':
        return this.createVendorUser(data);
      default:
        throw new Error(`Unknown user type: ${type}`);
    }
  }

  private createAdminUser(data: CreateUserData): AdminUser {
    return new AdminUser({
      ...data,
      permissions: ['read', 'write', 'delete'],
      role: 'admin'
    });
  }

  private createCustomerUser(data: CreateUserData): CustomerUser {
    return new CustomerUser({
      ...data,
      permissions: ['read'],
      role: 'customer'
    });
  }
}
```

**Detection & Implementation:**
```bash
# Find factory candidates (complex object creation)
rg "new \w+\(" --glob '*service.ts' -B3 -A3 | grep -E "(if|switch|type|kind)"

# Create factory template
create_factory() {
  local domain=$1
  mkdir -p "src/$domain/factories"
  touch "src/$domain/factories/$domain-factory.service.ts"
  echo "Created factory for $domain"
}
```

### 3. Strategy Pattern (Algorithm Variations)
**✅ GOOD - No clever code, explicit behavior**
```typescript
// payment-strategy.interface.ts (Simple interface)
export interface PaymentStrategy {
  process(amount: number, data: PaymentData): Promise<PaymentResult>;
}

// credit-card-strategy.service.ts (One thing per file)
@Injectable()
export class CreditCardStrategy implements PaymentStrategy {
  async process(amount: number, data: CreditCardData): Promise<PaymentResult> {
    // 15 lines - simple, boring implementation
    return { success: true, transactionId: 'cc-123' };
  }
}

// payment-processor.service.ts (Max 5 methods, simple)
@Injectable()
export class PaymentProcessor {
  private strategies = new Map<string, PaymentStrategy>();

  constructor(
    private creditCardStrategy: CreditCardStrategy,
    private paypalStrategy: PaypalStrategy,
    private bankTransferStrategy: BankTransferStrategy
  ) {
    this.strategies.set('credit-card', creditCardStrategy);
    this.strategies.set('paypal', paypalStrategy);
    this.strategies.set('bank-transfer', bankTransferStrategy);
  }

  async processPayment(type: string, amount: number, data: PaymentData): Promise<PaymentResult> {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Unsupported payment type: ${type}`);
    }
    return strategy.process(amount, data);
  }
}
```

**Implementation Commands:**
```bash
# Find strategy pattern candidates
rg "if.*===.*'(type|method|kind)'" --glob '*.ts' -A5 | grep -v "spec.ts"

# Create strategy template
create_strategy_pattern() {
  local domain=$1
  mkdir -p "src/$domain/strategies"
  touch "src/$domain/strategies/$domain-strategy.interface.ts"
  touch "src/$domain/strategies/default-$domain.strategy.ts"
  touch "src/$domain/$domain-processor.service.ts"
}
```

### 4. Observer Pattern (Event Handling)
**✅ GOOD - Loose coupling through events**
```typescript
// order-events.ts (Simple event definitions)
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly total: number
  ) {}
}

// order.service.ts (Business logic only)
@Injectable()
export class OrderService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createOrder(data: CreateOrderData): Promise<Order> {
    const order = await this.orderRepository.create(data);
    
    // Emit event instead of tight coupling
    this.eventEmitter.emit('order.created', 
      new OrderCreatedEvent(order.id, order.userId, order.total)
    );
    
    return order;
  }
}

// email-notification.service.ts (One responsibility - email only)
@Injectable()
export class EmailNotificationService {
  
  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.sendOrderConfirmation(event.orderId);
  }

  private async sendOrderConfirmation(orderId: string): Promise<void> {
    // 20 lines - simple email sending
  }
}
```

### 5. Command Pattern (Actions as Objects)
**✅ GOOD - Explicit commands, simple interface**
```typescript
// command.interface.ts
export interface Command<T = void> {
  execute(): Promise<T>;
}

// create-user.command.ts (One thing per file)
export class CreateUserCommand implements Command<User> {
  constructor(
    private userData: CreateUserData,
    private userService: UserService
  ) {}

  async execute(): Promise<User> {
    return this.userService.create(this.userData);
  }
}

// command-bus.service.ts (Simple dispatcher)
@Injectable()
export class CommandBus {
  async execute<T>(command: Command<T>): Promise<T> {
    return command.execute();
  }
}
```

## ❌ FORBIDDEN PATTERNS (Violate CLAUDE.md Rules)

### 1. Singleton (Global State)
```typescript
// ❌ BAD - Hidden dependencies, global state
class DatabaseConnection {
  private static instance: DatabaseConnection;
  static getInstance() { /* clever code */ }
}
```
**Use Dependency Injection instead**

### 2. Abstract Factory (Too Complex)
```typescript
// ❌ BAD - Too clever, hard to understand
abstract class AbstractWidgetFactory {
  abstract createButton(): AbstractButton;
  abstract createMenu(): AbstractMenu;
}
```
**Use simple Factory instead**

### 3. Decorator Pattern (Runtime Complexity)
```typescript
// ❌ BAD - Runtime complexity, hard to debug
class LoggingDecorator implements Service {
  constructor(private service: Service) {}
  method() { /* wrapper logic */ }
}
```
**Use explicit logging calls instead**

## Pattern Analysis Workflow

### 1. Detect Current Issues
```bash
# Run full pattern analysis
npm run pattern:analyze() {
  echo "🔍 Analyzing current patterns..."
  
  # God objects
  rg "class \w+" --glob '*.ts' -A 50 | awk '/class/ {c++} /}/ && c {if(NR-start > 50) print file; c=0}'
  
  # Missing abstractions  
  rg "new \w+Service" --count --glob '*.ts' | awk -F: '$2 > 3'
  
  # Strategy candidates
  rg "if.*type.*===" --glob '*.ts' -l
  
  # Factory candidates
  rg "new.*\(.*type\|kind\|method" --glob '*.ts' -l
}
```

### 2. Plan Pattern Implementation
```bash
# Create implementation plan
plan_patterns() {
  echo "📋 Pattern Implementation Plan:"
  echo "1. Identify domain boundaries"
  echo "2. Extract repositories (data access)"
  echo "3. Create factories (object creation)"  
  echo "4. Add strategies (algorithm variations)"
  echo "5. Implement observers (loose coupling)"
  echo "6. Validate with npm run ci after each step"
}
```

### 3. Implement One Pattern at a Time
```bash
# Step-by-step implementation
implement_pattern() {
  local pattern=$1
  echo "🔧 Implementing $pattern pattern..."
  
  case $pattern in
    "repository")
      # Extract data access to repositories
      ;;
    "factory") 
      # Extract object creation to factories
      ;;
    "strategy")
      # Extract algorithm variations
      ;;
    "observer")
      # Implement event-driven communication
      ;;
  esac
  
  echo "✅ Running validation..."
  npm run ci
}
```

### 4. Validate Implementation
```bash
# Post-pattern validation
validate_patterns() {
  echo "🎯 Pattern Validation:"
  
  # Check complexity budget still met
  rg "^\s*class \w+" --glob '*.ts' -A 100 | awk '/class/ {lines=0} /^--/ {if(lines>100) violations++} {lines++} END {print violations " files exceed 100 lines"}'
  
  # Check method counts
  rg "^\s*(public|private|protected)?\s*\w+\s*\(" --count --glob '*service.ts' | awk -F: '$2 > 5 {violations++} END {print violations " services exceed 5 methods"}'
  
  # Check dependencies
  rg "^import" --count --glob '*.ts' | awk -F: '$2 > 8 {violations++} END {print violations " files have high coupling"}'
  
  # Final gate
  npm run ci
}
```

## Pattern Implementation Rules

1. **One pattern at a time** - Don't mix multiple pattern changes
2. **Follow data flow** - Controller → Service → Repository → Database
3. **Stay within complexity budget** - Max 5 methods, 30 lines each
4. **No clever implementations** - Boring, explicit code only
5. **Validate continuously** - `npm run ci` after each change
6. **Commit frequently** - Small, focused commits per pattern

**Golden Rule: Patterns must simplify code, not complicate it**