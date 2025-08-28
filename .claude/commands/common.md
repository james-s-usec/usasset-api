# Claude Code Development Rules

**ALWAYS USE FULL PATHS**

Ultimate command:

  npm run ci

  This runs the complete quality gate pipeline:
  🔍 lint → 🔧 typecheck → 🧪 test → 🏗️ build

  Individual gates:
  - npm run lint - ESLint check
  - npm run typecheck - TypeScript validation
  - npm run test - All tests
  - npm run build - Production build

  All results logged to .logs/ folder. Must pass all gates before any commit.

**STRICT QUALITY GATES**
- ALL must pass before ANY commit: lint + build + typecheck + tests
- Zero tolerance: No warnings, no errors, no skipped tests
- Use `npm run ci` to validate all gates pass
- If any gate fails, fix immediately - no exceptions

**STRONG TYPING RULES**
- Never use `any` type - use proper TypeScript types
- Use `unknown` instead of `any` when type is truly unknown
- Prefer `interface` over `type` for object shapes
- Use descriptive interface names: `UserData` not `IUser`
- Enable `strict: true` and `noImplicitAny: true` always

**INTERFACE NAMING**
- Use descriptive names: `UserProfile`, `ApiResponse`
- Avoid Hungarian notation: `UserData` not `IUserData`  
- Be specific: `CreateUserRequest` not `UserInput`

DO NOT USE CAT

**its good practice to return something when using sed to confirm it worked and have it fail if update fails**

## EFFICIENCY COMMANDS

### File Operations
```bash
# Create multiple directories at once
mkdir -p {src,test,docs}/{components,utils,types}

# Copy and rename in one operation
cp template.ts new-feature.ts && sed -i 's/Template/NewFeature/g' new-feature.ts

# Bulk file operations
for f in *.js; do mv "$f" "${f%.js}.ts"; done

# Find and replace across multiple files
rg -l "oldPattern" | xargs sed -i 's/oldPattern/newPattern/g'

# Quick file content preview
head -n 20 file.txt && echo "..." && tail -n 10 file.txt
```

### Search & Analysis
```bash
# Search with context
rg "pattern" -A 3 -B 3 --glob '*.ts'

# Count occurrences
rg "TODO|FIXME" --count-matches

# Find files modified recently
fd -t f --changed-within 1d

# List files by size
ls -lah | sort -k5 -hr | head -10

# Directory sizes
du -sh */ | sort -hr
```

### Process & System
```bash
# Kill process by port
lsof -ti:3000 | xargs kill -9

# Monitor file changes
watchexec --exts ts,js -- npm test

# Quick process check
pgrep -fl "node|npm" || echo "No Node processes"

# Memory usage
ps aux --sort=-%mem | head -10
```

### Package Management
```bash
# Install and save in one command
npm i -D @types/{node,jest} && npm i express

# Check outdated packages
npm outdated --depth=0

# Clean install
rm -rf node_modules package-lock.json && npm install

# Quick dependency audit
npm audit --audit-level moderate
```

### Git Shortcuts
```bash
# Stage and commit
git add . && git commit -m "feat: implement feature"

# Quick status and diff
git status --short && echo "---" && git diff --stat

# Branch operations
git checkout -b feature/name && git push -u origin HEAD

# Clean merged branches
git branch --merged | grep -v main | xargs git branch -d
```

### Development Workflow
```bash
# Full reset and restart
pkill -f "node\|npm" && rm -rf node_modules/.cache && npm start

# Test specific pattern
npm test -- --testNamePattern="UserService"

# Build and serve
npm run build && npx serve dist

# Environment check
env | grep -E "(NODE_|API_|DB_)" | sort
```

## BEFORE USING TOOLS

### Creating Files/Folders
**Ask yourself:**
- Use generators? `nest g module auth` > manual
- Copy patterns? `cp -r src/users src/posts && sed -i 's/users/posts/g' src/posts/*`
- Batch create? `touch src/{auth,users,posts}.{service,controller}.ts`

### Editing Files
**Ask yourself:**
- Bulk replace? `rg -l "old" | xargs sed -i 's/old/new/g'`
- JSON modify? `jq '.scripts.test = "vitest"' package.json > tmp && mv tmp package.json`
- Append only? `echo "export * from './new'" >> index.ts`

### Reading Files
**Ask yourself:**
- Pattern search? `rg "class.*Service" --glob '*.ts' -n`
- Quick preview? `head -20 file.ts | bat -l typescript`
- Structure only? `tree src -I node_modules -L 3`

