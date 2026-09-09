import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  BrushType, 
  SymmetryMode, 
  DrawAction, 
  StrokeAction, 
  Point, 
  StickerItem, 
  TextItem, 
  FilterType, 
  FrameType 
} from '../types';
import { performFloodFill } from '../utils/floodFill';
import { drawBrushSegment } from '../utils/canvasRender';
import { sound } from '../utils/audio';

interface ColoringCanvasProps {
  width: number;
  height: number;
  paperColor: string;
  lineArtSvgPaths?: string[];
  viewBox?: string;
  customLineDataUrl?: string;
  lineArtLocked: boolean;
  brushType: BrushType;
  currentColor: string;
  secondaryColor: string;
  brushSize: number;
  brushOpacity: number;
  brushHardness: number;
  symmetry: SymmetryMode;
  stickers: StickerItem[];
  texts: TextItem[];
  filter: FilterType;
  frame: FrameType;
  isEyedropperActive: boolean;
  onColorPicked: (color: string) => void;
  onActionCommitted: (action: DrawAction) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  viewResetSignal: number;
  colorCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  lineCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

export const ColoringCanvas: React.FC<ColoringCanvasProps> = ({
  width,
  height,
  paperColor,
  lineArtSvgPaths = [],
  viewBox = '0 0 800 800',
  customLineDataUrl,
  lineArtLocked,
  brushType,
  currentColor,
  secondaryColor,
  brushSize,
  brushOpacity,
  brushHardness,
  symmetry,
  stickers,
  texts,
  filter,
  frame,
  isEyedropperActive,
  onColorPicked,
  onActionCommitted,
  zoomLevel,
  onZoomChange,
  colorCanvasRef,
  lineCanvasRef,
  viewResetSignal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const internalColorCanvasRef = useRef<HTMLCanvasElement>(null);
  const internalLineCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeStrokeRef = useRef<StrokeAction | null>(null);
  // Canvas snapshot taken at stroke start, used to roll back a partial
  // stroke when a long-press triggers the eyedropper mid-draw.
  const strokeSnapshotRef = useRef<ImageData | null>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  // Refs mirroring state for use inside fast touch handlers (avoids stale closures)
  const zoomLevelRef = useRef(zoomLevel);
  const panRef = useRef(pan);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // External request to reset pan & zoom view
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [viewResetSignal]);

  // Auto-fit container sizing
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 400,
    height: typeof window !== 'undefined' ? Math.max(300, window.innerHeight - 260) : 400,
  }));

  // Eyedropper long-press timer
  const longPressTimerRef = useRef<number | null>(null);

  // Fill tap ripple effect
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  // Expose refs to parent
  useEffect(() => {
    if (colorCanvasRef) colorCanvasRef.current = internalColorCanvasRef.current;
    if (lineCanvasRef) lineCanvasRef.current = internalLineCanvasRef.current;
  }, [colorCanvasRef, lineCanvasRef]);

  // Monitor container size for responsive auto-centering & auto-fit
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute base fit scale so 800x800 canvas comfortably centers inside viewport with safe margins
  const baseFitScale = Math.max(
    0.15,
    Math.min(
      (Math.max(100, containerSize.width - 24)) / width,
      (Math.max(100, containerSize.height - 24)) / height
    )
  );
  const effectiveScale = baseFitScale * zoomLevel;

  // Render Line Art Layer (either from SVG paths or from custom image data URL)
  useEffect(() => {
    const canvas = internalLineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (customLineDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = customLineDataUrl;
    } else if (lineArtSvgPaths.length > 0) {
      ctx.save();
      // Parse viewBox for scaling
      const vb = viewBox.split(' ').map(Number);
      const vbW = vb[2] || 800;
      const vbH = vb[3] || 800;
      const scaleX = width / vbW;
      const scaleY = height / vbH;
      ctx.scale(scaleX, scaleY);

      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      lineArtSvgPaths.forEach(pathStr => {
        try {
          const path2d = new Path2D(pathStr);
          ctx.stroke(path2d);
        } catch (err) {
          console.warn('Invalid SVG path:', err);
        }
      });
      ctx.restore();
    }
  }, [lineArtSvgPaths, viewBox, customLineDataUrl, width, height]);

  // Convert client viewport coordinates directly to Canvas internal coordinates via stageRef bounding rect
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number): Point => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const rect = stage.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };

      // Exact pixel mapping from screen to canvas coordinate system
      const canvasX = ((clientX - rect.left) / rect.width) * width;
      const canvasY = ((clientY - rect.top) / rect.height) * height;

      return {
        x: Math.max(0, Math.min(width - 1, canvasX)),
        y: Math.max(0, Math.min(height - 1, canvasY)),
      };
    },
    [width, height]
  );

  // Sample color for Eyedropper
  const sampleColorAt = useCallback(
    (cx: number, cy: number) => {
      const colorCanvas = internalColorCanvasRef.current;
      if (!colorCanvas) return;
      const ctx = colorCanvas.getContext('2d');
      if (!ctx) return;

      const pixel = ctx.getImageData(Math.floor(cx), Math.floor(cy), 1, 1).data;
      if (pixel[3] > 10) {
        const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
          .toString(16)
          .slice(1)
          .toUpperCase()}`;
        sound.playEyedropper();
        onColorPicked(hex);
      } else {
        // Sampled paper color
        sound.playEyedropper();
        onColorPicked(paperColor);
      }
    },
    [onColorPicked, paperColor]
  );

  // Apply symmetry transformations and draw (uses the shared brush renderer)
  const drawSymmetricSegment = useCallback(
    (p1: Point, p2: Point) => {
      const canvas = internalColorCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const style = {
        brush: brushType,
        color: currentColor,
        secondaryColor: secondaryColor,
        size: brushSize,
        opacity: brushOpacity,
        hardness: brushHardness,
      };

      // Primary stroke
      ctx.save();
      drawBrushSegment(ctx, p1, p2, style);
      ctx.restore();

      // Symmetry variants
      if (symmetry === 'horizontal' || symmetry === 'quad') {
        const mp1 = { x: width - p1.x, y: p1.y };
        const mp2 = { x: width - p2.x, y: p2.y };
        ctx.save();
        drawBrushSegment(ctx, mp1, mp2, style);
        ctx.restore();
      }
      if (symmetry === 'vertical' || symmetry === 'quad') {
        const mp1 = { x: p1.x, y: height - p1.y };
        const mp2 = { x: p2.x, y: height - p2.y };
        ctx.save();
        drawBrushSegment(ctx, mp1, mp2, style);
        ctx.restore();
      }
      if (symmetry === 'quad') {
        const mp1 = { x: width - p1.x, y: height - p1.y };
        const mp2 = { x: width - p2.x, y: height - p2.y };
        ctx.save();
        drawBrushSegment(ctx, mp1, mp2, style);
        ctx.restore();
      }
    },
    [
      brushType,
      currentColor,
      secondaryColor,
      brushSize,
      brushOpacity,
      brushHardness,
      symmetry,
      width,
      height,
    ]
  );

  // Touch & Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Left click or single touch only
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Reject taps outside the paper canvas stage
    const stage = stageRef.current;
    if (stage) {
      const rect = stage.getBoundingClientRect();
      const margin = 12;
      if (
        e.clientX < rect.left - margin ||
        e.clientX > rect.right + margin ||
        e.clientY < rect.top - margin ||
        e.clientY > rect.bottom + margin
      ) {
        return;
      }
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Eyedropper check
    if (isEyedropperActive) {
      sampleColorAt(coords.x, coords.y);
      return;
    }

    // Long press for auto-eyedropper
    longPressTimerRef.current = window.setTimeout(() => {
      // If a stroke was already in progress, roll the canvas back to the
      // pre-stroke snapshot so the cancelled partial stroke leaves no trace.
      if (activeStrokeRef.current) {
        const canvas = internalColorCanvasRef.current;
        const ctx = canvas ? canvas.getContext('2d') : null;
        if (ctx && strokeSnapshotRef.current) {
          ctx.putImageData(strokeSnapshotRef.current, 0, 0);
        }
        activeStrokeRef.current = null;
        setIsDrawing(false);
      }
      sampleColorAt(coords.x, coords.y);
    }, 450);

    // If Fill bucket mode:
    if (brushType === 'fill') {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      const colorCanvas = internalColorCanvasRef.current;
      const lineCanvas = internalLineCanvasRef.current;
      if (!colorCanvas) return;
      const colorCtx = colorCanvas.getContext('2d');
      const lineCtx = lineCanvas ? lineCanvas.getContext('2d') : null;
      if (!colorCtx) return;

      const success = performFloodFill(colorCtx, lineCtx, coords.x, coords.y, currentColor, 36);
      if (success) {
        sound.playFill();
        const rippleId = Date.now();
        setRipples(prev => [...prev, { id: rippleId, x: coords.x, y: coords.y, color: currentColor }]);
        window.setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== rippleId));
        }, 450);

        onActionCommitted({
          type: 'fill',
          x: Math.floor(coords.x),
          y: Math.floor(coords.y),
          color: currentColor,
          tolerance: 36,
          timestamp: Date.now(),
        });
      }
      return;
    }

    // Brush drawing mode
    setIsDrawing(true);
    activeStrokeRef.current = {
      type: 'stroke',
      brush: brushType,
      color: currentColor,
      secondaryColor: secondaryColor,
      size: brushSize,
      opacity: brushOpacity,
      hardness: brushHardness,
      symmetry: symmetry,
      points: [coords],
      timestamp: Date.now(),
    };

    // Snapshot canvas before the first dot so a long-press cancel can roll back
    const paintCanvas = internalColorCanvasRef.current;
    const paintCtx = paintCanvas ? paintCanvas.getContext('2d') : null;
    if (paintCanvas && paintCtx) {
      try {
        strokeSnapshotRef.current = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
      } catch {
        strokeSnapshotRef.current = null;
      }
    }

    // Draw single dot on touch down
    drawSymmetricSegment(coords, { x: coords.x + 0.1, y: coords.y + 0.1 });
    sound.playBrushStroke();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isDrawing || !activeStrokeRef.current) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const points = activeStrokeRef.current.points;
    const lastPoint = points[points.length - 1];

    if (!lastPoint) return;

    const dist = Math.hypot(coords.x - lastPoint.x, coords.y - lastPoint.y);
    if (dist < 1.5) return; // ignore micro jitter

    points.push(coords);
    drawSymmetricSegment(lastPoint, coords);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDrawing && activeStrokeRef.current) {
      onActionCommitted(activeStrokeRef.current);
      activeStrokeRef.current = null;
      setIsDrawing(false);
    }
  };

  // Two finger touch gestures for pinch zoom & pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsDrawing(false);
      activeStrokeRef.current = null;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistanceRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      panStartRef.current = {
        x: (t1.clientX + t2.clientX) / 2 - panRef.current.x,
        y: (t1.clientY + t2.clientY) / 2 - panRef.current.y,
      };
      setIsPanning(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPanning && touchDistanceRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = newDist / touchDistanceRef.current;

      // Use the ref so rapid touchmove frames compound correctly
      const newZoom = Math.max(0.5, Math.min(4.0, zoomLevelRef.current * ratio));
      zoomLevelRef.current = newZoom;
      onZoomChange(newZoom);
      touchDistanceRef.current = newDist;

      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      setPan({
        x: midX - panStartRef.current.x,
        y: midY - panStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPanning(false);
      touchDistanceRef.current = null;
    }
  };

  // Double click or tap to reset view to 100% center
  const handleDoubleClick = () => {
    setPan({ x: 0, y: 0 });
    onZoomChange(1.0);
    sound.playTap(600);
  };

  // Filter styles CSS classes
  const filterStyles: Record<FilterType, string> = {
    none: '',
    fresh: 'contrast-105 saturate-115 brightness-105 hue-rotate-5',
    vintage: 'sepia-[0.35] contrast-95 brightness-95',
    film: 'contrast-110 saturate-90 brightness-95 sepia-[0.15]',
    softGlow: 'contrast-95 brightness-105 saturate-105',
    warm: 'sepia-[0.2] saturate-120 brightness-100 hue-rotate-[-5deg]',
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      className={`relative flex-1 w-full h-full overflow-hidden select-none cursor-crosshair bg-neutral-100/90 dark:bg-neutral-950 ${
        isEyedropperActive ? 'cursor-cell' : ''
      }`}
      style={{
        touchAction: 'none',
      }}
    >
      {/* Absolute Centered Stage Wrapper */}
      <div
        ref={stageRef}
        className={`absolute rounded-xl transition-transform duration-75 ease-out pointer-events-auto select-none ${filterStyles[filter]}`}
        style={{
          left: '50%',
          top: '50%',
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(-50%, -50%) translate3d(${pan.x}px, ${pan.y}px, 0) scale(${effectiveScale})`,
          transformOrigin: 'center center',
          boxShadow: '0 12px 40px -10px rgba(0,0,0,0.18)',
        }}
      >
          {/* Layer 1: Paper Background */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ backgroundColor: paperColor }}
          />

          {/* Layer 2: Color Paint Layer */}
          <canvas
            ref={internalColorCanvasRef}
            width={width}
            height={height}
            className="absolute inset-0 block rounded-xl pointer-events-none"
          />

          {/* Layer: Fill Tap Ripple Feedback */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {ripples.map(rip => (
              <div
                key={rip.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-ping"
                style={{
                  left: `${rip.x}px`,
                  top: `${rip.y}px`,
                  width: '50px',
                  height: '50px',
                  backgroundColor: rip.color,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>

          {/* Layer 3: Line Art Layer (locked = visible guides; toggling hides them) */}
          <canvas
            ref={internalLineCanvasRef}
            width={width}
            height={height}
            className="absolute inset-0 block rounded-xl pointer-events-none transition-opacity duration-200"
            style={{
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
              opacity: lineArtLocked ? 1 : 0,
            }}
          />

          {/* Layer 4: Stickers & Text Doodles Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {stickers.map(sticker => (
              <div
                key={sticker.id}
                className="absolute select-none"
                style={{
                  left: `${sticker.x}px`,
                  top: `${sticker.y}px`,
                  fontSize: `${sticker.size}px`,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                }}
              >
                {sticker.emoji}
              </div>
            ))}

            {texts.map(txt => (
              <div
                key={txt.id}
                className="absolute select-none font-medium whitespace-nowrap"
                style={{
                  left: `${txt.x}px`,
                  top: `${txt.y}px`,
                  fontSize: `${txt.fontSize}px`,
                  color: txt.color,
                  opacity: txt.opacity,
                  fontFamily: txt.fontFamily,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {txt.text}
              </div>
            ))}
          </div>

          {/* Layer 5: Decorative Artistic Frame Overlay */}
          {frame !== 'none' && (
            <div className="absolute inset-0 pointer-events-none rounded-xl">
              {frame === 'minimalWhite' && (
                <div className="absolute inset-0 border-[24px] border-white/90 shadow-inner" />
              )}
              {frame === 'vintageWood' && (
                <div className="absolute inset-0 border-[24px] border-[#654321]/90 shadow-2xl ring-4 ring-[#3D2514]" />
              )}
              {frame === 'polaroid' && (
                <div className="absolute inset-0 border-t-[20px] border-x-[20px] border-b-[60px] border-white shadow-xl" />
              )}
              {frame === 'filmStrip' && (
                <div className="absolute inset-0 border-y-[24px] border-x-[12px] border-black/80 flex flex-col justify-between">
                  <div className="flex justify-between px-2 text-white/50 text-[10px] tracking-widest">
                    ••••••••••••••••••••••••••••••••••••
                  </div>
                  <div className="flex justify-between px-2 text-white/50 text-[10px] tracking-widest">
                    ••••••••••••••••••••••••••••••••••••
                  </div>
                </div>
              )}
              {frame === 'classicBorder' && (
                <div className="absolute inset-4 border-2 border-neutral-700/60 ring-4 ring-neutral-700/20" />
              )}
            </div>
          )}

          {/* Symmetry Guide Lines (Subtle visual indication when symmetry mode is on) */}
          {symmetry !== 'none' && (
            <div className="absolute inset-0 pointer-events-none">
              {(symmetry === 'horizontal' || symmetry === 'quad') && (
                <div className="absolute top-0 bottom-0 left-1/2 w-px border-l border-dashed border-indigo-400/50" />
              )}
              {(symmetry === 'vertical' || symmetry === 'quad') && (
                <div className="absolute left-0 right-0 top-1/2 h-px border-t border-dashed border-indigo-400/50" />
              )}
            </div>
          )}
        </div>
      </div>
  );
};
