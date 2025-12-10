import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type {
  GenerateImageOptions,
  GeneratedImage,
  ImageStyle,
} from "../types/gemini.js";

// エラークラス
export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "GeminiAPIError";
  }
}

// API キーの取得
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new GeminiAPIError(
      "Gemini API key not configured. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.",
      "API_KEY_MISSING"
    );
  }
  return apiKey;
}

// API キーが設定されているかチェック
export function isGeminiConfigured(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

// プロンプト生成ロジック
export function generateImagePrompt(options: GenerateImageOptions): string {
  const { title, content, customPrompt, style = "illustration" } = options;

  // カスタムプロンプトが指定されている場合はそれを使用
  if (customPrompt) {
    return customPrompt;
  }

  // 本文から要約を抽出（約500文字まで）
  const contentSummary = content
    .replace(/^#.*$/gm, "") // 見出しを除去
    .replace(/!\[.*?\]\(.*?\)/g, "") // 画像記法を除去
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // リンクをテキストに
    .replace(/```[\s\S]*?```/g, "") // コードブロックを除去
    .replace(/`[^`]+`/g, "") // インラインコードを除去
    .replace(/\n+/g, " ") // 改行を空白に
    .trim()
    .slice(0, 500);

  // スタイル別のプロンプト修飾
  const styleModifiers: Record<ImageStyle, string> = {
    photorealistic: "photorealistic, high quality, professional photography",
    illustration: "digital illustration, vibrant colors, artistic",
    abstract: "abstract art, modern design, creative composition",
    minimalist: "minimalist design, clean lines, simple composition",
  };

  const styleModifier = styleModifiers[style];

  // 最終プロンプト生成
  return `Create a featured image for a blog article.
Title: "${title}"
Summary: ${contentSummary}

Style: ${styleModifier}
Requirements:
- Suitable for a blog header/featured image
- No text overlays on the image
- Professional and engaging visual
- Safe for work content only`;
}

// 画像生成
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = generateImagePrompt(options);

  const config: {
    responseModalities: ("TEXT" | "IMAGE")[];
    imageConfig?: { aspectRatio?: string };
  } = {
    responseModalities: ["IMAGE"],
  };

  // アスペクト比の設定（imageConfig 内にネストする必要がある）
  if (options.aspectRatio) {
    config.imageConfig = { aspectRatio: options.aspectRatio };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
      config,
    });

    // レスポンスから画像データを抽出
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new GeminiAPIError(
        "No image generated from Gemini API",
        "NO_CANDIDATES"
      );
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      throw new GeminiAPIError("No image data in response", "NO_PARTS");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return {
          base64Data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
          prompt,
        };
      }
    }

    throw new GeminiAPIError(
      "No inline image data found in response",
      "NO_IMAGE_DATA"
    );
  } catch (error) {
    if (error instanceof GeminiAPIError) {
      throw error;
    }
    throw new GeminiAPIError(
      error instanceof Error ? error.message : "Unknown error during image generation",
      "GENERATION_FAILED"
    );
  }
}

// MIME タイプから拡張子を取得
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  return mimeToExt[mimeType] || ".png";
}

// Base64データを一時ファイルに保存
export async function saveImageToTempFile(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const ext = getExtensionFromMimeType(mimeType);
  const filename = `featured-image-${Date.now()}${ext}`;
  const tempPath = path.join(os.tmpdir(), filename);

  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(tempPath, buffer);

  return tempPath;
}

// 一時ファイルを削除
export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // クリーンアップ失敗は無視
    console.error(`Failed to cleanup temp file: ${filePath}`);
  }
}
