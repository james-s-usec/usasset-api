# USAsset3 Current Debug Issues

**Date:** 2025-08-28  
**Project:** USAsset3 (NestJS + React + Prisma + PostgreSQL)  
**Priority:** HIGH - Debug System Critical Bug

## 🚨 **Issue #1: Clear Database Logs Only Deleting 17-19 Records Instead of All**

### **Problem:**
- User reports "Clear DB Logs" button only clearing 17-19 logs at a time
- Expected: Clear ALL database logs (entire `log_entries` table)  
- Actual: Only partial deletion occurring

### **Current Implementation:**
```typescript
// Backend: /apps/backend/src/logs/repositories/logs.repository.ts:86-89
public async deleteAll(): Promise<number> {
  const result = await this.prisma.logEntry.deleteMany({});
  return result.count;
}

// Frontend: FloatingDebugConsole "Clear DB Logs" button
// Calls: LogsApiService.deleteLogs() -> DELETE /logs -> deleteAll()
```

### **Expected vs Actual Behavior:**
- **Expected**: `deleteMany({})` with no WHERE clause should delete ALL records
- **Actual**: Only deleting ~17-19 records per operation
- **Backend Logs Show**: User seeing POST /logs (creating logs) but no DELETE /logs requests

### **Investigation Status:**
✅ **Backend Code Verified**: `deleteMany({})` syntax is correct  
❓ **Frontend API Call**: Need to verify DELETE request is actually being made  
❓ **Database State**: May have corruption from previous memory leak incident  
❓ **Transaction Issues**: Possible connection/transaction limits

### **Debug Information Added:**
```typescript
// Added detailed logging to clearDatabaseLogs() in DebugContext.tsx:
// - Step-by-step debugging
// - Before/after counts
// - API response logging  
// - Verification queries
```

### **Previous Context:**
- Database had corruption from infinite logging loop (memory leak)
- Manually cleared with: `echo "DELETE FROM log_entries;" | npx prisma db execute --stdin`
- Backend crashed with "JavaScript heap out of memory" due to logging cascade
- May have left database in inconsistent state

### **Next Investigation Steps:**
1. **Monitor network requests** - Verify DELETE /logs is actually called
2. **Check database directly** - Connect to PostgreSQL and verify record counts
3. **Test API endpoint manually** - Use curl to test DELETE /logs directly
4. **Check Prisma connection** - Verify no connection pooling issues
5. **Database integrity** - Check for foreign key constraints or triggers

---

## 🔧 **Issue #2: Debug System Architecture Race Conditions (RESOLVED)**

### **Problem (RESOLVED):**
- Floating console and database table had separate data sources
- Race conditions between UI state and database sync
- Memory leak from auto-loading database on mount

### **Solution Applied:**
- Disabled auto-loading from database in DebugContext
- Made systems independent: 
  - Floating Console: UI state only (fast)
  - Database Table: Database queries only (persistent)
- Added manual sync buttons instead of automatic sync

---

## 📊 **System Status:**

### **Current Debug Components:**
✅ **FloatingDebugConsole**: Working - shows UI debug messages  
✅ **Database Logs Table**: Working - shows persistent database logs  
✅ **Settings Page**: Working - can toggle debug console visibility  
✅ **Metadata Viewer**: Working - expandable JSON dialog  
❌ **Clear Database Logs**: BROKEN - only partial deletion  

### **Technical Stack:**
- **Backend**: NestJS + Prisma + PostgreSQL + Winston logging
- **Frontend**: React + TypeScript + Material UI + Vite
- **Database**: PostgreSQL with `log_entries` table
- **Logging**: Comprehensive request/response capture with correlation IDs

### **Files Modified Recently:**
- `/apps/frontend/src/contexts/DebugContext.tsx` - Added detailed clearDatabaseLogs debugging
- `/apps/frontend/src/components/FloatingDebugConsole.tsx` - Enhanced clear buttons
- `/apps/backend/src/logs/` - Added DELETE endpoint and repository methods

---

## 🐛 **Debugging Information for Clear Logs Issue:**

**User-Provided Debug Log Sample:**
```json
{
  "ip": "::1",
  "url": "/logs",
  "method": "POST",
  "duration": 12,
  "timestamp": "2025-08-28T21:29:53.231Z",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "statusCode": 201,
  "requestBody": "{\"level\":\"info\",\"message\":\"Debug Info: Global Debug: Clearing all logs from database\"...}",
  "responseData": "{\"success\":true}"
}
```

**Key Observations:**
- Shows POST /logs (creating logs) but no DELETE /logs requests
- Suggests frontend may not be making DELETE calls
- Or DELETE calls are failing silently

**Expected Debug Output (after enhancement):**
```
1. "Starting database clear operation..." (step: start)
2. "Found X total logs in database" (step: count) 
3. "Calling DELETE /logs endpoint..." (step: delete)
4. "DELETE response: {...}" (step: response)
5. "Verification: X logs remaining after delete" (step: verify)
```

---

## 🎯 **Action Items:**

### **Immediate (HIGH PRIORITY):**
1. **Test the enhanced debug logging** - User should trigger "Clear DB Logs" and provide full debug output
2. **Verify DELETE request** - Check if DELETE /logs appears in network logs
3. **Manual API test** - Direct curl test of DELETE /logs endpoint

### **If DELETE requests are missing:**
- Frontend API service issue
- Button click handler problem
- Promise/async issue

### **If DELETE requests are present but ineffective:**
- Database constraint issue
- Prisma connection problem  
- Transaction rollback
- Foreign key constraints

---

**Updated:** 2025-08-28 21:30 UTC  
**Status:** INVESTIGATING - Waiting for enhanced debug output from user

---

## 🎯 **SOLUTION FOUND - 2025-08-28 22:00 UTC**

### **Root Cause Identified:**
The `addMessage()` function in DebugContext was creating POST /logs requests to save debug messages to the database. When clearing logs, it was creating NEW logs WHILE trying to delete, causing recursive log creation.

### **The Problem Flow:**
1. User clicks "Clear Logs" button
2. `handleClearLogs()` calls `addDebugMessage('info', 'Clearing all logs...')` 
3. `addDebugMessage()` creates a POST /logs request to save this message
4. DELETE /logs runs and deletes all logs
5. More `addDebugMessage()` calls create MORE POST /logs requests
6. `loadLogs()` is called which creates even MORE logs about loading logs
7. Result: Only partial deletion as new logs are created during the delete process

### **Files Fixed:**
1. `/apps/frontend/src/pages/DebugPage.tsx`:
   - Removed all `addDebugMessage()` and `DebugLogger` calls from `handleClearLogs()`
   - Changed `loadLogs()` to accept a `silent` parameter to avoid creating logs about loading logs
   - Increased log fetch limit from 20 to 1000 to show all logs

2. `/apps/frontend/src/contexts/DebugContext.tsx`:
   - Simplified `clearDatabaseLogs()` to just delete without logging
   - Removed `addMessage()` call from `clearMessages()` 
   - Changed to use console.log instead of database logging

### **Next Steps:**
1. Test the Clear Logs button - should now delete ALL logs
2. Consider adding a separate "verbose logging" mode for debugging the debug system itself
3. Add a log count indicator to show total logs in database
4. Consider pagination for large log counts instead of loading 1000 at once