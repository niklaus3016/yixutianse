import React, { useState } from 'react';
import { 
  PRESET_PALETTES, 
  PAPER_COLORS 
} from '../data/templates';
import { PalettePreset } from '../types';
import { 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Pipette, 
  Heart, 
  Layers, 
  Blend
} from 'lucide-react';
import { sound } from '../utils/audio';

interface PaletteDrawerProps {
  currentColor: string;
  onColorChange?: (color: string) => void;
  onColorSelect?: (color: string) => void;
  secondaryColor?: string;
  onSecondaryColorChange?: (color: string) => void;
  onSecondaryColorSelect?: (color: string) => void;
  favoriteColors?: string[];
  onAddFavorite?: (color: string) => void;
  onRemoveFavorite?: (color: string) => void;
  recommendedColors?: string[];
  paperColor?: string;
  onPaperColorChange?: (color: string) => void;
  onPaperColorSelect?: (color: string) => void;
  isEyedropperActive?: boolean;
  onToggleEyedropper?: () => void;
  isGradientMode?: boolean;
  onToggleGradientMode?: () => void;
}

export const PaletteDrawer: React.FC<PaletteDrawerProps> = ({
  currentColor,
  onColorChange,
  onColorSelect,
  secondaryColor = '#F4A261',
  onSecondaryColorChange,
  onSecondaryColorSelect,
  favoriteColors = [],
  onAddFavorite = (_color: string) => {},
  onRemoveFavorite = (_color: string) => {},
  recommendedColors = [],
  paperColor = '#FAF7F2',
  onPaperColorChange,
  onPaperColorSelect,
  isEyedropperActive = false,
  onToggleEyedropper = () => {},
  isGradientMode = false,
  onToggleGradientMode = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'favorites' | 'paper'>('presets');
  const [activePaletteIndex, setActivePaletteIndex] = useState<number>(0);
  const [customHex, setCustomHex] = useState<string>(currentColor);

  const safeFavoriteColors = Array.isArray(favoriteColors) ? favoriteColors : [];

  const triggerColorChange = (hex: string) => {
    if (onColorChange) onColorChange(hex);
    if (onColorSelect) onColorSelect(hex);
  };

  const triggerSecondaryColorChange = (hex: string) => {
    if (onSecondaryColorChange) onSecondaryColorChange(hex);
    if (onSecondaryColorSelect) onSecondaryColorSelect(hex);
  };

  const triggerPaperColorChange = (hex: string) => {
    if (onPaperColorChange) onPaperColorChange(hex);
    if (onPaperColorSelect) onPaperColorSelect(hex);
  };

  const currentPreset: PalettePreset = PRESET_PALETTES[activePaletteIndex] || PRESET_PALETTES[0];

  const handleSelectColor = (hex: string) => {
    sound.playTap(520);
    triggerColorChange(hex);
    setCustomHex(hex);
  };

  const isFavorited = safeFavoriteColors.includes(currentColor);

  return (
    <div className="w-full bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-200/80 dark:border-neutral-800 shadow-xl backdrop-blur-lg flex flex-col z-20">
      {/* Top Bar: Current Color Indicator, Gradient Toggle, Eyedropper, Tabs */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/60">
        {/* Current Color Previews */}
        <div className="flex items-center gap-2">
          {/* Main Color Swatch */}
          <div className="relative group flex items-center">
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer ring-2 ring-black/10 transition-transform active:scale-95"
              style={{ backgroundColor: currentColor }}
              title="当前颜色"
            />
            {/* Heart to favorite */}
            <button
              onClick={() => {
                if (isFavorited) {
                  onRemoveFavorite(currentColor);
                } else {
                  onAddFavorite(currentColor);
                  sound.playTap(660);
                }
              }}
              className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-white dark:bg-neutral-800 shadow flex items-center justify-center text-neutral-400 hover:text-rose-500"
              title={isFavorited ? '取消收藏' : '收藏此颜色'}
            >
              <Heart
                className={`w-2.5 h-2.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>
          </div>

          {/* Gradient secondary color if gradient mode */}
          {isGradientMode && (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <span className="text-xs text-neutral-400">→</span>
              <div
                className="w-7 h-7 rounded-full border-2 border-white shadow cursor-pointer ring-1 ring-black/10 transition-transform active:scale-95"
                style={{ backgroundColor: secondaryColor }}
                title="渐变辅色"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'color';
                  input.value = secondaryColor;
                  input.onchange = (e: Event) => {
                    const val = (e.target as HTMLInputElement).value;
                    triggerSecondaryColorChange(val);
                  };
                  input.click();
                }}
              />
            </div>
          )}

          {/* Gradient Mode Switch */}
          <button
            onClick={onToggleGradientMode}
            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
              isGradientMode
                ? 'bg-[#4BA3A8] text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
            }`}
            title="双色渐变涂抹模式"
          >
            <Blend className="w-3 h-3" />
            <span className="text-[11px]">渐变</span>
          </button>

          {/* Eyedropper Button */}
          <button
            onClick={onToggleEyedropper}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isEyedropperActive
                ? 'bg-[#4BA3A8] text-white ring-2 ring-[#4BA3A8]/40 animate-pulse'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
            title="长按画布或点击此处吸取颜色"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-full text-xs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1 rounded-full font-medium transition-all ${
              activeTab === 'presets'
                ? 'bg-white dark:bg-neutral-700 text-[#4BA3A8] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            预设色盘
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-2.5 py-1 rounded-full font-medium transition-all ${
              activeTab === 'custom'
                ? 'bg-white dark:bg-neutral-700 text-[#4BA3A8] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            自由调色
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-2.5 py-1 rounded-full font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-white dark:bg-neutral-700 text-[#4BA3A8] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            收藏 ({favoriteColors.length})
          </button>
          <button
            onClick={() => setActiveTab('paper')}
            className={`px-2.5 py-1 rounded-full font-medium transition-all ${
              activeTab === 'paper'
                ? 'bg-white dark:bg-neutral-700 text-[#4BA3A8] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            底纸
          </button>
        </div>
      </div>

      {/* Recommended Colors Pill Banner (Quick 1-click apply for novice users) */}
      {recommendedColors.length > 0 && activeTab === 'presets' && (
        <div className="px-3 py-1.5 bg-[#4BA3A8]/5 flex items-center justify-between border-b border-[#4BA3A8]/10 text-xs">
          <div className="flex items-center gap-1.5 text-[#4BA3A8] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>智能底稿推荐配色:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {recommendedColors.map((color, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectColor(color)}
                style={{ backgroundColor: color }}
                className={`w-5 h-5 rounded-full ring-1 ring-black/10 transition-transform active:scale-90 ${
                  currentColor === color ? 'ring-2 ring-[#4BA3A8] scale-110' : ''
                }`}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area based on activeTab */}
      <div className="px-3 py-2">
        {/* Tab 1: Preset Palettes */}
        {activeTab === 'presets' && (
          <div className="space-y-2">
            {/* Palette Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {PRESET_PALETTES.map((preset, idx) => (
                <button
                  key={preset.id}
                  onClick={() => setActivePaletteIndex(idx)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activePaletteIndex === idx
                      ? 'bg-[#4BA3A8] text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Colors in selected palette */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {currentPreset.colors.map((color, idx) => {
                const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectColor(color)}
                    style={{ backgroundColor: color }}
                    className={`shrink-0 w-8 h-8 rounded-full shadow-sm ring-1 ring-black/10 flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-[#4BA3A8] scale-115 shadow-md' : 'hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
              {currentPreset.description}
            </p>
          </div>
        )}

        {/* Tab 2: Custom Free Color Picker */}
        {activeTab === 'custom' && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {/* Native color picker trigger */}
              <label className="flex items-center gap-2 cursor-pointer bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700">
                <input
                  type="color"
                  value={currentColor}
                  onChange={e => handleSelectColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  打开全色谱圆盘
                </span>
              </label>

              {/* Hex input */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-xl">
                <span className="text-xs text-neutral-400 font-mono">HEX:</span>
                <input
                  type="text"
                  value={customHex}
                  onChange={e => {
                    setCustomHex(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleSelectColor(e.target.value);
                    }
                  }}
                  className="w-20 bg-transparent text-xs font-mono font-medium outline-none text-neutral-800 dark:text-neutral-200"
                />
              </div>

              {/* Add to favorites button */}
              <button
                onClick={() => {
                  onAddFavorite(currentColor);
                  sound.playTap(600);
                }}
                className="ml-auto px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-[#4BA3A8]" />
                <span>收藏此色</span>
              </button>
            </div>

            {/* Quick Spectrum Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                '#FF4D4D', '#FF851B', '#FFDC00', '#2ECC40', '#0074D9', '#B10DC9',
                '#F012BE', '#01FF70', '#7FDBFF', '#39CCCC', '#85144b', '#111111',
                '#AAAAAA', '#FFFFFF'
              ].map((hex, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectColor(hex)}
                  style={{ backgroundColor: hex }}
                  className={`shrink-0 w-7 h-7 rounded-full border border-black/10 active:scale-95 ${
                    currentColor === hex ? 'ring-2 ring-[#4BA3A8] scale-110' : ''
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Favorite Colors */}
        {activeTab === 'favorites' && (
          <div className="space-y-1.5">
            {safeFavoriteColors.length === 0 ? (
              <div className="py-3 text-center text-xs text-neutral-400">
                暂无收藏颜色，点击左上方心形或在调色板中添加收藏
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {safeFavoriteColors.map((color, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <button
                      onClick={() => handleSelectColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full shadow-sm ring-1 ring-black/10 flex items-center justify-center transition-all ${
                        currentColor === color ? 'ring-2 ring-[#4BA3A8] scale-110' : 'hover:scale-105 active:scale-95'
                      }`}
                    >
                      {currentColor === color && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                    </button>
                    <button
                      onClick={() => onRemoveFavorite(color)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-neutral-900/80 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="移除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Paper Background Canvas Color */}
        {activeTab === 'paper' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                护眼画布底色（更换不影响涂色层）：
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {PAPER_COLORS.map(item => (
                <button
                  key={item.color}
                  onClick={() => {
                    triggerPaperColorChange(item.color);
                    sound.playTap(480);
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                    paperColor === item.color
                      ? 'border-[#4BA3A8] bg-[#4BA3A8]/10 text-[#4BA3A8] font-medium'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
