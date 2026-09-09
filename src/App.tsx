import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Artwork, 
  Template, 
  BrushType, 
  SymmetryMode, 
  DrawAction, 
  StrokeAction, 
  FillAction, 
  ClearAction,
  UserSettings, 
  StickerItem, 
  TextItem, 
  FilterType, 
  FrameType 
} from './types';
import { TEMPLATES } from './data/templates';
import { AndroidFrame } from './components/AndroidFrame';
import { NavigationHeader } from './components/NavigationHeader';
import { PaletteDrawer } from './components/PaletteDrawer';
import { EditorToolbar } from './components/EditorToolbar';
import { ColoringCanvas } from './components/ColoringCanvas';
import { TemplateSquare } from './components/TemplateSquare';
import { GalleryView } from './components/GalleryView';
import { ExportModal } from './components/ExportModal';
import { ReplayModal } from './components/ReplayModal';
import { DecorationsModal } from './components/DecorationsModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import ConsentGate from './components/ConsentGate';
import { 
  getStoredArtworks, 
  saveArtwork, 
  deleteStoredArtwork, 
  getStoredSettings, 
  saveStoredSettings,
  getFavoriteColors,
  saveFavoriteColors
} from './utils/storage';
import { performFloodFill } from './utils/floodFill';
import { renderStrokeAction } from './utils/canvasRender';
import { sound } from './utils/audio';

type ViewMode = 'home' | 'editor' | 'gallery';

