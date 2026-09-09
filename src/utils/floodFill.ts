/**
 * Fast scanline flood fill for the coloring canvas.
 * Considers both the color layer (target to change) and the line art layer (boundary obstacle).
 */

interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function hexToRgba(hex: string, alpha: number = 1): RGB {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: Math.round(alpha * 255)
  };
}

export function performFloodFill(
  colorCtx: CanvasRenderingContext2D,
  lineCtx: CanvasRenderingContext2D | null,
  startX: number,
  startY: number,
  fillColorHex: string,
  tolerance: number = 36
): boolean {
  const width = colorCtx.canvas.width;
  const height = colorCtx.canvas.height;

  // Clamp start coordinates
  let sx = Math.floor(Math.max(0, Math.min(width - 1, startX)));
  let sy = Math.floor(Math.max(0, Math.min(height - 1, startY)));

  const colorImgData = colorCtx.getImageData(0, 0, width, height);
  const colorData = colorImgData.data;

  const lineImgData = lineCtx ? lineCtx.getImageData(0, 0, width, height) : null;
  const lineData = lineImgData ? lineImgData.data : null;

  // Helper to check if pixel is a solid line boundary
  function isSolidLine(idx: number): boolean {
    if (!lineData) return false;
    const a = lineData[idx + 3];
    if (a < 75) return false;
    const luma = 0.299 * lineData[idx] + 0.587 * lineData[idx + 1] + 0.114 * lineData[idx + 2];
    return luma < 140;
  }

  let startIdx = (sy * width + sx) * 4;

  // If clicked directly on a line stroke, search nearby radius (1..16 px) for an open region
  if (isSolidLine(startIdx)) {
    let found = false;
    for (let r = 1; r <= 16; r++) {
      const offsets = [
        [0, r], [0, -r], [r, 0], [-r, 0],
        [r, r], [-r, -r], [r, -r], [-r, r],
        [Math.round(r * 0.7), r], [-Math.round(r * 0.7), r],
        [r, Math.round(r * 0.7)], [-r, Math.round(r * 0.7)],
      ];
      for (const [dx, dy] of offsets) {
        const nx = sx + dx;
        const ny = sy + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = (ny * width + nx) * 4;
          if (!isSolidLine(nIdx)) {
            sx = nx;
            sy = ny;
            startIdx = nIdx;
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
    if (!found) {
      return false;
    }
  }

  const startR = colorData[startIdx];
  const startG = colorData[startIdx + 1];
  const startB = colorData[startIdx + 2];
  const startA = colorData[startIdx + 3];

  const fillRgba = hexToRgba(fillColorHex);

  // If already the same color, no need to fill
  if (
    Math.abs(startR - fillRgba.r) <= 8 &&
    Math.abs(startG - fillRgba.g) <= 8 &&
    Math.abs(startB - fillRgba.b) <= 8 &&
    Math.abs(startA - fillRgba.a) <= 8
  ) {
    return false;
  }

  // Helper to check if color matches start color
  function matchesStartColor(idx: number): boolean {
    const a = colorData[idx + 3];

    // If start pixel was uncolored (blank paper / transparent)
    if (startA < 20) {
      return a < 25;
    }

    const r = colorData[idx];
    const g = colorData[idx + 1];
    const b = colorData[idx + 2];

    const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA);
    return diff <= tolerance * 4;
  }

  // Visited array to prevent infinite cycles
  const visited = new Uint8Array(width * height);
  const stack: number[] = [sx, sy];
  let filledCount = 0;

  while (stack.length > 0) {
    const curY = stack.pop()!;
    const curX = stack.pop()!;

    const gridIdx = curY * width + curX;
    if (visited[gridIdx]) continue;

    // Find leftmost boundary of span
    let lx = curX;
    while (lx > 0) {
      const nextGridIdx = curY * width + (lx - 1);
      const nextPixelIdx = nextGridIdx * 4;
      if (visited[nextGridIdx] || isSolidLine(nextPixelIdx) || !matchesStartColor(nextPixelIdx)) {
        break;
      }
      lx--;
    }

    // Find rightmost boundary of span
    let rx = curX;
    while (rx < width - 1) {
      const nextGridIdx = curY * width + (rx + 1);
      const nextPixelIdx = nextGridIdx * 4;
      if (visited[nextGridIdx] || isSolidLine(nextPixelIdx) || !matchesStartColor(nextPixelIdx)) {
        break;
      }
      rx++;
    }

    // Fill current span
    for (let x = lx; x <= rx; x++) {
      const cGrid = curY * width + x;
      visited[cGrid] = 1;
      const cPix = cGrid * 4;

      colorData[cPix] = fillRgba.r;
      colorData[cPix + 1] = fillRgba.g;
      colorData[cPix + 2] = fillRgba.b;
      colorData[cPix + 3] = fillRgba.a;
      filledCount++;
    }

    // Scan line above (curY - 1) using inSpan flag for optimal performance
    if (curY > 0) {
      let inSpan = false;
      const scanY = curY - 1;
      for (let x = lx; x <= rx; x++) {
        const uGrid = scanY * width + x;
        const uPix = uGrid * 4;
        const canFill = !visited[uGrid] && !isSolidLine(uPix) && matchesStartColor(uPix);
        if (!inSpan && canFill) {
          stack.push(x, scanY);
          inSpan = true;
        } else if (inSpan && !canFill) {
          inSpan = false;
        }
      }
    }

    // Scan line below (curY + 1) using inSpan flag
    if (curY < height - 1) {
      let inSpan = false;
      const scanY = curY + 1;
      for (let x = lx; x <= rx; x++) {
        const dGrid = scanY * width + x;
        const dPix = dGrid * 4;
        const canFill = !visited[dGrid] && !isSolidLine(dPix) && matchesStartColor(dPix);
        if (!inSpan && canFill) {
          stack.push(x, scanY);
          inSpan = true;
        } else if (inSpan && !canFill) {
          inSpan = false;
        }
      }
    }
  }

  if (filledCount > 0) {
    colorCtx.putImageData(colorImgData, 0, 0);
    return true;
  }
  return false;
}
