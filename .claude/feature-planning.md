# Feature Planning & Design Pattern Guide

## New Feature Planning Commands

### 1. Feature Analysis & Planning
```bash
# Analyze feature requirements
plan_feature() {
  local feature=$1
  echo "🎯 Planning feature: $feature"
  echo "📋 Requirements gathering:"
  echo "1. What entities does this feature manage?"
  echo "2. What actions can users perform?"
  echo "3. What business rules apply?"
  echo "4. What external systems integrate?"
  echo "5. What data needs persistence?"
  echo ""
  echo "📁 Suggested structure:"
  echo "src/$feature/"
  echo "├── controllers/     # HTTP endpoints only"
  echo "├── services/        # Business logic only" 
  echo "├── repositories/    # Database access only"
  echo "├── dto/            # Data transfer objects"
  echo "├── entities/       # Database entities"
  echo "├── interfaces/     # Contracts & types"
  echo "└── $feature.module.ts"
}
```

### 2. Feature Complexity Assessment
```bash
# Assess feature complexity before building
assess_complexity() {
  local feature=$1
  echo "🔍 Complexity Assessment for $feature:"
  echo ""
  echo "SIMPLE (1-2 services, 1-3 controllers):"
  echo "- CRUD operations on single entity"
  echo "- Basic validation rules"
  echo "- No complex business logic"
  echo "Example: User Profile, Product Catalog"
  echo ""
  echo "MODERATE (2-4 services, 2-5 controllers):"
  echo "- Multiple related entities"
  echo "- Business rules and workflows"
  echo "- Integration with 1-2 external systems"
  echo "Example: Order Management, Asset Tracking"
  echo ""
  echo "COMPLEX (4+ services, 5+ controllers):"
  echo "- Multiple domain boundaries"
  echo "- Complex workflows and state machines"
  echo "- Multiple external integrations"
  echo "Example: Payment Processing, Workflow Engine"
  echo ""
  echo "⚠️  If COMPLEX, break into smaller features first!"
}
```

## Design Pattern Selection for New Features

### Repository Pattern (Always Required)
**Use when:** Every feature needs data persistence
```bash
# Create repository structure
create_repository_layer() {
  local feature=$1
  mkdir -p "src/$feature/repositories"
  
  cat > "src/$feature/repositories/$feature.repository.ts" << 'EOF'
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FeatureRepository {
  constructor(
    @InjectRepository(FeatureEntity) 
    private featureEntity: Repository<FeatureEntity>
  ) {}

  async findById(id: string): Promise<FeatureEntity | null> {
    return this.featureEntity.findOne({ where: { id } });
  }

  async create(data: CreateFeatureData): Promise<FeatureEntity> {
    return this.featureEntity.save(data);
  }

  async update(id: string, data: UpdateFeatureData): Promise<void> {
    await this.featureEntity.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.featureEntity.delete(id);
  }
}
EOF

  echo "✅ Repository layer created for $feature"
}
```

### Factory Pattern 
**Use when:** Feature needs to create different types of objects
```bash
# When to use factory pattern
consider_factory() {
  echo "🏭 Use Factory Pattern when:"
  echo "✅ Creating different user types (admin, customer, vendor)"
  echo "✅ Creating different payment methods (card, paypal, bank)"
  echo "✅ Creating different notification types (email, sms, push)"
  echo "✅ Creating different asset types (equipment, vehicle, software)"
  echo ""
  echo "❌ Don't use for simple object creation"
}

create_factory() {
  local feature=$1
  local types=$2  # comma-separated: "admin,customer,vendor"
  
  mkdir -p "src/$feature/factories"
  
  cat > "src/$feature/factories/$feature-factory.service.ts" << EOF
import { Injectable } from '@nestjs/common';

export type ${feature^}Type = '${types//,/\' | \'}';

@Injectable()
export class ${feature^}Factory {
  create(type: ${feature^}Type, data: Create${feature^}Data): ${feature^}Entity {
    switch (type) {
$(echo "$types" | tr ',' '\n' | while read -r type; do
  echo "      case '$type':"
  echo "        return this.create${type^}${feature^}(data);"
done)
      default:
        throw new Error(\`Unknown $feature type: \${type}\`);
    }
  }

$(echo "$types" | tr ',' '\n' | while read -r type; do
  echo "  private create${type^}${feature^}(data: Create${feature^}Data): ${type^}${feature^}Entity {"
  echo "    return new ${type^}${feature^}Entity({"
  echo "      ...data,"
  echo "      type: '$type',"
  echo "      // $type-specific logic here"
  echo "    });"
  echo "  }"
  echo ""
done)
}
EOF

  echo "✅ Factory created for $feature with types: $types"
}
```

