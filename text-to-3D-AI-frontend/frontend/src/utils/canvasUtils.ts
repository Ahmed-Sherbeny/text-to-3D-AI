/**
 * Canvas Utilities
 * Step 9: Image preprocessing and export functions
 */

import type { ExportOptions, CanvasExportResult, PreprocessingOptions } from '@/types/sketch';

/**
 * Convert canvas to grayscale
 */
export function convertToGrayscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // Alpha (data[i + 3]) remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Remove transparent/white background
 */
export function removeBackground(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Make white/near-white pixels fully transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // If pixel is white or near-white (threshold: 240)
    if (r > 240 && g > 240 && b > 240) {
      data[i + 3] = 0; // Make transparent
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Resize canvas while preserving aspect ratio
 */
export function resizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  preserveAspectRatio: boolean = true
): HTMLCanvasElement {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('Canvas context not available');

  let width = targetWidth;
  let height = targetHeight;

  if (preserveAspectRatio) {
    const aspectRatio = sourceCanvas.width / sourceCanvas.height;
    if (aspectRatio > 1) {
      // Landscape
      height = targetWidth / aspectRatio;
    } else {
      // Portrait
      width = targetHeight * aspectRatio;
    }
  }

  tempCanvas.width = targetWidth;
  tempCanvas.height = targetHeight;

  // Fill with white background
  tempCtx.fillStyle = '#FFFFFF';
  tempCtx.fillRect(0, 0, targetWidth, targetHeight);

  // Center the resized image
  const x = (targetWidth - width) / 2;
  const y = (targetHeight - height) / 2;

  tempCtx.drawImage(sourceCanvas, x, y, width, height);

  return tempCanvas;
}

/**
 * Preprocess canvas image
 */
export function preprocessCanvas(
  canvas: HTMLCanvasElement,
  options: PreprocessingOptions
): HTMLCanvasElement {
  let processedCanvas = canvas;

  // Resize
  if (options.targetWidth && options.targetHeight) {
    processedCanvas = resizeCanvas(
      processedCanvas,
      options.targetWidth,
      options.targetHeight,
      options.preserveAspectRatio
    );
  }

  // Remove background
  if (options.removeBackground) {
    processedCanvas = removeBackground(processedCanvas);
  }

  // Convert to grayscale
  if (options.grayscale) {
    processedCanvas = convertToGrayscale(processedCanvas);
  }

  return processedCanvas;
}

/**
 * Export canvas to various formats
 */
export async function exportCanvas(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): Promise<CanvasExportResult> {
  let exportCanvas = canvas;

  // Apply preprocessing if specified
  if (options.preprocessing) {
    // Create a copy to avoid modifying the original
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
      exportCanvas = preprocessCanvas(tempCanvas, options.preprocessing);
    }
  }

  // Determine MIME type
  let mimeType = 'image/png';
  if (options.format === 'jpeg') {
    mimeType = 'image/jpeg';
  }

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    exportCanvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      },
      mimeType,
      options.quality || 0.95
    );
  });

  // Get data URL
  const dataUrl = exportCanvas.toDataURL(mimeType, options.quality || 0.95);

  return {
    dataUrl,
    blob,
    width: exportCanvas.width,
    height: exportCanvas.height,
    format: options.format,
  };
}

/**
 * Check if canvas is empty
 */
export function isCanvasEmpty(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Check if all pixels are transparent or white
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      // Check if it's not white
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 250 || g < 250 || b < 250) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get pixel ratio for high-DPI displays
 */
export function getPixelRatio(): number {
  return window.devicePixelRatio || 1;
}

/**
 * Setup canvas for high-DPI displays
 */
export function setupHighDPICanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): void {
  const ratio = getPixelRatio();

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(ratio, ratio);
  }
}
