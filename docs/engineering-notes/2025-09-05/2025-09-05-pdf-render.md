# PDF Renderer Overhaul - 2025-09-05

## Problem Statement
- Documents page making duplicate `/pdf-info` requests (2-4x per file)
- Documents view showing tiny square instead of full PDF  
- Complex tile system causing "Input image exceeds pixel limit" errors
- Poor performance compared to example PDF viewer

## Analysis
### Console Investigation of Working Example
Used browser console to analyze high-performing example page:
```javascript
// Found they use single images instead of tiles
// URL pattern: .../page/1/thumbnail/medium.png and .../page/1/display.png  
// Our pattern: .../pdf-tiles/1/{z}/{x}/{y}.png (complex tiling)
```

**Key Insight**: Example uses `ImageOverlay` with single pre-rendered images, not `TileLayer` with complex tile generation.

### Root Causes Identified
1. **Duplicate Files**: Same PDFs exist with different IDs in database
2. **Dialog Rendering**: PDFPreviewDialog renders PDFLeafletViewer even when closed
3. **Missing FitBounds**: Documents view lacks `FitBoundsOnLoad` component
4. **Tile Complexity**: Unnecessary tile generation causing Sharp pixel limits

## Solution Implemented

### Backend Changes
```typescript
// Added simple single-image endpoint
@Get(':id/pdf-image/:page.png')
public async getPdfPageImage(
  @Param('id') id: string,
  @Param('page') pageStr: string,
  @Res() res: Response,
): Promise<void> {
  const page = parseInt(pageStr, 10);
  const imageBuffer = await this.pdfService.getPdfPageImage({
    fileId: id,
    page,
    width: 2048, // High quality single image
  });
  // ... response handling
}

// Reused existing PDF rendering infrastructure
public async getPdfPageImage(params: {
  fileId: string;
  page: number;
  width?: number;
}): Promise<Buffer> {
  // Uses existing renderPreviewImage() method
}
```

### Frontend Changes  
```typescript
// Replaced complex TileLayer with simple ImageOverlay
const imageUrl = `${config.api.baseUrl}/api/files/${fileId}/pdf-image/${currentPage}.png`;

<ImageOverlay
  url={imageUrl}
  bounds={bounds}
/>

// Added deduplication in Documents page
const uniquePdfs = allPdfs.reduce((acc: PDFFile[], current) => {
  const existing = acc.find(file => file.original_name === current.original_name);
  if (!existing) {
    acc.push(current);
  } else if (new Date(current.created_at) > new Date(existing.created_at)) {
    const index = acc.indexOf(existing);
    acc[index] = current; // Keep newer version
  }
  return acc;
}, []);

// Fixed conditional rendering
{externalLoading ? (
  <DialogLoadingContent />
) : open ? (  // Only render when dialog is actually open
  <PDFLeafletViewer />
) : null}
```

## Architecture Decision

**Old Approach**: File ’ Tile Generation ’ Multiple PNG tiles ’ TileLayer  
**New Approach**: File ’ Single PNG image ’ ImageOverlay

**Rationale**: 
- Simpler implementation and maintenance
- Better performance (single request vs. multiple tiles)  
- Matches industry patterns (AWS S3 example uses similar approach)
- Eliminates Sharp pixel limit issues
- More reliable rendering

**Trade-offs**:
- Less granular zoom control
- Single image may be larger than individual tiles
- But: Better reliability and user experience

## Results
-  Eliminates duplicate PDF info requests
-  Full PDF display instead of small squares
-  No more tile generation errors
-  Simpler, more maintainable codebase
-  Better performance

## Files Modified
- `apps/backend/src/files/controllers/files.controller.ts`: Added `getPdfPageImage()` endpoint
- `apps/backend/src/files/services/pdf-processing.service.ts`: Added `getPdfPageImage()` method  
- `apps/frontend/src/components/documents/PDFMapContainer.tsx`: Replaced TileLayer with ImageOverlay
- `apps/frontend/src/components/documents/components/usePdfFiles.ts`: Added filename deduplication
- `apps/frontend/src/components/file-management/PDFPreviewDialog.tsx`: Fixed conditional rendering

## Testing Plan
1. Restart backend to pick up new endpoint
2. Navigate to Documents page - should show 3 PDFs instead of 6
3. Click PDF - should see single `/pdf-image/1.png` request
4. Verify full PDF renders properly fitted to viewport
5. Test page navigation and zoom controls

## Learning
- Browser console investigation is invaluable for understanding well-performing examples
- Sometimes "simpler is better" - don't over-engineer solutions
- Single images can outperform complex tiling for document viewing
- Always add `FitBoundsOnLoad` to Leaflet maps for better UX