export default function App() {
  // App view navigation
  const [view, setView] = useState<ViewMode>('home');

  // User Settings & App State
  const [settings, setSettings] = useState<UserSettings>(() => getStoredSettings());
  const [artworks, setArtworks] = useState<Artwork[]>(() => getStoredArtworks());
  const [currentArtworkId, setCurrentArtworkId] = useState<string | null>(null);

  // Editor configuration & Line Art
  const [currentTitle, setCurrentTitle] = useState<string>('我的涂色作品');
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [customLineDataUrl, setCustomLineDataUrl] = useState<string | undefined>(undefined);
  const [lineArtLocked, setLineArtLocked] = useState<boolean>(true);
  const [paperColor, setPaperColor] = useState<string>('#FAF7F2');

  // Canvas interaction refs
  const colorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Actions waiting to be replayed onto a freshly mounted editor canvas (draft resume)
  const pendingRestoreActionsRef = useRef<DrawAction[] | null>(null);

  // Save status for the header indicator
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // Whether the current work has been explicitly saved as a finished piece
  const [isCurrentCompleted, setIsCurrentCompleted] = useState<boolean>(false);
  // Bumped to ask the canvas to reset pan/zoom view
  const [viewResetSignal, setViewResetSignal] = useState<number>(0);

  // Tools & Drawing State
  const [brushType, setBrushType] = useState<BrushType>('fill');
  const [currentColor, setCurrentColor] = useState<string>('#F4A261');
  const [secondaryColor, setSecondaryColor] = useState<string>('#4BA3A8');
  const [favoriteColors, setFavoriteColors] = useState<string[]>(() => getFavoriteColors());
  const [brushSize, setBrushSize] = useState<number>(18);
  const [brushOpacity, setBrushOpacity] = useState<number>(1.0);
  const [brushHardness, setBrushHardness] = useState<number>(0.8);
  const [symmetry, setSymmetry] = useState<SymmetryMode>('none');
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const handleAddFavorite = (color: string) => {
    setFavoriteColors(prev => {
      const list = prev || [];
      if (list.includes(color)) return list;
      const next = [color, ...list];
      saveFavoriteColors(next);
      return next;
    });
  };

  const handleRemoveFavorite = (color: string) => {
    setFavoriteColors(prev => {
      const list = prev || [];
      const next = list.filter(c => c !== color);
      saveFavoriteColors(next);
      return next;
    });
  };

  // History for Undo / Redo & Replay (30 steps undo)
  const [actionsHistory, setActionsHistory] = useState<DrawAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawAction[]>([]);

  // Decorations: Stickers, Text, Filter, Frame
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('none');
  const [frame, setFrame] = useState<FrameType>('none');

  // Modals visibility
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isReplayOpen, setIsReplayOpen] = useState<boolean>(false);
  const [isDecorationsOpen, setIsDecorationsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Ensure dark theme is active by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Check first launch onboarding
  useEffect(() => {
    if (settings.firstLaunch) {
      setIsOnboardingOpen(true);
    }
  }, [settings.firstLaunch]);

  // Update sound & haptic settings
  useEffect(() => {
    sound.enabled = settings.soundEnabled;
    sound.haptic = settings.hapticEnabled;
  }, [settings.soundEnabled, settings.hapticEnabled]);

  // Most recent unfinished draft for homepage quick resume
  const recentDraft = artworks.find(a => a.isDraft) || artworks[0] || null;

  // Re-render color canvas up to specified action count
  const renderActionsToCanvas = useCallback(
    (actionsToRender: DrawAction[]) => {
      const colorCanvas = colorCanvasRef.current;
      const lineCanvas = lineCanvasRef.current;
      if (!colorCanvas) return;
      const ctx = colorCanvas.getContext('2d');
      if (!ctx) return;

      const W = colorCanvas.width;
      const H = colorCanvas.height;
      ctx.clearRect(0, 0, W, H);

      actionsToRender.forEach(action => {
        if (action.type === 'clear') {
          ctx.clearRect(0, 0, W, H);
        } else if (action.type === 'fill') {
          const lineCtx = lineCanvas ? lineCanvas.getContext('2d') : null;
          performFloodFill(ctx, lineCtx, action.x, action.y, action.color, action.tolerance);
        } else if (action.type === 'stroke') {
          renderStrokeAction(ctx, action as StrokeAction, W, H);
        }
      });
    },
    []
  );

  // After the editor canvas mounts, replay any restored draft actions so the
  // canvas bitmap always matches the action history (undo/redo stays consistent).
  useEffect(() => {
    if (view !== 'editor') return;
    const restored = pendingRestoreActionsRef.current;
    if (restored) {
      pendingRestoreActionsRef.current = null;
      // Defer to the next frame so child layers (line art) finish drawing first.
      requestAnimationFrame(() => renderActionsToCanvas(restored));
    }
  }, [view, renderActionsToCanvas]);

  // Build a flat preview image: paper background + color layer + line art.
  // The color layer is transparent, so compositing onto paper avoids the
  // black background that JPEG would otherwise produce.
  const buildCompositeThumbnail = useCallback((): string | null => {
    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return null;
    try {
      const out = document.createElement('canvas');
      out.width = colorCanvas.width;
      out.height = colorCanvas.height;
      const ctx = out.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = paperColor;
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(colorCanvas, 0, 0);
      if (lineCanvasRef.current) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(lineCanvasRef.current, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
      }
      return out.toDataURL('image/jpeg', 0.82);
    } catch {
      return null;
    }
  }, [paperColor]);

  // Auto-Save Draft Debounced. Pass `completed=true` to persist as a finished piece.
  const autoSaveCurrentArtwork = useCallback((completed?: boolean) => {
    if (view !== 'editor') return;
    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return;

    // Never persist an untouched blank canvas
    const hasContent =
      actionsHistory.length > 0 || stickers.length > 0 || texts.length > 0;
    if (!hasContent) return;

    try {
      const thumbnail = buildCompositeThumbnail();
      if (!thumbnail) return;

      const artId = currentArtworkId || `artwork_${Date.now()}`;
      if (!currentArtworkId) setCurrentArtworkId(artId);

      const nowCompleted = completed ?? isCurrentCompleted;
      if (completed) setIsCurrentCompleted(true);

      const existing = getStoredArtworks().find(a => a.id === artId);
      const artworkData: Artwork = {
        id: artId,
        title: currentTitle,
        templateId: activeTemplate ? activeTemplate.id : undefined,
        category: activeTemplate ? activeTemplate.category : '自由创作',
        thumbnail: thumbnail,
        customLineDataUrl: customLineDataUrl,
        paperColor: paperColor,
        actions: actionsHistory,
        stickers: stickers,
        texts: texts,
        filter: filter,
        frame: frame,
        createdAt: existing ? existing.createdAt : Date.now(),
        updatedAt: Date.now(),
        isDraft: !nowCompleted,
      };

      saveArtwork(artworkData);
      setArtworks(getStoredArtworks());
      setIsSaving(false);
    } catch (e) {
      console.warn('Auto-save error (quota or canvas access):', e);
    }
  }, [
    view,
    currentArtworkId,
    currentTitle,
    activeTemplate,
    customLineDataUrl,
    paperColor,
    actionsHistory,
    stickers,
    texts,
    filter,
    frame,
    isCurrentCompleted,
    buildCompositeThumbnail,
  ]);

  // Debounced auto-save on actions or decorations change
  useEffect(() => {
    if (actionsHistory.length === 0 && stickers.length === 0 && texts.length === 0) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      autoSaveCurrentArtwork();
    }, 2000);
    return () => clearTimeout(timer);
  }, [actionsHistory, stickers, texts, filter, frame, autoSaveCurrentArtwork]);

  // Start with a chosen template
  const handleSelectTemplate = (template: Template) => {
    setActiveTemplate(template);
    setCustomLineDataUrl(undefined);
    setCurrentTitle(template.title);
    setCurrentArtworkId(`art_${Date.now()}`);
    setActionsHistory([]);
    setRedoStack([]);
    setStickers([]);
    setTexts([]);
    setFilter('none');
    setFrame('none');
    pendingRestoreActionsRef.current = null;
    setIsCurrentCompleted(false);
    setIsSaving(false);
    setLineArtLocked(true);
    setBrushType('fill');
    setZoomLevel(1.0);
    setViewResetSignal(s => s + 1);
    if (template.recommendedColors && template.recommendedColors.length > 0) {
      setCurrentColor(template.recommendedColors[0]);
      if (template.recommendedColors.length > 1) {
        setSecondaryColor(template.recommendedColors[1]);
      }
    }
    setView('editor');
  };

  // Start with blank canvas
  const handleStartBlank = () => {
    setActiveTemplate(null);
    setCustomLineDataUrl(undefined);
    setCurrentTitle('空白自由涂鸦');
    setCurrentArtworkId(`art_${Date.now()}`);
    setActionsHistory([]);
    setRedoStack([]);
    setStickers([]);
    setTexts([]);
    setFilter('none');
    setFrame('none');
    pendingRestoreActionsRef.current = null;
    setIsCurrentCompleted(false);
    setIsSaving(false);
    setLineArtLocked(true);
    setBrushType('fill');
    setZoomLevel(1.0);
    setViewResetSignal(s => s + 1);
    setView('editor');
  };

  // Start with photo-extracted line art
  const handleStartFromImportedLineArt = (lineArtDataUrl: string, title: string) => {
    setActiveTemplate(null);
    setCustomLineDataUrl(lineArtDataUrl);
    setCurrentTitle(title || '相册导入线稿');
    setCurrentArtworkId(`art_${Date.now()}`);
    setActionsHistory([]);
    setRedoStack([]);
    setStickers([]);
    setTexts([]);
    setFilter('none');
    setFrame('none');
    pendingRestoreActionsRef.current = null;
    setIsCurrentCompleted(false);
    setIsSaving(false);
    setLineArtLocked(true);
    setViewResetSignal(s => s + 1);
    setView('editor');
  };

  // Open existing draft / artwork for secondary editing
  const handleOpenDraft = (draft: Artwork) => {
    setCurrentArtworkId(draft.id);
    setCurrentTitle(draft.title);
    setPaperColor(draft.paperColor || '#FAF7F2');
    setCustomLineDataUrl(draft.customLineDataUrl);
    setActionsHistory(draft.actions || []);
    setRedoStack([]);
    setStickers(draft.stickers || []);
    setTexts(draft.texts || []);
    setFilter(draft.filter || 'none');
    setFrame(draft.frame || 'none');
    setIsCurrentCompleted(!draft.isDraft);
    setIsSaving(false);
    setLineArtLocked(true);
    setZoomLevel(1.0);
    setViewResetSignal(s => s + 1);

    if (draft.templateId) {
      const tmpl = TEMPLATES.find(t => t.id === draft.templateId);
      if (tmpl) setActiveTemplate(tmpl);
      else setActiveTemplate(null);
    } else {
      setActiveTemplate(null);
    }

    // Replay actions after the editor canvas mounts (keeps undo/redo consistent)
    pendingRestoreActionsRef.current = draft.actions && draft.actions.length > 0
      ? draft.actions
      : null;
    setView('editor');
  };

  // Delete artwork
  const handleDeleteArtwork = (id: string) => {
    deleteStoredArtwork(id);
    setArtworks(getStoredArtworks());
    if (currentArtworkId === id) {
      setCurrentArtworkId(null);
    }
  };

  // Undo Handler
  const handleUndo = () => {
    if (actionsHistory.length === 0) return;
    sound.playUndo();
    const nextActions = [...actionsHistory];
    const undone = nextActions.pop();
    if (undone) {
      setRedoStack(prev => [...prev, undone]);
      setActionsHistory(nextActions);
      renderActionsToCanvas(nextActions);
    }
  };

  // Redo Handler
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    sound.playRedo();
    const nextRedo = [...redoStack];
    const redone = nextRedo.pop();
    if (redone) {
      const nextActions = [...actionsHistory, redone];
      setRedoStack(nextRedo);
      setActionsHistory(nextActions);
      renderActionsToCanvas(nextActions);
    }
  };

  // Clear Canvas Handler
  const handleClear = () => {
    sound.playTap(400);
    const clearAction: ClearAction = {
      type: 'clear',
      timestamp: Date.now(),
    };
    const next = [...actionsHistory, clearAction];
    setActionsHistory(next);
    setRedoStack([]);
    renderActionsToCanvas(next);
  };

  // Action committed by Canvas.
  // History is kept in full so that resuming a draft and replaying actions
  // always reproduces exactly what is on canvas (undo stays consistent).
  const handleActionCommitted = (action: DrawAction) => {
    setActionsHistory(prev => [...prev, action]);
    setRedoStack([]);
  };

  // Color Eyedropper callback
  const handleColorPicked = (color: string) => {
    setCurrentColor(color);
    setIsEyedropperActive(false);
  };

  // Manual save artwork (marks it as a finished piece)
  const handleSaveArtworkManual = () => {
    sound.playComplete();
    autoSaveCurrentArtwork(true);
    setIsExportOpen(true);
  };

  // Reset Zoom & Pan
  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setViewResetSignal(s => s + 1);
    sound.playTap(600);
  };

  return (
    <ConsentGate>
    <AndroidFrame theme="dark">
      {/* 1. Home View: Template Square, Photo-to-LineArt, Blank Canvas */}
      {view === 'home' && (
        <TemplateSquare
          onSelectTemplate={handleSelectTemplate}
          onStartBlank={handleStartBlank}
          onStartFromImportedLineArt={handleStartFromImportedLineArt}
          onOpenDraft={handleOpenDraft}
          onOpenGallery={() => setView('gallery')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          recentDraft={recentDraft}
          savedArtworksCount={artworks.length}
        />
      )}

      {/* 2. Gallery View: Local Albums, Batch Management, Collage Poster */}
      {view === 'gallery' && (
        <GalleryView
          artworks={artworks}
          onBack={() => setView('home')}
          onEditArtwork={handleOpenDraft}
          onDeleteArtwork={handleDeleteArtwork}
        />
      )}

      {/* 3. Editor View: Coloring Canvas, Toolbar, Palette Drawer, Nav */}
      {view === 'editor' && (
        <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden bg-neutral-100 dark:bg-neutral-950">
          {/* Editor Header Navigation */}
          <NavigationHeader
            title={currentTitle}
            onTitleChange={setCurrentTitle}
            onBack={() => {
              autoSaveCurrentArtwork();
              sound.playTap(520);
              setView('home');
            }}
            canUndo={actionsHistory.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onResetCanvas={handleClear}
            onOpenReplay={() => setIsReplayOpen(true)}
            onOpenDecorations={() => setIsDecorationsOpen(true)}
            onOpenExport={handleSaveArtworkManual}
            isAutoSaved={!isSaving}
            lineArtLocked={lineArtLocked}
            onToggleLineArtLock={() => setLineArtLocked(!lineArtLocked)}
          />

          {/* Active Fill Hint Pill */}
          {brushType === 'fill' && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all">
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-900/80 dark:bg-white/90 text-white dark:text-neutral-900 text-xs rounded-full shadow-lg backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/60 shadow-sm shrink-0" style={{ backgroundColor: currentColor }} />
                <span className="font-medium">点触填色模式 · 点击线框内部即可自动上色</span>
              </div>
            </div>
          )}

          {/* Center Stage: Interactive Multi-layer Canvas */}
          <ColoringCanvas
            width={800}
            height={800}
            paperColor={paperColor}
            lineArtSvgPaths={activeTemplate ? activeTemplate.paths : []}
            viewBox={activeTemplate ? activeTemplate.viewBox : '0 0 800 800'}
            customLineDataUrl={customLineDataUrl}
            lineArtLocked={lineArtLocked}
            brushType={brushType}
            currentColor={currentColor}
            secondaryColor={secondaryColor}
            brushSize={brushSize}
            brushOpacity={brushOpacity}
            brushHardness={brushHardness}
            symmetry={symmetry}
            stickers={stickers}
            texts={texts}
            filter={filter}
            frame={frame}
            isEyedropperActive={isEyedropperActive}
            onColorPicked={handleColorPicked}
            onActionCommitted={handleActionCommitted}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            viewResetSignal={viewResetSignal}
            colorCanvasRef={colorCanvasRef}
            lineCanvasRef={lineCanvasRef}
          />

          {/* Color Palette Drawer (Bottom Floating Dock) */}
          <PaletteDrawer
            currentColor={currentColor}
            onColorSelect={setCurrentColor}
            onColorChange={setCurrentColor}
            secondaryColor={secondaryColor}
            onSecondaryColorSelect={setSecondaryColor}
            onSecondaryColorChange={setSecondaryColor}
            favoriteColors={favoriteColors}
            onAddFavorite={handleAddFavorite}
            onRemoveFavorite={handleRemoveFavorite}
            recommendedColors={activeTemplate?.recommendedColors || []}
            paperColor={paperColor}
            onPaperColorSelect={setPaperColor}
            onPaperColorChange={setPaperColor}
            isEyedropperActive={isEyedropperActive}
            onToggleEyedropper={() => {
              sound.playTap(500);
              setIsEyedropperActive(!isEyedropperActive);
            }}
            isGradientMode={brushType === 'gradient'}
            onToggleGradientMode={() => {
              setBrushType(prev => (prev === 'gradient' ? 'solid' : 'gradient'));
            }}
          />

          {/* Bottom Editor Toolbar: Brushes, Sliders, Symmetry, Zoom */}
          <EditorToolbar
            brushType={brushType}
            onBrushTypeChange={setBrushType}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            brushOpacity={brushOpacity}
            onBrushOpacityChange={setBrushOpacity}
            brushHardness={brushHardness}
            onBrushHardnessChange={setBrushHardness}
            symmetry={symmetry}
            onSymmetryChange={setSymmetry}
            onResetZoom={handleResetZoom}
            zoomLevel={zoomLevel}
          />
        </div>
      )}

      {/* Auxiliary Modals */}
      {/* High-Definition Export & Share */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={currentTitle}
        paperColor={paperColor}
        colorCanvas={colorCanvasRef.current}
        lineCanvas={lineCanvasRef.current}
        stickers={stickers}
        texts={texts}
        filter={filter}
        frame={frame}
      />

      {/* Time-lapse Replay Engine */}
      <ReplayModal
        isOpen={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
        actions={actionsHistory}
        width={800}
        height={800}
        paperColor={paperColor}
        lineArtSvgPaths={activeTemplate ? activeTemplate.paths : []}
        viewBox={activeTemplate ? activeTemplate.viewBox : '0 0 800 800'}
        customLineDataUrl={customLineDataUrl}
      />

      {/* Creative Decorations (Stickers, Text graffiti, Filters, Frames) */}
      <DecorationsModal
        isOpen={isDecorationsOpen}
        onClose={() => setIsDecorationsOpen(false)}
        stickers={stickers}
        onAddSticker={stk => setStickers(prev => [...prev, stk])}
        onRemoveSticker={id => setStickers(prev => prev.filter(s => s.id !== id))}
        onClearStickers={() => setStickers([])}
        texts={texts}
        onAddText={txt => setTexts(prev => [...prev, txt])}
        onRemoveText={id => setTexts(prev => prev.filter(t => t.id !== id))}
        filter={filter}
        onFilterChange={setFilter}
        frame={frame}
        onFrameChange={setFrame}
        canvasWidth={800}
        canvasHeight={800}
      />

      {/* Settings & Storage Management */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={newSt => {
          setSettings(newSt);
          saveStoredSettings(newSt);
        }}
        onDataCleared={() => setArtworks([])}
      />

      {/* Beginner 3-step Onboarding Guide */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => {
          const updated = { ...settings, firstLaunch: false };
          setSettings(updated);
          saveStoredSettings(updated);
          setIsOnboardingOpen(false);
        }}
      />
    </AndroidFrame>
    </ConsentGate>
  );
}
