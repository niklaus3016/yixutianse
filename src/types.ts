export type TemplateCategory = 
  | '治愈风景' 
  | '可爱动物' 
  | '卡通人物' 
  | '植物花卉' 
  | '简约几何' 
  | '国风线条';

export interface Template {
  id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  difficulty: '简单' | '中等' | '进阶';
  paths: string[]; // SVG path data
  viewBox: string;
  recommendedColors: string[];
  tags: string[];
}

export type BrushType = 
  | 'solid'       // 实心笔
  | 'gradient'    // 渐变笔
  | 'crayon'      // 磨砂笔 / 蜡笔
  | 'watercolor'  // 水彩笔
  | 'highlighter' // 荧光笔
  | 'airbrush'    // 喷枪
  | 'eraser'      // 橡皮擦
  | 'fill';       // 智能区域填色

export type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'quad';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface StrokeAction {
  type: 'stroke';
  brush: BrushType;
  color: string;
  secondaryColor?: string; // for gradient brush
  size: number;
  opacity: number;
  hardness: number;
  symmetry: SymmetryMode;
  points: Point[];
  timestamp: number;
}

export interface FillAction {
  type: 'fill';
  x: number;
  y: number;
  color: string;
  tolerance: number;
  timestamp: number;
}

export interface ClearAction {
  type: 'clear';
  timestamp: number;
}

export type DrawAction = StrokeAction | FillAction | ClearAction;

export interface StickerItem {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface TextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  opacity: number;
}

export type FilterType = 'none' | 'fresh' | 'vintage' | 'film' | 'softGlow' | 'warm';

export type FrameType = 'none' | 'minimalWhite' | 'vintageWood' | 'polaroid' | 'classicBorder' | 'filmStrip';

export interface Artwork {
  id: string;
  templateId?: string;
  title: string;
  category: string;
  thumbnail: string; // Data URL of rendered artwork
  colorDataUrl?: string; // Data URL of the color canvas
  colorLayerData?: string; // Alias for backward/forward compatibility
  lineArtSvg?: string; // Svg path or image for custom imported
  customLineDataUrl?: string; // For photo-to-line imported templates
  canvasWidth?: number;
  canvasHeight?: number;
  paperColor: string;
  stickers: StickerItem[];
  texts: TextItem[];
  filter: FilterType;
  frame: FrameType;
  actions: DrawAction[]; // full history for playback
  createdAt: number;
  updatedAt: number;
  isDraft: boolean;
  completionRate?: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'eyecare';
  paperColor: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  defaultBrushSize: number;
  defaultBrushType: BrushType;
  autoSaveInterval: number; // in seconds
  showTouchIndicator: boolean;
  completedOnboarding: boolean;
  firstLaunch?: boolean;
  agreementAccepted?: boolean;
  agreementVersion?: string;
  agreementAcceptedAt?: number;
}

export interface PalettePreset {
  id: string;
  name: string;
  description: string;
  colors: string[];
}
