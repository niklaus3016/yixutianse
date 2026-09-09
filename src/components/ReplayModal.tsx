import React, { useRef, useState, useEffect } from 'react';
import { DrawAction } from '../types';
import { performFloodFill } from '../utils/floodFill';
import { renderStrokeAction } from '../utils/canvasRender';
import { sound } from '../utils/audio';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  FastForward 
} from 'lucide-react';

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: DrawAction[];
  width: number;
  height: number;
  paperColor: string;
  lineArtSvgPaths?: string[];
  viewBox?: string;
  customLineDataUrl?: string;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  isOpen,
  onClose,
  actions,
  width,
  height,
  paperColor,
  lineArtSvgPaths = [],
  viewBox = '0 0 800 800',
  customLineDataUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0); // 0.5, 1, 2, 3
  const timerRef = useRef<number | null>(null);

  // Setup Line Art Canvas on open
  useEffect(() => {
    if (!isOpen) return;
    const canvas = lineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (customLineDataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = customLineDataUrl;
    } else if (lineArtSvgPaths.length > 0) {
      ctx.save();
      const vb = viewBox.split(' ').map(Number);
      const scaleX = width / (vb[2] || 800);
      const scaleY = height / (vb[3] || 800);
      ctx.scale(scaleX, scaleY);
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      lineArtSvgPaths.forEach(pathStr => {
        try {
          ctx.stroke(new Path2D(pathStr));
        } catch {}
      });
      ctx.restore();
    }
  }, [isOpen, lineArtSvgPaths, viewBox, customLineDataUrl, width, height]);

  // Render actions up to `step`
  const renderUpToStep = (stepCount: number) => {
    const canvas = canvasRef.current;
    const lineCanvas = lineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const safeSteps = Math.min(stepCount, actions.length);
    for (let i = 0; i < safeSteps; i++) {
      const action = actions[i];
      if (action.type === 'clear') {
        ctx.clearRect(0, 0, width, height);
      } else if (action.type === 'fill') {
        const lineCtx = lineCanvas ? lineCanvas.getContext('2d') : null;
        performFloodFill(ctx, lineCtx, action.x, action.y, action.color, action.tolerance);
      } else if (action.type === 'stroke') {
        renderStrokeAction(ctx, action, width, height);
      }
    }
  };

  // Step change effect
  useEffect(() => {
    if (isOpen) {
      renderUpToStep(currentStep);
    }
  }, [currentStep, isOpen]);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(20, Math.floor(200 / speed));
      timerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= actions.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, actions.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
              创作过程沉浸回放
            </h3>
            <span className="text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full font-medium">
              共 {actions.length} 步操作
            </span>
          </div>
          <button
            onClick={() => {
              setIsPlaying(false);
              onClose();
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100"
          >
            ×
          </button>
        </div>

        {/* Playback Canvas Area */}
        <div
          className="relative aspect-square w-full max-h-[50vh] mx-auto rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-neutral-200 dark:border-neutral-700"
          style={{ backgroundColor: paperColor }}
        >
          {/* Color Layer */}
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 w-full h-full block"
          />

          {/* Line Art Layer */}
          <canvas
            ref={lineCanvasRef}
            width={width}
            height={height}
            className="absolute inset-0 w-full h-full block pointer-events-none"
            style={{ mixBlendMode: 'multiply' }}
          />
        </div>

        {/* Scrubber timeline */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-neutral-500 font-mono">
            <span>第 {currentStep} 步</span>
            <span>共 {actions.length} 步</span>
          </div>
          <input
            type="range"
            min="0"
            max={actions.length}
            value={currentStep}
            onChange={e => {
              setIsPlaying(false);
              setCurrentStep(Number(e.target.value));
            }}
            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-xl text-xs">
            {[0.5, 1.0, 2.0, 3.0].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                  speed === s ? 'bg-white dark:bg-neutral-700 text-[#4BA3A8] shadow-sm' : 'text-neutral-500'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Center Playback Buttons */}
          <div className="flex items-center gap-2">
            {/* Step Back */}
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(prev => Math.max(0, prev - 1));
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="单步后退"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={() => {
                if (currentStep >= actions.length) {
                  setCurrentStep(0);
                }
                setIsPlaying(!isPlaying);
                sound.playTap(540);
              }}
              className="w-11 h-11 rounded-full bg-[#4BA3A8] text-white flex items-center justify-center shadow-md shadow-[#4BA3A8]/30 hover:bg-[#3E8B90] active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Step Forward */}
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(prev => Math.min(actions.length, prev + 1));
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="单步前进"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Restart Button */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep(0);
              sound.playTap(440);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
            title="从头开始"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
