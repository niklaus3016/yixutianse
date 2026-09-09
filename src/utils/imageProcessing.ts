/**
 * Pure frontend image edge detection to extract line art from photos/drawings.
 */

export interface LineArtExtractionOptions {
  threshold: number; // 10 to 100, default 35
  invert: boolean; // default false
  thicken: boolean; // default true
  contrast: number; // 1.0 to 2.5
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function extractLineArtFromImage(
  imageSource: string | HTMLImageElement,
  options: LineArtExtractionOptions = { threshold: 40, invert: false, thicken: true, contrast: 1.5 }
): Promise<{ lineArtDataUrl: string; width: number; height: number }> {
  let img: HTMLImageElement;

  if (typeof imageSource === 'string') {
    img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(null);
      img.onerror = reject;
      img.src = imageSource;
    });
  } else {
    img = imageSource;
  }

  // Target canvas size (capped at 1000px max dimension for speed and performance)
  const maxDim = 1000;
  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
      targetHeight = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2d context');

  // Draw image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;
  const width = targetWidth;
  const height = targetHeight;

  // 1. Convert to grayscale with contrast stretch
  const gray = new Float32Array(width * height);
  const contrastFactor = options.contrast;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminance
    let luma = 0.299 * r + 0.587 * g + 0.114 * b;
    // Contrast
    luma = ((luma / 255 - 0.5) * contrastFactor + 0.5) * 255;
    gray[i / 4] = Math.max(0, Math.min(255, luma));
  }

  // 2. Sobel 3x3 Edge Detection Kernels
  // Gx:
  // [-1, 0, 1]
  // [-2, 0, 2]
  // [-1, 0, 1]
  // Gy:
  // [-1, -2, -1]
  // [ 0,  0,  0]
  // [ 1,  2,  1]
  const edges = new Uint8Array(width * height);
  const threshold = options.threshold * 2.55; // convert 0-100 to 0-255 scale

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x;

      const p00 = gray[idx - width - 1];
      const p01 = gray[idx - width];
      const p02 = gray[idx - width + 1];

      const p10 = gray[idx - 1];
      const p12 = gray[idx + 1];

      const p20 = gray[idx + width - 1];
      const p21 = gray[idx + width];
      const p22 = gray[idx + width + 1];

      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

      const mag = Math.sqrt(gx * gx + gy * gy);
      if (mag > threshold) {
        edges[idx] = 255;
      } else {
        edges[idx] = 0;
      }
    }
  }

  // 3. Optional line dilation (thicken lines slightly so they are clear and easily contain flood fill)
  const finalEdges = new Uint8Array(width * height);
  if (options.thicken) {
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = rowOffset + x;
        if (
          edges[idx] === 255 ||
          edges[idx - 1] === 255 ||
          edges[idx + 1] === 255 ||
          edges[idx - width] === 255 ||
          edges[idx + width] === 255
        ) {
          finalEdges[idx] = 255;
        }
      }
    }
  } else {
    finalEdges.set(edges);
  }

  // 4. Output to Canvas: transparent background with clean dark lines (#222)
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Could not get output 2d context');

  const outImgData = outCtx.createImageData(width, height);
  const outData = outImgData.data;

  for (let i = 0; i < width * height; i++) {
    const isEdge = finalEdges[i] === 255;
    const pixelIdx = i * 4;

    if (options.invert ? !isEdge : isEdge) {
      // Crisp black / dark charcoal line
      outData[pixelIdx] = 34; // R
      outData[pixelIdx + 1] = 34; // G
      outData[pixelIdx + 2] = 34; // B
      outData[pixelIdx + 3] = 240; // Alpha
    } else {
      // Transparent so color underneath shows!
      outData[pixelIdx] = 0;
      outData[pixelIdx + 1] = 0;
      outData[pixelIdx + 2] = 0;
      outData[pixelIdx + 3] = 0;
    }
  }

  outCtx.putImageData(outImgData, 0, 0);

  return {
    lineArtDataUrl: outCanvas.toDataURL('image/png'),
    width,
    height
  };
}
