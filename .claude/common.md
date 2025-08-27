# Claude Code Development Rules

**ALWAYS USE FULL PATHS**

DO NOT USE CAT

** its good practice to return something when using sed to confirm it worked. **

## BEFORE Creating Files/Folders
**Ask yourself:**
- Is there a template/generator? `nest g module auth` > manual creation
- Can I scaffold? `npm create vite@latest` > manual setup
- Can I copy existing patterns? `cp -r src/auth src/users && sed -i 's/auth/users/g'`

## BEFORE Using Edit Tools
**Ask yourself:**
- How can focus on strong type safety
- Look for opportunities to use optional chaining and nullish coalescing operators
- Can `sed` fix all instances? `find . -name "*.ts" -exec sed -i 's/old/new/g' {} +`
- Can `awk` transform this data? `awk '{print $2}' file.txt`
- Can I append instead? `echo "export default config;" >> config.ts`
- Can `jq` modify JSON? `jq '.scripts.dev = "pnpm dev"' package.json > tmp && mv tmp package.json`

## BEFORE Reading Files
**Ask yourself:**
- Can `rg` find patterns? `rg -n "class.*Entity" --glob '*.entity.ts'`
- Can `grep` extract lines? `grep "^export" src/index.ts`
- Can `head`/`tail` preview? `head -20 README.md`
- Can `bat` show with syntax? `bat -n --line-range=1:50 src/main.ts`

## BEFORE Finding Files
**Ask yourself:**
- Can `fd` locate faster? `fd -e ts -e tsx --exclude node_modules`
- Can `find` with conditions? `find . -name "*.spec.ts" -mtime -1`
- Need structure only? `tree -L 3 -I 'node_modules|dist' src/`
- Check if exists? `test -f .env && echo "exists" || echo "create it"`

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