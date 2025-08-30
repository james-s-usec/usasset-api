# Daily Standup Report Generator

Generate standup report from git history and day notes:

Format: $ARGUMENTS (or "slack", "teams", "email")

## Generate Report From:
1. Git commits from yesterday
2. Yesterday's engineering notes
3. Today's TODO from yesterday's notes
4. Open pull requests
5. CI/CD status

## Report Format:

### Yesterday:
```
✅ Completed:
- Fixed TypeScript import errors in test files
- Achieved 0 lint errors (down from 218)
- Deployed to Azure (commit: aa8eba2)

📝 PRs Merged:
- #45: Add user authentication
- #46: Fix CORS configuration

🐛 Issues Fixed:
- Resolved database connection timeout
- Fixed CI pipeline false positives
```

### Today:
```
🎯 Planned:
- Implement user profile endpoint
- Add integration tests for auth flow
- Review PR #47

🚧 In Progress:
- User service refactoring (50% complete)
```

### Blockers:
```
🚫 Blocked:
- Waiting for Azure credentials
- Need clarification on business logic for user roles
```

## Auto-Detection:
- Commits with "fix" → Issues Fixed
- Commits with "feat" → Completed Features
- Commits with "WIP" → In Progress
- Failed CI runs → Blockers
- TODO comments added → Today's work

## Integrations:
For Slack format:
```
*Yesterday:* ✅ Fixed import errors, 0 lint errors
*Today:* 🎯 User profile endpoint
*Blockers:* 🚫 Azure credentials needed
```

For detailed format, include:
- Line counts changed
- Test coverage delta
- Performance metrics
- Deploy status