### Strategy Pattern
**Use when:** Feature has multiple algorithms or behaviors
```bash
# When to use strategy pattern
consider_strategy() {
  echo "📋 Use Strategy Pattern when:"
  echo "✅ Different calculation methods (tax, shipping, pricing)"
  echo "✅ Different validation rules per context"
  echo "✅ Different processing workflows"
  echo "✅ Different integrations (payment providers, email services)"
  echo ""
  echo "❌ Don't use for simple if/else logic"
}

create_strategy_pattern() {
  local feature=$1
  local strategies=$2  # comma-separated
  
  mkdir -p "src/$feature/strategies"
  
  # Create interface
  cat > "src/$feature/strategies/$feature-strategy.interface.ts" << EOF
export interface ${feature^}Strategy {
  execute(data: ${feature^}Data): Promise<${feature^}Result>;
}
EOF

  # Create concrete strategies
  echo "$strategies" | tr ',' '\n' | while read -r strategy; do
    cat > "src/$feature/strategies/${strategy}-${feature}.strategy.ts" << EOF
import { Injectable } from '@nestjs/common';
import { ${feature^}Strategy } from './$feature-strategy.interface';

@Injectable()
export class ${strategy^}${feature^}Strategy implements ${feature^}Strategy {
  async execute(data: ${feature^}Data): Promise<${feature^}Result> {
    // ${strategy} implementation here
    throw new Error('Not implemented');
  }
}
EOF
  done

  # Create context/processor
  cat > "src/$feature/services/$feature-processor.service.ts" << EOF
import { Injectable } from '@nestjs/common';
import { ${feature^}Strategy } from '../strategies/$feature-strategy.interface';

@Injectable()
export class ${feature^}Processor {
  private strategies = new Map<string, ${feature^}Strategy>();

  constructor(
$(echo "$strategies" | tr ',' '\n' | while read -r strategy; do
  echo "    private ${strategy}Strategy: ${strategy^}${feature^}Strategy,"
done)
  ) {
$(echo "$strategies" | tr ',' '\n' | while read -r strategy; do
  echo "    this.strategies.set('$strategy', ${strategy}Strategy);"
done)
  }

  async process(type: string, data: ${feature^}Data): Promise<${feature^}Result> {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(\`Unknown strategy: \${type}\`);
    }
    return strategy.execute(data);
  }
}
EOF

  echo "✅ Strategy pattern created for $feature with strategies: $strategies"
}
```

### Observer Pattern
**Use when:** Feature needs to notify other parts of the system
```bash
# When to use observer pattern
consider_observer() {
  echo "👁️  Use Observer Pattern when:"
  echo "✅ Need to trigger notifications (email, sms, push)"
  echo "✅ Need to update related data (inventory, analytics, logs)"  
  echo "✅ Need to integrate with external systems"
  echo "✅ Want loose coupling between features"
  echo ""
  echo "❌ Don't use for simple method calls within same feature"
}

create_events() {
  local feature=$1
  local events=$2  # comma-separated: "created,updated,deleted"
  
  mkdir -p "src/$feature/events"
  
  echo "$events" | tr ',' '\n' | while read -r event; do
    cat > "src/$feature/events/$feature-$event.event.ts" << EOF
export class ${feature^}${event^}Event {
  constructor(
    public readonly ${feature}Id: string,
    public readonly userId: string,
    public readonly timestamp: Date = new Date(),
    public readonly data?: any
  ) {}
}
EOF
  done

  # Update service to emit events
  echo "📝 Add to your ${feature}.service.ts:"
  echo "constructor(private eventEmitter: EventEmitter2) {}"
  echo ""
  echo "$events" | tr ',' '\n' | while read -r event; do
    echo "// In your $event method:"
    echo "this.eventEmitter.emit('$feature.$event', new ${feature^}${event^}Event(id, userId));"
    echo ""
  done

  echo "✅ Events created for $feature: $events"
}
```

