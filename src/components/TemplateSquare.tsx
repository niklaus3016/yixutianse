import React, { useState } from 'react';
import { 
  Template, 
  TemplateCategory, 
  Artwork 
} from '../types';
import { 
  TEMPLATES, 
  TEMPLATE_CATEGORIES 
} from '../data/templates';
import { 
  extractLineArtFromImage, 
  fileToDataUrl 
} from '../utils/imageProcessing';
import { sound } from '../utils/audio';
import { APP_CONFIG } from '../constants/appConfig';
import { 
  Sparkles, 
  Plus, 
  Image as ImageIcon, 
  Shuffle, 
  Clock, 
  ChevronRight, 
  Paintbrush, 
  BookOpen, 
  FolderHeart, 
  Settings, 
  Sliders,
  Check
} from 'lucide-react';

interface TemplateSquareProps {
  onSelectTemplate: (template: Template) => void;
  onStartBlank: () => void;
  onStartFromImportedLineArt: (customLineDataUrl: string, title: string) => void;
  onOpenDraft: (draft: Artwork) => void;
  onOpenGallery: () => void;
  onOpenSettings: () => void;
  recentDraft: Artwork | null;
  savedArtworksCount: number;
}

export const TemplateSquare: React.FC<TemplateSquareProps> = ({
  onSelectTemplate,
  onStartBlank,
  onStartFromImportedLineArt,
  onOpenDraft,
  onOpenGallery,
  onOpenSettings,
  recentDraft,
  savedArtworksCount,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [randomTemplateIndex, setRandomTemplateIndex] = useState<number>(() =>
    Math.floor(Math.random() * TEMPLATES.length)
  );

  // Photo Import Modal state
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importedRawImage, setImportedRawImage] = useState<string | null>(null);
  const [extractedLineArt, setExtractedLineArt] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(38);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

  const dailyTemplate = TEMPLATES[randomTemplateIndex] || TEMPLATES[0];

  const filteredTemplates =
    activeCategory === '全部'
      ? TEMPLATES
      : TEMPLATES.filter(t => t.category === activeCategory);

  const handleRefreshDaily = () => {
    sound.playTap(600);
    setRandomTemplateIndex(prev => (prev + 1) % TEMPLATES.length);
  };

  // Handle Photo File Upload
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingImage(true);
      const dataUrl = await fileToDataUrl(file);
      setImportedRawImage(dataUrl);
      const result = await extractLineArtFromImage(dataUrl, {
        threshold,
        invert: false,
        thicken: true,
        contrast: 1.5,
      });
      setExtractedLineArt(result.lineArtDataUrl);
      setImportModalOpen(true);
      sound.playTap(520);
    } catch (err) {
      console.error('Failed to extract line art:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleReExtract = async (newThreshold: number) => {
    setThreshold(newThreshold);
    if (!importedRawImage) return;
    try {
      setIsProcessingImage(true);
      const result = await extractLineArtFromImage(importedRawImage, {
        threshold: newThreshold,
        invert: false,
        thicken: true,
        contrast: 1.5,
      });
      setExtractedLineArt(result.lineArtDataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleConfirmImport = () => {
    if (extractedLineArt) {
      sound.playTap(640);
      onStartFromImportedLineArt(extractedLineArt, '导入线稿创作');
      setImportModalOpen(false);
      setImportedRawImage(null);
      setExtractedLineArt(null);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#FAF7F2] dark:bg-neutral-900 overflow-y-auto">
      {/* Top App Header */}
      <div className="shrink-0 px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-neutral-800 dark:text-neutral-100 font-serif tracking-wide">
              {APP_CONFIG.name}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#4BA3A8]/15 text-[#4BA3A8] text-[10px] font-mono font-medium">
              {APP_CONFIG.version}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            意随心动，序由自创 · 随心涂色解压
          </p>
        </div>

        {/* Top Quick Links: My Gallery & Settings */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenGallery}
            className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 hover:border-[#4BA3A8] shadow-sm active:scale-95 transition-all"
            title="查看本地作品相册"
          >
            <FolderHeart className="w-4 h-4 text-[#4BA3A8]" />
            <span>相册 ({savedArtworksCount})</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-sm active:scale-95 transition-all"
            title="应用设置与缓存"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* Quick Creative Action Cards: Blank Canvas & Photo-to-LineArt */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. Blank Canvas */}
          <div
            onClick={() => {
              sound.playTap(540);
              onStartBlank();
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-[#4BA3A8]/10 border border-[#4BA3A8]/20 cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-[#4BA3A8] group-hover:scale-110 transition-transform">
                <Paintbrush className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#4BA3A8] font-medium bg-white/80 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded-full">
                自由手绘
              </span>
            </div>
            <div className="mt-2.5">
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                空白画布创作
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                新建空白纸张，随意涂鸦或构线填色
              </p>
            </div>
          </div>

          {/* 2. Photo to Line Art Import */}
          <label className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-purple-600 font-medium bg-white/80 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded-full">
                图像算法
              </span>
            </div>
            <div className="mt-2.5">
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                照片提取线稿
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                导入相册照片，智能提取轮廓填色
              </p>
            </div>
          </label>
        </div>

        {/* In-progress Draft Resume Banner */}
        {recentDraft && (
          <div
            onClick={() => onOpenDraft(recentDraft)}
            className="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-amber-500/30 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-500 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-700 overflow-hidden border border-neutral-200 dark:border-neutral-600 shrink-0">
                <img
                  src={recentDraft.thumbnail}
                  alt={recentDraft.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    继续涂色：{recentDraft.title}
                  </span>
                  <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                    上次进度
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>自动留存 · 点击一键继续创作</span>
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
        )}

        {/* Daily Random Template Highlight (每日随机底稿) */}
        <div className="relative rounded-3xl overflow-hidden p-4 bg-gradient-to-r from-[#4BA3A8]/20 via-[#4BA3A8]/10 to-teal-500/15 border border-[#4BA3A8]/30 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4BA3A8]">
              <Sparkles className="w-4 h-4" />
              <span>今日推荐底稿</span>
            </div>
            <button
              onClick={handleRefreshDaily}
              className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-300 hover:text-[#4BA3A8] bg-white/70 dark:bg-neutral-800/70 px-2 py-0.5 rounded-full transition-all"
            >
              <Shuffle className="w-3 h-3" />
              <span>换一换</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* SVG line art preview box */}
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-neutral-800 p-2 shadow-sm border border-neutral-200/60 dark:border-neutral-700 shrink-0 flex items-center justify-center">
              <svg viewBox={dailyTemplate.viewBox} className="w-full h-full stroke-neutral-800 dark:stroke-neutral-200 fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round">
                {dailyTemplate.paths.map((p, i) => (
                  <path key={i} d={p} />
                ))}
              </svg>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
                  {dailyTemplate.title}
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#4BA3A8]/20 text-[#2B7377]">
                  {dailyTemplate.category}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                {dailyTemplate.description}
              </p>

              {/* Recommended Color Palette Dots */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-400">推荐配色:</span>
                {dailyTemplate.recommendedColors.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                sound.playTap(600);
                onSelectTemplate(dailyTemplate);
              }}
              className="px-4 py-2 rounded-2xl bg-[#4BA3A8] text-white text-xs font-semibold shadow-md shadow-[#4BA3A8]/30 hover:bg-[#3E8B90] active:scale-95 transition-all shrink-0"
            >
              去填色
            </button>
          </div>
        </div>

        {/* Category Tabs (6 Built-in Categories) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#4BA3A8]" />
              <span>精选手绘底稿广场</span>
            </h3>
            <span className="text-xs text-neutral-400">
              共 {TEMPLATES.length} 款手绘线条底稿
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['全部', ...TEMPLATE_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => {
                  sound.playTap(440);
                  setActiveCategory(cat);
                }}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-[#4BA3A8] text-white shadow-sm'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => {
                  sound.playTap(520);
                  onSelectTemplate(template);
                }}
                className="group p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 hover:border-[#4BA3A8] hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Visual SVG Line Art Preview */}
                <div className="aspect-square w-full rounded-xl bg-neutral-50 dark:bg-neutral-900/60 p-3 flex items-center justify-center group-hover:scale-102 transition-transform">
                  <svg
                    viewBox={template.viewBox}
                    className="w-full h-full stroke-neutral-800 dark:stroke-neutral-200 fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round"
                  >
                    {template.paths.map((p, i) => (
                      <path key={i} d={p} />
                    ))}
                  </svg>
                </div>

                <div className="mt-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate">
                      {template.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400">
                      {template.difficulty}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1 mt-1">
                    {template.tags.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700/60 px-1.5 py-0.2 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Photo to Line Art Preview & Threshold Adjustment */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
                照片提取线稿微调
              </h3>
              <button
                onClick={() => setImportModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100"
              >
                ×
              </button>
            </div>

            {/* Preview image */}
            <div className="w-full h-64 rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-2 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 overflow-hidden relative">
              {isProcessingImage ? (
                <div className="text-xs text-[#4BA3A8] flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span>正在应用纯前端 Sobel 边缘提取算法...</span>
                </div>
              ) : extractedLineArt ? (
                <img
                  src={extractedLineArt}
                  alt="Extracted Line Art"
                  className="max-h-full max-w-full object-contain"
                />
              ) : null}
            </div>

            {/* Threshold Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span>线条灵敏度 / 细节过滤</span>
                <span className="font-mono text-[#4BA3A8]">{threshold}</span>
              </div>
              <input
                type="range"
                min="15"
                max="80"
                value={threshold}
                onChange={e => handleReExtract(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>更多细节</span>
                <span>清晰主干</span>
              </div>
            </div>

            {/* Confirm buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setImportModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-1 py-2.5 rounded-xl bg-[#4BA3A8] text-white text-xs font-semibold shadow-md shadow-[#4BA3A8]/30 hover:bg-[#3E8B90] flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                <span>进入填色创作</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
