# Changelog

All notable changes to the USAsset project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Infinite Re-render Issue**: Fixed infinite re-render loop in project member management
  - Removed function dependencies from `useEffect` in `useProjectMemberActions.ts:87`
  - Only depend on primitive values (`open`, `project?.id`) to prevent callback recreation
- **Users Page Hanging**: Fixed users page stuck in loading state
  - Added initial `fetchUsers()` call on `UsersPage` component mount
  - Properly wired refresh functionality through `UsersPageHeader` component
  - Fixed empty `onRefresh` handler that prevented data loading

### Changed
- **Reduced Log Spam**: Significantly reduced development console spam
  - **Backend**: Removed Prisma query logging (`'query'`) from development environment
  - **Frontend**: Modified debug state hooks to respect configuration settings
  - Debug logging now properly disabled when `config.debug.enabled` is false
  - `useDebugState` returns regular `useState` when debug is disabled for better performance

### Technical Details
- Updated `apps/backend/src/database/prisma.service.ts` - Conditional Prisma logging based on environment
- Updated `apps/frontend/src/hooks/useProjectMemberActions.ts` - Fixed useEffect dependencies
- Updated `apps/frontend/src/pages/UsersPage.tsx` - Added initial data fetch and proper refresh handling  
- Updated `apps/frontend/src/components/UsersPageHeader.tsx` - Added onRefresh prop support
- Updated `apps/frontend/src/hooks/useDebugState.ts` - Conditional debug logging with performance optimization
- Updated `apps/frontend/src/hooks/useDebugStateLogger.ts` - Added disabled parameter support

## [Previous Versions]
- See commit history for changes prior to changelog implementation