### Command Pattern
**Use when:** Feature has complex operations that need to be queued/logged
```bash
# When to use command pattern
consider_command() {
  echo "⚡ Use Command Pattern when:"
  echo "✅ Need operation queuing/scheduling"
  echo "✅ Need undo/redo functionality"
  echo "✅ Need operation logging/auditing"
  echo "✅ Need batch operations"
  echo ""
  echo "❌ Don't use for simple CRUD operations"
}

create_commands() {
  local feature=$1
  local commands=$2  # comma-separated
  
  mkdir -p "src/$feature/commands"
  
  # Create command interface
  cat > "src/$feature/commands/command.interface.ts" << EOF
export interface Command<T = void> {
  execute(): Promise<T>;
}
EOF

  # Create concrete commands
  echo "$commands" | tr ',' '\n' | while read -r command; do
    cat > "src/$feature/commands/${command}-${feature}.command.ts" << EOF
import { Command } from './command.interface';

export class ${command^}${feature^}Command implements Command<${feature^}Entity> {
  constructor(
    private data: ${command^}${feature^}Data,
    private ${feature}Service: ${feature^}Service
  ) {}

  async execute(): Promise<${feature^}Entity> {
    return this.${feature}Service.${command}(this.data);
  }
}
EOF
  done

  # Create command bus
  cat > "src/$feature/services/$feature-command-bus.service.ts" << EOF
import { Injectable } from '@nestjs/common';
import { Command } from '../commands/command.interface';

@Injectable()
export class ${feature^}CommandBus {
  async execute<T>(command: Command<T>): Promise<T> {
    return command.execute();
  }

  async executeBatch<T>(commands: Command<T>[]): Promise<T[]> {
    return Promise.all(commands.map(cmd => cmd.execute()));
  }
}
EOF

  echo "✅ Commands created for $feature: $commands"
}
```

## Feature Scaffolding Commands

### Complete Feature Generator
```bash
# Generate complete feature structure
generate_feature() {
  local feature=$1
  local complexity=${2:-"simple"}  # simple|moderate|complex
  
  echo "🏗️  Generating $feature feature ($complexity complexity)..."
  
  # Base structure
  mkdir -p "src/$feature"/{controllers,services,repositories,dto,entities,interfaces}
  
  # Create module
  cat > "src/$feature/$feature.module.ts" << EOF
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${feature^}Controller } from './controllers/$feature.controller';
import { ${feature^}Service } from './services/$feature.service';
import { ${feature^}Repository } from './repositories/$feature.repository';
import { ${feature^}Entity } from './entities/$feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([${feature^}Entity])],
  controllers: [${feature^}Controller],
  providers: [${feature^}Service, ${feature^}Repository],
  exports: [${feature^}Service],
})
export class ${feature^}Module {}
EOF

  # Create basic files based on complexity
  case $complexity in
    "simple")
      create_simple_feature "$feature"
      ;;
    "moderate") 
      create_moderate_feature "$feature"
      ;;
    "complex")
      echo "⚠️  Complex features should be broken down first!"
      echo "Consider splitting into multiple simple/moderate features"
      ;;
  esac
  
  echo "✅ Feature $feature generated successfully"
  echo "🎯 Next steps:"
  echo "1. Define your entity in entities/$feature.entity.ts"
  echo "2. Create DTOs in dto/ folder"
  echo "3. Implement business logic in services/"
  echo "4. Add tests: npm run test"
  echo "5. Validate: npm run ci"
}

create_simple_feature() {
  local feature=$1
  
  # Controller (HTTP only)
  cat > "src/$feature/controllers/$feature.controller.ts" << EOF
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ${feature^}Service } from '../services/$feature.service';
import { Create${feature^}Dto, Update${feature^}Dto } from '../dto';

@Controller('$feature')
export class ${feature^}Controller {
  constructor(private ${feature}Service: ${feature^}Service) {}

  @Get()
  async findAll() {
    return this.${feature}Service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.${feature}Service.findById(id);
  }

  @Post()
  async create(@Body() createDto: Create${feature^}Dto) {
    return this.${feature}Service.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Update${feature^}Dto) {
    return this.${feature}Service.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.${feature}Service.delete(id);
  }
}
EOF

  # Service (Business logic only)
  cat > "src/$feature/services/$feature.service.ts" << EOF
import { Injectable } from '@nestjs/common';
import { ${feature^}Repository } from '../repositories/$feature.repository';
import { Create${feature^}Dto, Update${feature^}Dto } from '../dto';

@Injectable()
export class ${feature^}Service {
  constructor(private ${feature}Repository: ${feature^}Repository) {}

  async findAll() {
    return this.${feature}Repository.findAll();
  }

  async findById(id: string) {
    return this.${feature}Repository.findById(id);
  }

  async create(createDto: Create${feature^}Dto) {
    return this.${feature}Repository.create(createDto);
  }

  async update(id: string, updateDto: Update${feature^}Dto) {
    return this.${feature}Repository.update(id, updateDto);
  }

  async delete(id: string) {
    return this.${feature}Repository.delete(id);
  }
}
EOF

  # Repository template
  create_repository_layer "$feature"
  
  echo "✅ Simple feature structure created"
}

create_moderate_feature() {
  local feature=$1
  
  # Create simple feature first
  create_simple_feature "$feature"
  
  # Add events
  mkdir -p "src/$feature/events"
  create_events "$feature" "created,updated,deleted"
  
  # Add basic validation
  mkdir -p "src/$feature/validators"
  
  echo "✅ Moderate feature structure created with events"
}
```

