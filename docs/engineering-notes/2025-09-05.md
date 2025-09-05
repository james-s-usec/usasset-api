# Engineering Notes - September 5, 2025

## Work Log

### 18:00 - PDF Validation System Implementation #solution #learned
**What**: Built complete PDF validation system with progress UI and cancel functionality
**Why**: Users needed to know which PDF pages will fail (like pages 3 & 7) before viewing them
**How**: 
- Backend: Added `GET /api/files/{id}/pdf-validate` endpoint that tests each page at 200px for speed
- Frontend: Added "Validate Pages" button on PDF cards with progress dialog
- Error handling: Graceful fallbacks for unpdf "Missing field `a`" errors
**Result**: 
- Users can preview which pages will fail (30-second validation vs surprise failures during viewing)
- Clean cancel functionality with AbortController
- Progress indication during long validations
**Learned**: 
- unpdf library fails predictably on complex PDF elements - we can catch and handle these
- Progress bars are essential for operations taking >10 seconds
- AbortController provides clean cancellation for fetch requests

### 17:30 - PDF Viewer Zoom & Navigation Fixes #solution
**What**: Fixed locked zoom levels and broken page navigation
**Why**: Users complained about being "locked at 100%" and pages not switching
**How**:
- Expanded zoom range: minZoom: -2, maxZoom: 6 (from 0-3)  
- Fixed page navigation: Added key prop to force ImageOverlay re-render
- Stopped rubber banding: FitBoundsOnLoad only runs once on mount
**Result**: Full zoom control and working page navigation for multi-page PDFs

### 16:45 - PDF Architecture Overhaul #decision
**What**: Replaced complex TileLayer system with simple ImageOverlay approach
**Why**: Tile system causing "Input image exceeds pixel limit" errors and poor performance
**Decision**: Use single 2048px images instead of multiple tiles
**Options Considered**:
1. Fix tile generation errors (complex)
2. Switch to single images (simple)
3. Reduce tile resolution (quality loss)
**Rationale**: Example pages use ImageOverlay successfully, simpler is better
**Trade-offs**: Less granular zoom control, but better reliability and UX
**Result**: Eliminated tile errors, improved performance, cleaner codebase

## Decisions Made

### PDF Validation Caching - Deferred #decision
**Decision**: Skip database caching of validation results for now
**Context**: Validation takes 10-30 seconds and re-runs every time 
**Options Considered**:
1. Add database fields to cache results (requires migration)
2. In-memory caching (lost on restart)
3. Skip for now, implement later
**Rationale**: Prisma detected database drift requiring reset that would lose user data
**Trade-offs**: Users wait for validation each time, but no data loss risk
**Future**: Documented in engineering notes for next iteration

## Problems Encountered

### 16:30 - Complex PDF Page Rendering Failures #problem
**Issue**: Pages 3 & 7 consistently fail with "Missing field `a`" from unpdf library
**Debugging**: Analyzed logs, found 13-second delays before failures
**Solution**: Added fallback error image generation for known unpdf failures
**Prevention**: Validation system now warns users about problematic pages upfront

### 16:15 - Leaflet ImageOverlay Scaling Issues #problem  
**Issue**: PDF images appearing too small when fitting to bounds
**Debugging**: Bounds calculation using scaled logical dimensions didn't match 2048px served images
**Solution**: Calculate bounds using actual served image dimensions (2048px width)
**Prevention**: Always match bounds to actual image size, not logical/scaled dimensions

## Learning Notes
- **TIL**: Browser console investigation of working examples is invaluable for understanding patterns
- **Pattern**: Simple ImageOverlay often outperforms complex tiling for document viewing
- **Tool**: AbortController provides clean cancellation for long-running operations
- **Architecture**: "Simpler is better" - don't over-engineer when basic approach works

## Code Structure Improvements
- Extracted validation logic into custom React hook (`useValidation`)
- Separated dialog components for better reusability  
- Used proper TypeScript interfaces for validation results
- Added comprehensive error handling with user-friendly messages

## Files Modified
- `apps/backend/src/files/controllers/files.controller.ts`: Added PDF validation endpoint
- `apps/backend/src/files/services/pdf-processing.service.ts`: Added validation + fallback logic
- `apps/frontend/src/components/documents/PDFMapContainer.tsx`: Simplified to ImageOverlay
- `apps/frontend/src/components/documents/DocumentsPage.tsx`: Added validation UI
- `apps/frontend/src/components/documents/components/PDFCard.tsx`: Added validate button
- `docs/engineering-notes/2025-09-05/2025-09-05-pdf-render.md`: Updated with findings

## Tomorrow's Priority
1. Address duplicate PDF info requests (performance issue)
2. Test validation system end-to-end with problematic PDFs
3. Consider adding loading states for slow page transitions

## Key Metrics
- PDF validation: ~13 seconds per problematic page, ~1-2 seconds per valid page
- Zoom range: Expanded from 0-3 to -2 to +6 for better user control
- Error handling: Graceful fallbacks instead of HTTP 400 errors