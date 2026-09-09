/**
 * Shared canvas stroke rendering.
 * Used by the live editor (ColoringCanvas), undo/redo replay (App) and the
 * time-lapse replay modal so a stroke looks identical everywhere.
 */
import { BrushType, Point, StrokeAction } from '../types';

export interface SegmentStyle {
  brush: BrushType;
  color: string;
  secondaryColor?: string;
  size: number;
  opacity: number;
  hardness: number;
}

/** Draw a single brush segment from p1 to p2. Caller is responsible for save/restore. */
export function drawBrushSegment(
  ctx: CanvasRenderingContext2D,
  p1: Point,
  p2: Point,
  style: SegmentStyle
): void {
  const { brush, color, secondaryColor, size, opacity, hardness } = style;

  if (brush === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    return;
  }

  ctx.globalCompositeOperation = 'source-over';

  if (brush === 'highlighter') {
    ctx.globalAlpha = opacity * 0.4;
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 1.5;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  } else if (brush === 'watercolor') {
    // Multi-pass soft bleeding wash
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer soft halo
    ctx.globalAlpha = opacity * 0.15;
    ctx.lineWidth = size * 1.3;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Core stroke
    ctx.globalAlpha = opacity * 0.35;
    ctx.lineWidth = size * 0.8;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  } else if (brush === 'crayon') {
    // Textured crayon with micro scattered dots
    ctx.globalAlpha = opacity * 0.7;
    ctx.fillStyle = color;
    ctx.shadowBlur = 0;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(dist / 2));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;
      for (let j = 0; j < 6; j++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * (size / 2);
        ctx.fillRect(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 2, 2);
      }
    }
  } else if (brush === 'airbrush') {
    // Soft spray particles
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity * 0.08;
    ctx.shadowBlur = 0;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(dist / 3));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;
      for (let j = 0; j < 12; j++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * size;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (brush === 'gradient') {
    // Linear gradient along the stroke direction
    const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
    grad.addColorStop(0, color);
    grad.addColorStop(1, secondaryColor || color);
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = grad;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Soften edges according to hardness
    ctx.shadowColor = color;
    ctx.shadowBlur = size * (1 - hardness) * 0.6;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  } else {
    // Default Solid Pen — hardness controls edge feathering via shadow blur
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = size * (1 - hardness) * 0.8;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

/** Draw one full stroke (all points + symmetry mirrors) onto a context. */
export function renderStrokeAction(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeAction,
  width: number,
  height: number
): void {
  if (stroke.points.length < 1) return;

  const style: SegmentStyle = {
    brush: stroke.brush,
    color: stroke.color,
    secondaryColor: stroke.secondaryColor,
    size: stroke.size,
    opacity: stroke.opacity,
    hardness: stroke.hardness,
  };

  const drawPolyline = (pts: Point[]) => {
    ctx.save();
    for (let i = 1; i < pts.length; i++) {
      drawBrushSegment(ctx, pts[i - 1], pts[i], style);
    }
    ctx.restore();
  };

  const pts = stroke.points;
  // Single dot (tap without move)
  if (pts.length === 1) {
    drawPolyline([pts[0], { x: pts[0].x + 0.1, y: pts[0].y + 0.1 }]);
  } else {
    drawPolyline(pts);
  }

  // Symmetry mirrors
  if (stroke.symmetry === 'horizontal' || stroke.symmetry === 'quad') {
    drawPolyline(pts.map(p => ({ x: width - p.x, y: p.y })));
  }
  if (stroke.symmetry === 'vertical' || stroke.symmetry === 'quad') {
    drawPolyline(pts.map(p => ({ x: p.x, y: height - p.y })));
  }
  if (stroke.symmetry === 'quad') {
    drawPolyline(pts.map(p => ({ x: width - p.x, y: height - p.y })));
  }
}
