import React, { useState } from 'react';
import { BrushType, SymmetryMode } from '../types';
import { 
  Paintbrush, 
  PaintBucket, 
  Eraser, 
  Sliders, 
  Sparkles, 
  Divide, 
  Maximize2, 
  Droplet,
  Feather,
  Highlighter,
  SprayCan
} from 'lucide-react';
import { sound } from '../utils/audio';

interface EditorToolbarProps {
  brushType: BrushType;
  onBrushTypeChange: (type: BrushType) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushOpacity: number;
  onBrushOpacityChange: (opacity: number) => void;
  brushHardness: number;
  onBrushHardnessChange: (hardness: number) => void;
  symmetry: SymmetryMode;
  onSymmetryChange: (mode: SymmetryMode) => void;
  onResetZoom: () => void;
  zoomLevel: number;
}

const BRUSH_ITEMS: { type: BrushType; name: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { type: 'fill', name: '区域填色', icon: PaintBucket, desc: '点击闭合区域一键自动铺满' },
  { type: 'solid', name: '实心笔', icon: Paintbrush, desc: '均匀平滑的经典实色线条' },
  { type: 'gradient', name: '渐变笔', icon: Sparkles, desc: '主辅双色动态渐变过渡' },
  { type: 'watercolor', name: '水彩笔', icon: Droplet, desc: '半透明柔润晕染水彩质感' },
  { type: 'crayon', name: '磨砂笔', icon: Feather, desc: '微颗粒质感粉笔与蜡笔触感' },
  { type: 'highlighter', name: '荧光笔', icon: Highlighter, desc: '高透亮光标透色涂层' },
  { type: 'airbrush', name: '喷枪', icon: SprayCan, desc: '柔和弥散雾状喷绘渐隐' },
  { type: 'eraser', name: '橡皮擦', icon: Eraser, desc: '擦除颜色层，绝不伤到底稿' },
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  brushType,
  onBrushTypeChange,
  brushSize,
  onBrushSizeChange,
  brushOpacity,
  onBrushOpacityChange,
  brushHardness,
  onBrushHardnessChange,
  symmetry,
  onSymmetryChange,
  onResetZoom,
  zoomLevel
}) => {
  const [showSettingsPopover, setShowSettingsPopover] = useState<boolean>(false);

  const handleSelectTool = (type: BrushType) => {
    sound.playTap(type === 'fill' ? 580 : 460);
    onBrushTypeChange(type);
  };

  const cycleSymmetry = () => {
    const modes: SymmetryMode[] = ['none', 'horizontal', 'vertical', 'quad'];
    const nextIdx = (modes.indexOf(symmetry) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    sound.playTap(640);
    onSymmetryChange(nextMode);
  };

  const symmetryLabels: Record<SymmetryMode, string> = {
    none: '对称:关',
    horizontal: '左右对称',
    vertical: '上下对称',
    quad: '四方旋转',
  };

  return (
    <div className="relative shrink-0 w-full bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-200/80 dark:border-neutral-800 z-10">
      {/* Brush settings popover slider drawer */}
      {showSettingsPopover && (
        <div className="absolute bottom-full left-0 right-0 p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-t-2xl z-30 space-y-3 animate-slideUp">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {BRUSH_ITEMS.find(b => b.type === brushType)?.name} 参数调节
              </span>
              <span className="text-[11px] text-neutral-400">
                {BRUSH_ITEMS.find(b => b.type === brushType)?.desc}
              </span>
            </div>
            <button
              onClick={() => setShowSettingsPopover(false)}
              className="text-xs text-[#4BA3A8] font-medium px-2 py-1 rounded-md hover:bg-[#4BA3A8]/10"
            >
              完成
            </button>
          </div>

          {brushType !== 'fill' && (
            <>
              {/* Brush Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <span>笔触大小</span>
                  <span className="font-mono font-medium text-[#4BA3A8]">{brushSize} px</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-neutral-400">细</span>
                  <input
                    type="range"
                    min="2"
                    max="80"
                    value={brushSize}
                    onChange={e => onBrushSizeChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-400">粗</span>
                  {/* Visual preview circle */}
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <div
                      className="rounded-full bg-neutral-800 dark:bg-neutral-200 transition-all"
                      style={{ width: Math.min(28, brushSize), height: Math.min(28, brushSize) }}
                    />
                  </div>
                </div>
              </div>

              {/* Brush Opacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <span>不透明度</span>
                  <span className="font-mono font-medium text-[#4BA3A8]">{Math.round(brushOpacity * 100)} %</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-neutral-400">0%</span>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={brushOpacity}
                    onChange={e => onBrushOpacityChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-400">100%</span>
                </div>
              </div>

              {/* Brush Feathering / Hardness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <span>羽化硬度</span>
                  <span className="font-mono font-medium text-[#4BA3A8]">{Math.round(brushHardness * 100)} %</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-neutral-400">柔和</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={brushHardness}
                    onChange={e => onBrushHardnessChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-400">锐利</span>
                </div>
              </div>
            </>
          )}

          {brushType === 'fill' && (
            <div className="py-2 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
              <p className="font-medium text-neutral-700 dark:text-neutral-300">💡 智能区域填色小提示：</p>
              <p>• 点击画布上任意被黑线闭合的区域，即可自动铺满当前选中的颜色。</p>
              <p>• 若线条未闭合产生溢出，可直接点击顶部「撤销」重试，或切换为「实心笔」自由勾补。</p>
            </div>
          )}
        </div>
      )}

      {/* Main Tool Bar Row */}
      <div className="h-16 px-2 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {/* Brush Tool Icons */}
        <div className="flex items-center gap-1">
          {BRUSH_ITEMS.map(tool => {
            const Icon = tool.icon;
            const isSelected = brushType === tool.type;
            return (
              <button
                key={tool.type}
                onClick={() => handleSelectTool(tool.type)}
                className={`relative min-w-[48px] h-12 px-2.5 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#4BA3A8] text-white shadow-md shadow-[#4BA3A8]/30 scale-105'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                title={tool.desc}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-0.5 tracking-tight whitespace-nowrap">
                  {tool.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800 shrink-0 mx-1" />

        {/* Action Controls: Sliders, Symmetry, Zoom */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Brush Size / Settings Button */}
          <button
            onClick={() => setShowSettingsPopover(!showSettingsPopover)}
            className={`min-w-[48px] h-12 px-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
              showSettingsPopover
                ? 'bg-neutral-200 dark:bg-neutral-700 text-[#4BA3A8]'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="调节笔触大小与透明度"
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-0.5">{brushSize}px</span>
          </button>

          {/* Symmetry Mode Button */}
          <button
            onClick={cycleSymmetry}
            className={`min-w-[48px] h-12 px-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
              symmetry !== 'none'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/30'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="对称涂色辅助（左右镜像、上下镜像、四方旋转）"
          >
            <Divide className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
              {symmetry === 'none' ? '对称' : symmetryLabels[symmetry].slice(0, 2)}
            </span>
          </button>

          {/* Reset Zoom & Center */}
          <button
            onClick={onResetZoom}
            className="min-w-[48px] h-12 px-2 rounded-2xl flex flex-col items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
            title="双击画布或点击还原初始缩放比例"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-[10px] font-mono mt-0.5">{Math.round(zoomLevel * 100)}%</span>
          </button>
        </div>
      </div>
    </div>
  );
};
