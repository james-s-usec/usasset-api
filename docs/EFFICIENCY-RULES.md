## EFFICIENCY RULES

1. **Never read entire files** to check one line - use `grep`/`rg`
2. **Never manually create repetitive structures** - use loops/templates
3. **Never edit file-by-file** for same change - use `find` + `sed`
4. **Never search through node_modules** - always `--glob '!node_modules/*'`
5. **Never guess if process is running** - check with `pgrep`/`lsof`
6. **Never manually format JSON** - pipe through `jq`
7. **Never create similar modules from scratch** - copy and sed
8. **Never manually count** - use `wc -l` or `awk`

For quick checks:
  # Check if files have content (size only)
  wc -l .logs/*lint.log

  # Check if ANY errors exist
  grep -l "error\|Error" .logs/*lint.log 2>/dev/null || echo "No errors found"

  # Just check exit codes
  echo "Backend lint: $([ -s .logs/backend-lint.log ] && echo "has output" || echo "clean")"

  For reading multiple files:
  # Use head instead of cat
  head -n 20 .logs/*lint.log

  # Or loop through them
  for f in .logs/*lint.log; do echo "=== $f ==="; head -n 10 "$f"; done

  For logs specifically:
  # Most recent errors only
  tail -n 5 .logs/*lint.log

  # Or use find with exec
  find .logs -name "*lint.log" -exec head -n 5 {} +

  ## RULES

  **update our existing file to do this, dont create new files, save them as backups, **