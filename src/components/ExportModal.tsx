import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { 
  Download, 
  Share2, 
  Check, 
  Sparkles, 
  Image as ImageIcon 
} from 'lucide-react';
import { FilterType, FrameType, StickerItem, TextItem } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  paperColor: string;
  colorCanvas: HTMLCanvasElement | null;
  lineCanvas: HTMLCanvasElement | null;
  stickers: StickerItem[];
  texts: TextItem[];
  filter: FilterType;
  frame: FrameType;
}

type ResolutionType = '1080P' | '2K' | '4K';
type ImageFormatType = 'png' | 'jpg' | 'webp';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  paperColor,
  colorCanvas,
  lineCanvas,
  stickers,
  texts,
  filter,
  frame,
}) => {
  const [resolution, setResolution] = useState<ResolutionType>('2K');
  const [format, setFormat] = useState<ImageFormatType>('png');
  const [includeBackground, setIncludeBackground] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const resolutionSizes: Record<ResolutionType, number> = {
    '1080P': 1080,
    '2K': 1920,
    '4K': 3840,
  };

  const generateHighResCanvas = (): HTMLCanvasElement | null => {
    if (!colorCanvas || !lineCanvas) return null;

    const targetSize = resolutionSizes[resolution];
    const outCanvas = document.createElement('canvas');
    outCanvas.width = targetSize;
    outCanvas.height = targetSize;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return null;

    // 1. Paper Background if enabled
    if (includeBackground || format === 'jpg') {
      ctx.fillStyle = paperColor;
      ctx.fillRect(0, 0, targetSize, targetSize);
    }

    // Filter simulation
    if (filter === 'vintage') {
      ctx.filter = 'sepia(0.35) contrast(0.95) brightness(0.95)';
    } else if (filter === 'fresh') {
      ctx.filter = 'contrast(1.05) saturate(1.15) brightness(1.05)';
    } else if (filter === 'film') {
      ctx.filter = 'contrast(1.1) saturate(0.9) brightness(0.95) sepia(0.15)';
    } else if (filter === 'warm') {
      ctx.filter = 'sepia(0.2) saturate(1.2) brightness(1.0)';
    } else if (filter === 'softGlow') {
      ctx.filter = 'contrast(0.95) brightness(1.05) saturate(1.05)';
    }

    // 2. Color layer scaled
    ctx.drawImage(colorCanvas, 0, 0, targetSize, targetSize);

    // 3. Line layer on top with multiply
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(lineCanvas, 0, 0, targetSize, targetSize);
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';

    // 4. Scale and draw stickers & text
    const scale = targetSize / colorCanvas.width;

    stickers.forEach(s => {
      ctx.save();
      ctx.font = `${Math.round(s.size * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(s.x * scale, s.y * scale);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.fillText(s.emoji, 0, 0);
      ctx.restore();
    });

    texts.forEach(t => {
      ctx.save();
      ctx.font = `${Math.round(t.fontSize * scale)}px ${t.fontFamily}`;
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.opacity;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, t.x * scale, t.y * scale);
      ctx.restore();
    });

    // 5. Draw Frame
    if (frame === 'minimalWhite') {
      const b = 36 * scale;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = b * 2;
      ctx.strokeRect(0, 0, targetSize, targetSize);
    } else if (frame === 'vintageWood') {
      const b = 36 * scale;
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = b * 2;
      ctx.strokeRect(0, 0, targetSize, targetSize);
    } else if (frame === 'classicBorder') {
      const pad = 24 * scale;
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 4 * scale;
      ctx.strokeRect(pad, pad, targetSize - pad * 2, targetSize - pad * 2);
    } else if (frame === 'polaroid') {
      // White instant-photo frame with a thick bottom caption area
      const side = 20 * scale;
      const bottom = 60 * scale;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetSize, side);
      ctx.fillRect(0, 0, side, targetSize);
      ctx.fillRect(targetSize - side, 0, side, targetSize);
      ctx.fillRect(0, targetSize - bottom, targetSize, bottom);
    } else if (frame === 'filmStrip') {
      // Black film bars with sprocket holes
      const bar = 24 * scale;
      const side = 12 * scale;
      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.fillRect(0, 0, targetSize, bar);
      ctx.fillRect(0, targetSize - bar, targetSize, bar);
      ctx.fillRect(0, 0, side, targetSize);
      ctx.fillRect(targetSize - side, 0, side, targetSize);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      const holeW = 14 * scale;
      const holeH = 10 * scale;
      const gap = 36 * scale;
      for (let x = gap / 2; x < targetSize - side; x += gap) {
        ctx.fillRect(x, (bar - holeH) / 2, holeW, holeH);
        ctx.fillRect(x, targetSize - bar + (bar - holeH) / 2, holeW, holeH);
      }
    }

    return outCanvas;
  };

  const handleExport = async (isShare: boolean = false) => {
    setIsExporting(true);
    sound.playTap(520);

    setTimeout(async () => {
      const canvas = generateHighResCanvas();
      if (!canvas) {
        setIsExporting(false);
        return;
      }

      const mimeType = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      const dataUrl = canvas.toDataURL(mimeType, 0.95);

      if (isShare && navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `${title}_${resolution}.${format}`, { type: mimeType });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `《${title}》- 意序填色作品`,
              text: '这是我在《意序填色》APP创作的自由填色作品！',
              files: [file],
            });
          }
        } catch {
          // Fallback to standard download
          downloadImage(dataUrl);
        }
      } else {
        downloadImage(dataUrl);
      }

      setIsExporting(false);
      setExportSuccess(true);
      sound.playComplete();

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 150);
  };

  const downloadImage = (dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `意序填色_${title}_${resolution}_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#4BA3A8]/10 text-[#4BA3A8] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                保存与导出高清作品
              </h3>
              <p className="text-[10px] text-neutral-400">无水印 · 无压缩画质 · 纯本地生成</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100"
          >
            ×
          </button>
        </div>

        {/* Resolution Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            画质分辨率
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['1080P', '2K', '4K'] as ResolutionType[]).map(res => (
              <button
                key={res}
                onClick={() => {
                  sound.playTap(480);
                  setResolution(res);
                }}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  resolution === res
                    ? 'border-[#4BA3A8] bg-[#4BA3A8]/10 text-[#4BA3A8]'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {res}
                <span className="block text-[9px] font-normal opacity-70">
                  {res === '1080P' ? '1080×1080' : res === '2K' ? '1920×1920' : '3840×3840'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Image Format */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            图片格式
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['png', 'jpg', 'webp'] as ImageFormatType[]).map(fmt => (
              <button
                key={fmt}
                onClick={() => {
                  sound.playTap(480);
                  setFormat(fmt);
                }}
                className={`py-2 rounded-xl text-xs font-semibold border uppercase transition-all ${
                  format === fmt
                    ? 'border-[#4BA3A8] bg-[#4BA3A8]/10 text-[#4BA3A8]'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Background Option */}
        {format !== 'jpg' && (
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700 cursor-pointer">
            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              保留护眼画布底纸背景
            </span>
            <input
              type="checkbox"
              checked={includeBackground}
              onChange={e => setIncludeBackground(e.target.checked)}
              className="w-4 h-4 rounded text-[#4BA3A8] accent-[#4BA3A8]"
            />
          </label>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <button
              onClick={() => handleExport(false)}
              disabled={isExporting}
              className="flex-1 py-3 rounded-2xl bg-[#4BA3A8] text-white text-xs font-semibold shadow-md shadow-[#4BA3A8]/30 hover:bg-[#3E8B90] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {isExporting ? (
                <span>正在合成高清画质...</span>
              ) : exportSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>已保存至手机相册</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>一键保存至本地相册</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleExport(true)}
              disabled={isExporting}
              className="px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-1"
              title="调用原生分享接口"
            >
              <Share2 className="w-4 h-4 text-[#4BA3A8]" />
              <span>分享</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
