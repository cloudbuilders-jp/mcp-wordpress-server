// Gemini API 型定義

export type AspectRatio =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9';

export type ImageStyle = 'photorealistic' | 'illustration' | 'abstract' | 'minimalist';

export interface GeminiImageConfig {
  aspectRatio?: AspectRatio;
}

export interface GenerateImageOptions {
  title: string;
  content: string;
  customPrompt?: string;
  aspectRatio?: AspectRatio;
  style?: ImageStyle;
}

export interface GeneratedImage {
  base64Data: string;
  mimeType: string;
  prompt: string;
}

// SEO Excerpt 生成用
export interface GenerateExcerptOptions {
  title: string;
  content: string;
  maxLength?: number; // デフォルト: 160文字
}

export interface GeneratedExcerpt {
  excerpt: string;
  characterCount: number;
  promptUsed: string;
}
