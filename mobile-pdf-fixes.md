# Mobile PDF Viewer Fixes

## Issues Fixed:
1. **Small corner loading** - PDF was starting at zoom=0 (fully zoomed out)
2. **No auto-fit** - PDF wasn't fitting to screen on load
3. **100vh height issue** - Mobile browsers cut off content with address bar
4. **Dialog too tall** - 70vh was too much for mobile screens

## Solutions Applied:

### PDFViewer.tsx
- Changed height from `100vh` to `100dvh` on mobile (dynamic viewport)
- Changed initial zoom from `0` to `1`
- Added `fitBounds()` on load to auto-fit PDF to screen
- MapEventHandler now fits bounds on initial load

### PDFPreviewDialog.tsx
- Changed height to responsive: `60vh` mobile, `70vh` desktop
- Changed initial zoom from `0` to `1`
- Added FitBoundsOnLoad component to auto-fit PDF
- PDF now centers and fits properly on all screens

## Technical Details:
- `dvh` (dynamic viewport height) adjusts for mobile browser chrome
- `fitBounds()` ensures PDF fills available space
- Initial zoom=1 prevents tiny corner rendering
- Responsive breakpoints handle different screen sizes