import React, { useState } from 'react';
import { Artwork } from '../types';
import { sound } from '../utils/audio';
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  Share2, 
  Grid, 
  Layers, 
  Sparkles, 
  CheckSquare, 
  Square,
  Calendar,
  Clock,
  Download
} from 'lucide-react';

interface GalleryViewProps {
  artworks: Artwork[];
  onBack: () => void;
  onEditArtwork: (artwork: Artwork) => void;
  onDeleteArtwork: (id: string) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  artworks,
  onBack,
  onEditArtwork,
  onDeleteArtwork,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [isCollageModalOpen, setIsCollageModalOpen] = useState<boolean>(false);
  const [collagePosterUrl, setCollagePosterUrl] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    sound.playTap(520);
    setSelectedIds(prev => {
      const list = prev || [];
      return list.includes(id) ? list.filter(item => item !== id) : [...list, id];
    });
  };

  const handleBatchDelete = () => {
    if (window.confirm(`确定删除选中的 ${selectedIds.length} 幅作品吗？`)) {
      selectedIds.forEach(id => onDeleteArtwork(id));
      setSelectedIds([]);
      setIsBatchMode(false);
      sound.playTap(440);
    }
  };

  // Generate Artwork Collage Poster (拼图海报)
  const handleGenerateCollage = () => {
    const selectedArtworks = (artworks || []).filter(a => (selectedIds || []).includes(a.id));
    if (selectedArtworks.length < 2) {
      alert('请至少选择 2 幅作品制作拼图海报！');
      return;
    }

    sound.playTap(600);
    const canvas = document.createElement('canvas');
    const cols = selectedArtworks.length <= 4 ? 2 : 3;
    const rows = Math.ceil(selectedArtworks.length / cols);
    const cellW = 600;
    const cellH = 600;
    const padding = 40;
    const headerH = 140;

    canvas.width = cols * cellW + (cols + 1) * padding;
    canvas.height = rows * cellH + (rows + 1) * padding + headerH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title Header
    ctx.fillStyle = '#2B2D42';
    ctx.font = 'bold 42px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('意序填色 · 心情手绘展', canvas.width / 2, 70);

    ctx.fillStyle = '#798E87';
    ctx.font = '22px "Noto Sans SC", sans-serif';
    ctx.fillText(
      `创作合辑 · 共收录 ${selectedArtworks.length} 幅治愈随笔 · ${new Date().toLocaleDateString()}`,
      canvas.width / 2,
      110
    );

    // Draw each artwork
    let loaded = 0;
    selectedArtworks.forEach((art, idx) => {
      const img = new Image();
      img.onload = () => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = padding + col * (cellW + padding);
        const y = headerH + padding + row * (cellH + padding);

        // White photo border with shadow
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
        ctx.fillRect(x - 12, y - 12, cellW + 24, cellH + 24);
        ctx.shadowColor = 'transparent';

        // Draw artwork
        ctx.drawImage(img, x, y, cellW, cellH);

        // Subtitle caption
        ctx.fillStyle = '#666666';
        ctx.font = '18px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(art.title, x + cellW / 2, y + cellH + 18);

        loaded++;
        if (loaded === selectedArtworks.length) {
          setCollagePosterUrl(canvas.toDataURL('image/jpeg', 0.92));
          setIsCollageModalOpen(true);
        }
      };
      img.src = art.thumbnail;
    });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#FAF7F2] dark:bg-neutral-900 overflow-y-auto">
      {/* Top Header */}
      <div className="shrink-0 h-14 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
              本地作品相册
            </h2>
            <p className="text-[10px] text-neutral-400">
              共保存 {artworks.length} 幅手绘创作
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isBatchMode ? (
            <>
              {selectedIds.length >= 2 && (
                <button
                  onClick={handleGenerateCollage}
                  className="h-8 px-3 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>合图海报</span>
                </button>
              )}
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="h-8 px-3 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除 ({selectedIds.length})</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsBatchMode(false);
                  setSelectedIds([]);
                }}
                className="h-8 px-3 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800"
              >
                完成
              </button>
            </>
          ) : (
            <>
              {artworks.length > 0 && (
                <button
                  onClick={() => setIsBatchMode(true)}
                  className="h-8 px-3 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                >
                  批量管理
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Artworks Grid */}
      <div className="p-4 max-w-4xl mx-auto w-full flex-1">
        {artworks.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center text-neutral-400">
              <Grid className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              暂无保存的作品
            </h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              在广场选择任意线稿或新建空白画布，尽情涂抹属于你的治愈色彩吧！
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2 rounded-full bg-[#4BA3A8] text-white text-xs font-semibold shadow-md shadow-[#4BA3A8]/30 hover:bg-[#3E8B90] transition-all"
            >
              前往底稿广场
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {artworks.map(art => {
              const isSelected = (selectedIds || []).includes(art.id);
              return (
                <div
                  key={art.id}
                  onClick={() => {
                    if (isBatchMode) {
                      toggleSelect(art.id);
                    } else {
                      sound.playTap(520);
                      onEditArtwork(art);
                    }
                  }}
                  className={`group relative p-3 rounded-2xl bg-white dark:bg-neutral-800 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#4BA3A8] ring-2 ring-[#4BA3A8]/30 shadow-md'
                      : 'border-neutral-200/80 dark:border-neutral-700/80 hover:shadow-lg'
                  }`}
                >
                  {/* Batch Selection checkbox */}
                  {isBatchMode && (
                    <div className="absolute top-4 right-4 z-10">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#4BA3A8] fill-white" />
                      ) : (
                        <Square className="w-5 h-5 text-neutral-400 fill-white" />
                      )}
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="aspect-square w-full rounded-xl bg-[#FAF7F2] dark:bg-neutral-900 overflow-hidden shadow-inner flex items-center justify-center">
                    <img
                      src={art.thumbnail}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                    />
                  </div>

                  {/* Artwork details */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate">
                        {art.title}
                      </h4>
                      {art.isDraft ? (
                        <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded font-medium">
                          草稿
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded font-medium">
                          已完成
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(art.updatedAt).toLocaleDateString()}
                      </span>
                      <span>{art.category || '自由手绘'}</span>
                    </div>

                    {/* Action buttons (only when not in batch mode) */}
                    {!isBatchMode && (
                      <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            sound.playTap(560);
                            onEditArtwork(art);
                          }}
                          className="flex-1 py-1 rounded-lg bg-[#4BA3A8]/10 hover:bg-[#4BA3A8]/20 text-[#4BA3A8] text-[11px] font-medium flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>二次编辑</span>
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (window.confirm(`确定删除《${art.title}》吗？`)) {
                              onDeleteArtwork(art.id);
                              sound.playTap(440);
                            }
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="删除作品"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collage Poster Modal */}
      {isCollageModalOpen && collagePosterUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                作品拼图海报生成成功
              </h3>
              <button
                onClick={() => setIsCollageModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100"
              >
                ×
              </button>
            </div>

            <div className="w-full max-h-[60vh] overflow-y-auto rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <img src={collagePosterUrl} alt="Collage Poster" className="w-full h-auto block" />
            </div>

            <div className="flex gap-2">
              <a
                href={collagePosterUrl}
                download={`意序填色_作品海报_${Date.now()}.jpg`}
                className="flex-1 py-2.5 rounded-xl bg-[#4BA3A8] text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-md shadow-[#4BA3A8]/30"
              >
                <Download className="w-4 h-4" />
                <span>保存高清拼图海报</span>
              </a>
              <button
                onClick={() => setIsCollageModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-300 font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
