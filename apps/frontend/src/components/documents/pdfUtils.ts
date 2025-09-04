import L, { CRS, LatLngBounds } from 'leaflet';

export const createPDFCRS = (_width: number, height: number): L.CRS => {
  // Standard PDF coordinate system: use original dimensions
  // Backend renders at 4x, so we need to account for that in transformation
  const scale = 1/4; // Scale down from 4x backend rendering to logical size
  return L.extend({}, CRS.Simple, {
    transformation: new L.Transformation(scale, 0, -scale, height * scale)
  });
};

export const createPDFBounds = (width: number, height: number): LatLngBounds => {
  // Use logical PDF dimensions (divide backend 4x scale back to original)
  const logicalWidth = width / 4;
  const logicalHeight = height / 4;
  return new LatLngBounds([0, 0], [logicalHeight, logicalWidth]);
};

export const getPDFDimensions = (pdfInfo: { dimensions: { width: number; height: number } }): { logicalWidth: number; logicalHeight: number } => {
  const logicalWidth = pdfInfo.dimensions.width / 4;
  const logicalHeight = pdfInfo.dimensions.height / 4;
  return { logicalWidth, logicalHeight };
};