### Finding Files
**Ask yourself:**
- Fast find? `fd "service.ts$" --exclude node_modules`
- By content? `rg -l "interface.*User" --glob '*.ts'`
- Recent changes? `fd -t f --changed-within 1h`

## KEY PATTERNS

### Search & Replace
```bash
# Find all TypeScript imports
rg "^import.*from" --glob '*.ts' -n

# Bulk rename imports
rg -l "@old/path" | xargs sed -i 's|@old/path|@new/path|g'

# Find and update package versions
sed -i 's/"react": ".*"/"react": "^18.2.0"/g' package.json

# Update all console.logs to logger
find . -name "*.ts" -exec sed -i 's/console\.log/logger.info/g' {} +
```

### File Operations
```bash
# Quick create multiple dirs
mkdir -p src/{auth,users,assets}/{dto,entities,guards}

# Batch create files
for module in auth users assets; do touch src/$module/$module.{service,controller,module}.ts; done

# Copy with rename
cp -r src/auth src/posts && find src/posts -type f -exec sed -i 's/auth/posts/g' {} +

# Find recently modified
fd -t f -e ts --changed-within 1h
```

### Process Management
```bash
# Kill port-blocking processes
fuser -k 3000/tcp 2>/dev/null || true
lsof -ti:5432 | xargs kill -9 2>/dev/null || true

# Check if service running
pgrep -f "nest start" || echo "Not running"

# Restart with cleanup
pkill -f "vite" && rm -rf node_modules/.vite && pnpm dev
```

### Project Analysis
```bash
# Count lines of actual code
rg -c "^(?!\/\/|\/\*|\s*$)" --glob '*.ts' | awk -F: '{sum+=$2} END {print sum}'

# Find TODOs
rg "TODO|FIXME|HACK" -n --glob '!node_modules/*'

# List all endpoints
rg "@(Get|Post|Put|Delete|Patch)\(" --glob '*.controller.ts' -o

# Find unused exports
rg "^export" --glob '*.ts' -o | sort -u > exports.txt
rg "import.*from" --glob '*.ts' -o > imports.txt
```

### Package Management
```bash
# Quick dependency check
jq '.dependencies | keys[]' package.json

# Compare package versions
diff <(jq -S '.dependencies' packages/backend/package.json) <(jq -S '.dependencies' packages/frontend/package.json)

# Find missing types
pnpm ls --depth=0 | grep -E "^├─" | awk '{print $2}' | xargs -I {} sh -c 'pnpm ls @types/{} 2>/dev/null || echo "Missing types for {}"'
```

### Database Operations
```bash
# Quick DB exists check
psql -lqt | cut -d \| -f 1 | grep -qw hvac_db || createdb hvac_db

# Run migrations
npx typeorm migration:run -d dist/config/typeorm.config.js

# Quick seed
psql hvac_db -c "INSERT INTO assets (name, type, status) VALUES ('AC-01', 'AC_UNIT', 'OPERATIONAL');"
```

### Development Workflow
```bash
# Full reset
rm -rf node_modules packages/*/node_modules pnpm-lock.yaml && pnpm install

# Quick test specific file
pnpm test -- --testPathPattern=auth.service

# Watch specific directory
nodemon --watch src/auth --exec "pnpm test auth"

# Environment check
test -f .env || cp .env.example .env
grep -q "JWT_SECRET=" .env || echo "JWT_SECRET=dev-secret" >> .env
```

## EFFICIENCY RULES

1. **Never read entire files** to check one line - use `grep`/`rg`
2. **Never manually create repetitive structures** - use loops/templates
3. **Never edit file-by-file** for same change - use `find` + `sed`
4. **Never search through node_modules** - always `--glob '!node_modules/*'`
5. **Never guess if process is running** - check with `pgrep`/`lsof`
6. **Never manually format JSON** - pipe through `jq`
7. **Never create similar modules from scratch** - copy and sed
8. **Never manually count** - use `wc -l` or `awk`

## COMMON ALIASES TO SET
```bash
alias ports='lsof -PiTCP -sTCP:LISTEN'
alias killport='function _kp(){ fuser -k $1/tcp; }; _kp'
alias nr='npm run'
alias pn='pnpm'
alias tsc='npx tsc --noEmit'
alias tree2='tree -L 2 -I "node_modules|dist"'
alias rgts='rg --glob "*.ts" --glob "!*.spec.ts"'
alias preview='bat -n --line-range=1:50'
```