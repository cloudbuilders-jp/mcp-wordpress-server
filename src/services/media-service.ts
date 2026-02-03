import type { HandlerContext } from '../types/handler.js';
import type { WPMedia } from '../types/wordpress.js';
import type {
  UploadMediaInput,
  GenerateFeaturedImageInput,
} from '../schemas/media-schemas.js';
import {
  generateImage,
  saveImageToTempFile,
  cleanupTempFile,
  isGeminiConfigured,
  GeminiAPIError,
} from '../utils/gemini-image.js';
import type { AspectRatio, ImageStyle } from '../types/gemini.js';

/**
 * 画像生成結果
 */
export interface GenerateFeaturedImageResult {
  media: WPMedia;
  generationInfo: {
    prompt: string;
    aspectRatio: string;
    style: string;
  };
}

/**
 * メディアサービス
 *
 * メディアアップロードと画像生成に関するビジネスロジックを統合
 */
export class MediaService {
  /**
   * メディアをアップロードする
   */
  static async uploadMedia(
    input: UploadMediaInput,
    ctx: HandlerContext
  ): Promise<WPMedia> {
    const media = await ctx.wpAPI.uploadMedia(input.file_path, {
      title: input.title,
      altText: input.alt_text,
      caption: input.caption,
    });

    return media;
  }

  /**
   * アイキャッチ画像を生成してアップロードする
   */
  static async generateFeaturedImage(
    input: GenerateFeaturedImageInput,
    ctx: HandlerContext
  ): Promise<GenerateFeaturedImageResult> {
    // API キーチェック
    if (!isGeminiConfigured()) {
      throw new GeminiAPIError(
        'Gemini API is not configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.',
        'API_KEY_MISSING'
      );
    }

    // 画像生成
    const generated = await generateImage({
      title: input.title,
      content: input.content,
      customPrompt: input.custom_prompt,
      aspectRatio: (input.aspect_ratio as AspectRatio) || '16:9',
      style: (input.style as ImageStyle) || 'illustration',
    });

    // 一時ファイルのパスを try-finally スコープの外で宣言
    let tempFilePath: string | undefined;

    try {
      // 一時ファイルに保存
      tempFilePath = await saveImageToTempFile(
        generated.base64Data,
        generated.mimeType
      );

      // WordPress にアップロード
      const media = await ctx.wpAPI.uploadMedia(tempFilePath, {
        title: input.title,
        altText: input.alt_text || input.title,
      });

      return {
        media,
        generationInfo: {
          prompt: generated.prompt,
          aspectRatio: input.aspect_ratio || '16:9',
          style: input.style || 'illustration',
        },
      };
    } finally {
      // 一時ファイルが作成されていた場合はクリーンアップ
      if (tempFilePath) {
        cleanupTempFile(tempFilePath);
      }
    }
  }
}
