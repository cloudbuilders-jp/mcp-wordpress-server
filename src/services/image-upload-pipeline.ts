import * as fs from 'fs';
import { WordPressAPI } from '../utils/wordpress-api.js';
import { replaceImagePaths } from '../utils/markdown.js';
import type { ImageReference } from '../utils/markdown.js';

// ImageReferenceをre-export（サービス層からの利用を容易にするため）
export type { ImageReference };

/**
 * 画像アップロードパイプラインの結果
 */
export interface ImageUploadResult {
  updatedMarkdown: string;
  replacements: Map<string, string>;
  uploadedCount: number;
}

/**
 * 画像アップロードパイプライン
 *
 * create_post, create_post_from_file, update_post で共通使用する
 * ローカル画像アップロード処理を統合
 */
export class ImageUploadPipeline {
  /**
   * ローカル画像をアップロードし、Markdown内のパスを置換する
   *
   * @param markdown - 元のMarkdownコンテンツ
   * @param localImages - ローカル画像参照の配列
   * @param wpAPI - WordPress APIクライアント
   * @returns アップロード結果（更新されたMarkdownと置換マップ）
   */
  static async uploadAndReplace(
    markdown: string,
    localImages: ImageReference[],
    wpAPI: WordPressAPI
  ): Promise<ImageUploadResult> {
    const replacements = new Map<string, string>();
    let uploadedCount = 0;

    for (const img of localImages) {
      if (fs.existsSync(img.imagePath)) {
        try {
          const media = await wpAPI.uploadMedia(img.imagePath, {
            altText: img.altText,
          });
          replacements.set(img.originalPath, media.source_url);
          uploadedCount++;
        } catch (error) {
          console.error(`Failed to upload image: ${img.imagePath}`, error);
          // 画像アップロード失敗は警告のみ、処理は継続
        }
      } else {
        console.error(`Image file not found: ${img.imagePath}`);
      }
    }

    const updatedMarkdown = replaceImagePaths(markdown, replacements);

    return {
      updatedMarkdown,
      replacements,
      uploadedCount,
    };
  }
}
