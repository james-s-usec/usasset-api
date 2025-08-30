# Engineering Day Notes

Create or append to today's engineering notes:

Entry: $ARGUMENTS

## Actions:
1. Create/update file: `docs/engineering-notes/YYYY-MM-DD.md`
2. Add timestamp and entry
3. Track:
   - What was worked on
   - Decisions made and why
   - Problems encountered
   - Solutions found
   - Things learned
   - TODOs for tomorrow

## Template:
```markdown
# Engineering Notes - [DATE]

## Morning Standup
- Yesterday: [what was completed]
- Today: [planned work]
- Blockers: [any impediments]

## Work Log

### [timestamp] - [feature/task]
**What**: Brief description
**Why**: Business/technical reason
**How**: Approach taken
**Result**: Outcome
**Learned**: Any insights

### [timestamp] - [problem encountered]
**Issue**: What went wrong
**Debugging**: Steps taken
**Solution**: How it was fixed
**Prevention**: How to avoid in future

## Decisions Made
- **Decision**: [what was decided]
  **Context**: [why it matters]
  **Options Considered**: [alternatives]
  **Rationale**: [why this choice]
  **Trade-offs**: [what we're giving up]

## Code Reviews
- PR #[number]: [summary of feedback]

## Learning Notes
- TIL: [something new learned]
- Tool discovered: [useful tool/command]
- Pattern identified: [reusable solution]

## Tomorrow's Priority
1. [Most important task]
2. [Second priority]
3. [Nice to have]

## Week Summary (Fridays only)
- Completed: [major accomplishments]
- Blocked: [ongoing issues]
- Next week: [planned work]
```

Auto-tag with:
- #decision (for architectural decisions)
- #learned (for new knowledge)
- #problem (for bugs/issues)
- #solution (for fixes)

Generate weekly summary from daily notes.