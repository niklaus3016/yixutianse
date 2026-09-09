import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  Share2, 
  Play, 
  Sparkles, 
  Check, 
  Layers, 
  RotateCcw,
  Edit2
} from 'lucide-react';

interface NavigationHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  onBack: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenReplay: () => void;
  onOpenDecorations: () => void;
  onOpenExport: () => void;
  isAutoSaved: boolean;
  lineArtLocked: boolean;
  onToggleLineArtLock: () => void;
  onResetCanvas: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  onTitleChange,
  onBack,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenReplay,
  onOpenDecorations,
  onOpenExport,
  isAutoSaved,
  lineArtLocked,
  onToggleLineArtLock,
  onResetCanvas,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="shrink-0 h-14 px-3 flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md z-20">
      {/* Left section: Back + Title */}
      <div className="flex items-center gap-2 max-w-[45%]">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
          title="返回广场"
          aria-label="返回广场"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {isEditingTitle ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tempTitle}
              onChange={e => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="px-2 py-0.5 text-sm font-semibold rounded-md border border-[#4BA3A8] bg-transparent outline-none w-32"
            />
            <button onClick={handleTitleSubmit} className="p-1 text-[#4BA3A8]">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => { setTempTitle(title); setIsEditingTitle(true); }}>
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[120px]">
              {title}
            </span>
            <Edit2 className="w-3 h-3 text-neutral-400 group-hover:text-[#4BA3A8] transition-colors" />
            {isAutoSaved ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full font-medium ml-1">
                已存档
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full font-medium ml-1 animate-pulse">
                保存中
              </span>
            )}
          </div>
        )}
      </div>

      {/* Middle & Right section: Undo / Redo + Tools + Export */}
      <div className="flex items-center gap-1">
        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            canUndo
              ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-90'
              : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
          }`}
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            canRedo
              ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-90'
              : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
          }`}
          title="重做 (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Clear Color Layer */}
        <button
          onClick={onResetCanvas}
          className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-90 transition-all"
          title="清空涂色 (保留底稿)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Lock Line Layer Toggle */}
        <button
          onClick={onToggleLineArtLock}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            lineArtLocked
              ? 'text-[#4BA3A8] bg-[#4BA3A8]/10'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
          }`}
          title={lineArtLocked ? '底稿显示中（点击隐藏底稿）' : '底稿已隐藏（点击恢复显示）'}
        >
          <Layers className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />

        {/* Time-lapse Replay Button */}
        <button
          onClick={onOpenReplay}
          className="h-8 px-2.5 rounded-full flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 active:scale-95 transition-all"
          title="创作过程回放"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">回放</span>
        </button>

        {/* Decoration Tools (Stickers, Text, Filter, Frame) */}
        <button
          onClick={onOpenDecorations}
          className="h-8 px-2.5 rounded-full flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 active:scale-95 transition-all"
          title="装饰 (贴纸/文字/滤镜)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">装饰</span>
        </button>

        {/* Export / Share Button */}
        <button
          onClick={onOpenExport}
          className="h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold text-white bg-[#4BA3A8] hover:bg-[#3E8B90] shadow-sm shadow-[#4BA3A8]/30 active:scale-95 transition-all"
          title="导出高清作品"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>保存</span>
        </button>
      </div>
    </header>
  );
};