## Feature Planning Workflow

### 1. Requirements Analysis
```bash
analyze_requirements() {
  echo "📊 Feature Requirements Analysis:"
  echo "1. 🎯 What problem does this solve?"
  echo "2. 👥 Who are the users?"
  echo "3. 📝 What are the user stories?"
  echo "4. 🔄 What are the workflows?"
  echo "5. 📊 What data is involved?"
  echo "6. 🔌 What integrations are needed?"
  echo "7. 📏 What are the constraints?"
  echo ""
  echo "📋 Document answers in src/$feature/README.md"
}
```

### 2. Pattern Selection Decision Tree
```bash
select_patterns() {
  local feature=$1
  echo "🎯 Pattern Selection for $feature:"
  echo ""
  echo "✅ Always include:"
  echo "- Repository Pattern (data access)"
  echo ""
  echo "🤔 Consider if needed:"
  echo "- Factory Pattern: Multiple object types? (yes/no)"
  echo "- Strategy Pattern: Multiple algorithms? (yes/no)" 
  echo "- Observer Pattern: Need notifications? (yes/no)"
  echo "- Command Pattern: Complex operations? (yes/no)"
  echo ""
  echo "❌ Avoid:"
  echo "- Singleton, Abstract Factory, Decorator"
  echo ""
  echo "🎯 Keep it simple - only add patterns that solve real problems"
}
```

### 3. Implementation Plan
```bash
create_implementation_plan() {
  local feature=$1
  echo "📅 Implementation Plan for $feature:"
  echo ""
  echo "Phase 1: Core Structure (1-2 days)"
  echo "✅ 1. Generate feature scaffold"
  echo "✅ 2. Define entities and DTOs"
  echo "✅ 3. Implement repository layer"
  echo "✅ 4. Create basic service & controller"
  echo "✅ 5. Add unit tests"
  echo "✅ 6. Validate: npm run ci"
  echo ""
  echo "Phase 2: Business Logic (2-3 days)"
  echo "✅ 1. Implement business rules"
  echo "✅ 2. Add validation logic"
  echo "✅ 3. Add error handling"
  echo "✅ 4. Add integration tests"
  echo "✅ 5. Validate: npm run ci"
  echo ""
  echo "Phase 3: Integration (1-2 days)"
  echo "✅ 1. Add selected patterns (factory, strategy, etc.)"
  echo "✅ 2. Add event handling if needed"
  echo "✅ 3. Add external integrations"
  echo "✅ 4. Add e2e tests"
  echo "✅ 5. Final validation: npm run ci"
  echo ""
  echo "🎯 Commit frequently, validate continuously"
}
```

## Usage Examples

```bash
# Plan a new user management feature
plan_feature "user-management"
assess_complexity "user-management"
select_patterns "user-management"

# Generate the feature
generate_feature "user-management" "moderate"

# Add specific patterns as needed
create_factory "user-management" "admin,customer,vendor"
create_events "user-management" "created,updated,deleted,activated"

# Create implementation plan
create_implementation_plan "user-management"
```

**Golden Rules:**
1. **Plan before coding** - Always use these commands first
2. **Start simple** - Add complexity only when needed  
3. **Follow data flow** - Controller → Service → Repository → Database
4. **Validate continuously** - `npm run ci` after each step
5. **One pattern at a time** - Don't mix pattern implementations