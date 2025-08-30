# Bash Power Commands for Efficiency

Collection of bash one-liners and helpers for rapid development:

## 🔍 Search & Find

### Find code patterns quickly
```bash
# Find all functions over 30 lines
awk '/function|const.*=.*\(|class/{p=1} p{lines++} /^}/{if(lines>30) print FILENAME":"NR-lines"-"NR; lines=0; p=0}' **/*.ts

# Find all TODO/FIXME with age
git grep -n "TODO\|FIXME" | while read line; do 
  file=$(echo $line | cut -d: -f1)
  lineno=$(echo $line | cut -d: -f2)
  age=$(git blame -L$lineno,+1 $file --date=relative | sed 's/^[^(]*(\([^)]*\)).*/\1/')
  echo "$line | Age: $age"
done

# Find duplicate imports
grep -h "^import" **/*.ts | sort | uniq -c | sort -rn | grep -v "^ *1 "

# Find largest files
find . -name "*.ts" -exec wc -l {} + | sort -rn | head -20
```

## 🚀 Code Generation

### Mass file operations
```bash
# Create multiple files at once
touch src/{service,controller,repository,module}.ts

# Create nested structure quickly  
mkdir -p src/{user,asset,auth}/{dto,entities,services}

# Copy and rename in one go
for f in user.*; do cp $f ${f/user/asset}; done

# Bulk rename with preview
for f in *.spec.ts; do echo mv "$f" "${f/.spec.ts/.test.ts}"; done
# Remove echo to execute
```

## 🔧 Quick Fixes

### Auto-fix common issues
```bash
# Remove all console.log
find . -name "*.ts" -exec sed -i '/console\.log/d' {} +

# Add missing async
sed -i 's/\(function.*\)(/async \1(/' **/*.ts

# Fix import paths
find . -name "*.ts" -exec sed -i "s|'@/|'@app/|g" {} +

# Remove trailing whitespace
find . -name "*.ts" -exec sed -i 's/[[:space:]]*$//' {} +

# Convert tabs to spaces
find . -name "*.ts" -exec sed -i 's/\t/  /g' {} +
```

## 📊 Code Analysis

### Quick metrics
```bash
# Count lines of actual code (no comments/blanks)
find . -name "*.ts" -exec grep -v '^\s*$\|^\s*//' {} + | wc -l

# Function complexity check
grep -c "if\|else\|for\|while\|switch" **/*.ts | sort -t: -k2 -rn | head -20

# Find unused exports
comm -23 <(grep -h "^export" **/*.ts | sort -u) <(grep -h "import.*from" **/*.ts | sort -u)

# Test coverage quick check
npm test -- --coverage 2>/dev/null | grep -E "All files|Statements|Branches|Functions|Lines"
```

## 🔄 Git Helpers

### Efficient git operations
```bash
# Quick commit with issue number
gc() { git add -A && git commit -m "$1 #$2"; }
# Usage: gc "Fix user validation" 123

# Show files changed in last N commits
git diff --name-only HEAD~$1

# Undo last commit but keep changes
git reset --soft HEAD~1

# Find who broke it
git bisect start HEAD HEAD~20
git bisect run npm test

# Clean merged branches
git branch --merged main | grep -v main | xargs -r git branch -d
```

## 🐛 Debug Helpers

### Quick debugging
```bash
# Add debug logging to all functions
sed -i '/^[[:space:]]*async.*function\|^[[:space:]]*function/a\  console.log("DEBUG:", arguments);' file.ts

# Time a command
time npm run build

# Watch file and run command on change
while inotifywait -e modify src/*.ts; do npm test; done

# Port killer
killport() { lsof -ti:$1 | xargs kill -9; }
# Usage: killport 3000
```

## 🏗️ Build & Deploy

### Speed up builds
```bash
# Parallel builds
npm run build:backend & npm run build:frontend & wait

# Only rebuild changed
find src -newer dist -name "*.ts" | xargs -r npx tsc

# Quick deploy check
curl -s localhost:3000/health | jq .status || echo "Backend down"
```

## 📦 NPM Helpers

### Package management
```bash
# Find outdated with breaking changes
npm outdated | grep -E "MAJOR|BREAKING"

# Install exact versions from another project
cat other-project/package.json | jq '.dependencies' | jq -r 'to_entries|.[]|"\(.key)@\(.value)"' | xargs npm install

# Find duplicate packages
npm ls --depth=999 | grep "deduped" | sort | uniq -c | sort -rn

# Clean install
alias clean-install='rm -rf node_modules package-lock.json && npm install'
```

## 🔍 Process Management

### System helpers
```bash
# Find what's using memory
ps aux --sort=-%mem | head -10

# Find what's using CPU
ps aux --sort=-%cpu | head -10

# Watch port usage
watch -n 1 'lsof -i -P -n | grep LISTEN'

# Kill all node processes
pkill -f node
```

## 📝 File Templates

### Quick file creation
```bash
# Create service with boilerplate
new-service() {
  cat > src/$1.service.ts << EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class ${1^}Service {
  constructor() {}
}
EOF
}

# Create test file
new-test() {
  cat > $1.spec.ts << EOF
describe('$1', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
EOF
}
```

## 🎯 Aliases for Speed

Add to ~/.bashrc:
```bash
# Navigation
alias ..='cd ..'
alias ...='cd ../..'
alias ll='ls -lah'
alias src='cd src'

# Git
alias gs='git status'
alias gp='git pull'
alias gpu='git push'
alias gd='git diff'
alias gl='git log --oneline -10'

# NPM
alias ni='npm install'
alias nr='npm run'
alias nt='npm test'
alias nb='npm run build'

# Quick edits
alias bashrc='code ~/.bashrc'
alias reload='source ~/.bashrc'

# Project specific
alias dev='npm run dev'
alias lint='npm run lint'
alias test='npm test'
alias build='npm run build'
alias deploy='./utilities/deployment/update-azure-v2.sh'
```

## 🚄 One-Liner Productivity

```bash
# Find and replace across all files
find . -name "*.ts" -exec sed -i 's/oldPattern/newPattern/g' {} +

# Run command if previous succeeded
npm test && npm run build && echo "Ready to deploy"

# Run command if previous failed
npm test || echo "Tests failed, fix before continuing"

# Conditional execution
[ -f .env ] || cp .env.example .env

# Loop with counter
for i in {1..5}; do echo "Attempt $i"; npm test && break; done

# Parallel execution
echo "Backend Frontend Database" | xargs -n 1 -P 3 -I {} npm run start:{}
```

## 🔧 Custom Functions

Add to project:
```bash
# Check everything before commit
pre-commit() {
  npm run lint && npm run typecheck && npm test && echo "✅ Ready to commit"
}

# Quick API test
test-api() {
  curl -X $1 localhost:3000/api/$2 -H "Content-Type: application/json" -d "$3" | jq
}
# Usage: test-api POST users '{"name":"John"}'

# Find slow tests
slow-tests() {
  npm test -- --verbose 2>&1 | grep "✓\|✗" | sort -k2 -rn | head -10
}
```

Remember: These commands can be combined with pipes for even more power!