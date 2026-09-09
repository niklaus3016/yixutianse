import React, { useState } from 'react';
import { 
  StickerItem, 
  TextItem, 
  FilterType, 
  FrameType 
} from '../types';
import { PRESET_STICKERS } from '../data/templates';
import { sound } from '../utils/audio';
import { 
  Smile, 
  Type, 
  SlidersHorizontal, 
  Frame, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check 
} from 'lucide-react';

interface DecorationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stickers: StickerItem[];
  onAddSticker: (sticker: StickerItem) => void;
  onRemoveSticker: (id: string) => void;
  onClearStickers: () => void;
  texts: TextItem[];
  onAddText: (text: TextItem) => void;
  onRemoveText: (id: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  frame: FrameType;
  onFrameChange: (frame: FrameType) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const DecorationsModal: React.FC<DecorationsModalProps> = ({
  isOpen,
  onClose,
  stickers,
  onAddSticker,
  onRemoveSticker,
  onClearStickers,
  texts,
  onAddText,
  onRemoveText,
  filter,
  onFilterChange,
  frame,
  onFrameChange,
  canvasWidth,
  canvasHeight,
}) => {
  const [activeTab, setActiveTab] = useState<'stickers' | 'text' | 'filters' | 'frames'>('stickers');
  const [inputText, setInputText] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('#333333');
  const [textSize, setTextSize] = useState<number>(36);

  if (!isOpen) return null;

  const handleSelectSticker = (emoji: string) => {
    sound.playTap(580);
    const newSticker: StickerItem = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      emoji,
      x: canvasWidth / 2 + (Math.random() * 80 - 40),
      y: canvasHeight / 2 + (Math.random() * 80 - 40),
      size: 48,
      rotation: Math.round(Math.random() * 20 - 10),
    };
    onAddSticker(newSticker);
  };

  const handleAddText = () => {
    if (!inputText.trim()) return;
    sound.playTap(620);
    const newText: TextItem = {
      id: `text_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: inputText.trim(),
      x: canvasWidth / 2,
      y: canvasHeight / 2 + (texts.length * 45),
      fontSize: textSize,
      color: textColor,
      fontFamily: '"Noto Serif SC", serif',
      opacity: 0.9,
    };
    onAddText(newText);
    setInputText('');
  };

  const filtersList: { id: FilterType; name: string; desc: string }[] = [
    { id: 'none', name: '原色无滤镜', desc: '真实还原本色' },
    { id: 'fresh', name: '清新自然', desc: '轻微提亮与通透' },
    { id: 'vintage', name: '复古暖棕', desc: '泛黄怀旧年代感' },
    { id: 'film', name: '胶片记忆', desc: '经典银盐胶卷质感' },
    { id: 'softGlow', name: '柔光治愈', desc: '温润朦胧柔和漫射' },
    { id: 'warm', name: '日落暖阳', desc: '午后金黄余晖' },
  ];

  const framesList: { id: FrameType; name: string; desc: string }[] = [
    { id: 'none', name: '无边框', desc: '全幅画面展现' },
    { id: 'minimalWhite', name: '极简白画框', desc: '现代艺术馆留白装裱' },
    { id: 'vintageWood', name: '复古胡桃木', desc: '深沉优雅实木质感' },
    { id: 'polaroid', name: '拍立得画框', desc: '底部经典签名留白' },
    { id: 'filmStrip', name: '复古胶片齿轮', desc: '电影黑白齿孔质感' },
    { id: 'classicBorder', name: '文艺双线框', desc: '东方文人典雅内衬' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                创意美化装饰工具
              </h3>
              <p className="text-[10px] text-neutral-400">贴纸 · 文字涂鸦 · 滤镜 · 边框</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100"
          >
            ×
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('stickers')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'stickers'
                ? 'bg-white dark:bg-neutral-700 text-[#4BA3A8] shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>贴纸</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'text'
                ? 'bg-white dark:bg-neutral-700 text-[#4BA3A8] shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>文字</span>
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'filters'
                ? 'bg-white dark:bg-neutral-700 text-[#4BA3A8] shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>滤镜</span>
          </button>
          <button
            onClick={() => setActiveTab('frames')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'frames'
                ? 'bg-white dark:bg-neutral-700 text-[#4BA3A8] shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Frame className="w-3.5 h-3.5" />
            <span>边框</span>
          </button>
        </div>

        {/* Tab 1: Stickers */}
        {activeTab === 'stickers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>点击贴纸即可添加至画布：</span>
              {stickers.length > 0 && (
                <button
                  onClick={onClearStickers}
                  className="text-rose-500 hover:underline flex items-center gap-0.5 text-[11px]"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>清空贴纸 ({stickers.length})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
              {PRESET_STICKERS.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSticker(s.emoji)}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-all text-2xl flex flex-col items-center justify-center gap-1 border border-neutral-200/50 dark:border-neutral-700"
                >
                  <span>{s.emoji}</span>
                  <span className="text-[10px] text-neutral-500">{s.label}</span>
                </button>
              ))}
            </div>

            {/* List of currently active stickers */}
            {stickers.length > 0 && (
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] text-neutral-400 shrink-0">已添加:</span>
                {stickers.map(st => (
                  <div
                    key={st.id}
                    className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs"
                  >
                    <span>{st.emoji}</span>
                    <button
                      onClick={() => onRemoveSticker(st.id)}
                      className="text-neutral-400 hover:text-rose-500 text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Text Graffiti */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                输入签名 / 心情文字 / 题跋
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="如：随心之序，治愈片刻..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none focus:border-[#4BA3A8]"
                />
                <button
                  onClick={handleAddText}
                  className="px-4 py-2 rounded-xl bg-[#4BA3A8] text-white text-xs font-semibold hover:bg-[#3E8B90] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加</span>
                </button>
              </div>
            </div>

            {/* Font color & size */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-400">颜色:</span>
                {['#222222', '#4BA3A8', '#E76F51', '#F4A261', '#52B788', '#FFFFFF'].map(c => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border border-black/15 ${
                      textColor === c ? 'ring-2 ring-[#4BA3A8] scale-110' : ''
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs text-neutral-400">字号:</span>
                <input
                  type="range"
                  min="20"
                  max="64"
                  value={textSize}
                  onChange={e => setTextSize(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* List of active texts */}
            {texts.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] text-neutral-400">已添加的文字:</span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {texts.map(tx => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-xs"
                    >
                      <span className="truncate max-w-[240px]" style={{ color: tx.color }}>
                        {tx.text}
                      </span>
                      <button
                        onClick={() => onRemoveText(tx.id)}
                        className="text-neutral-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Filters */}
        {activeTab === 'filters' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {filtersList.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playTap(520);
                    onFilterChange(item.id);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    filter === item.id
                      ? 'border-[#4BA3A8] bg-[#4BA3A8]/10 shadow-sm'
                      : 'border-neutral-200/80 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                      {item.name}
                    </span>
                    {filter === item.id && <Check className="w-3.5 h-3.5 text-[#4BA3A8]" />}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Frames */}
        {activeTab === 'frames' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {framesList.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playTap(520);
                    onFrameChange(item.id);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    frame === item.id
                      ? 'border-[#4BA3A8] bg-[#4BA3A8]/10 shadow-sm'
                      : 'border-neutral-200/80 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                      {item.name}
                    </span>
                    {frame === item.id && <Check className="w-3.5 h-3.5 text-[#4BA3A8]" />}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-200 transition-all"
        >
          完成设置
        </button>
      </div>
    </div>
  );
};
