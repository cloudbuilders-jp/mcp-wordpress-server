import * as fs from 'fs';
import * as path from 'path';
import type { HandlerContext } from '../types/handler.js';
import type { WPPost } from '../types/wordpress.js';
import type {
  CreatePostInput,
  CreatePostFromFileInput,
  UpdatePostInput,
} from '../schemas/post-schemas.js';
import {
  processMarkdown,
  processMarkdownFile,
  convertToGutenbergBlocks,
} from '../utils/markdown.js';
import { generateExcerpt } from '../utils/gemini-excerpt.js';
import { isGeminiConfigured } from '../utils/gemini-image.js';
import { ImageUploadPipeline } from './image-upload-pipeline.js';

/**
 * 投稿作成結果
 */
export interface CreatePostResult {
  post: WPPost;
  uploadedImageCount: number;
}

/**
 * 投稿サービス
 *
 * 投稿の作成・更新に関するビジネスロジックを統合
 * Markdown処理、画像アップロード、Excerpt生成を一元管理
 */
export class PostService {
  /**
   * 投稿を作成する
   */
  static async createPost(
    input: CreatePostInput,
    ctx: HandlerContext
  ): Promise<CreatePostResult> {
    const isMarkdown = input.is_markdown !== false;
    let content = input.content;
    let htmlContent = content;
    let uploadedImageCount = 0;

    // Markdown処理
    if (isMarkdown) {
      const result = await this.processMarkdownContent(
        content,
        input.base_path,
        ctx
      );
      htmlContent = result.htmlContent;
      uploadedImageCount = result.uploadedImageCount;
      content = result.processedMarkdown;
    }

    // Excerpt自動生成
    const finalExcerpt = await this.generateExcerptIfNeeded(
      input.excerpt,
      input.title,
      content
    );

    // WordPress投稿作成
    const post = await ctx.wpAPI.createPost({
      title: input.title,
      content: htmlContent,
      status: input.status || 'draft',
      categories: input.categories,
      tags: input.tags,
      excerpt: finalExcerpt,
      featured_media: input.featured_media,
    });

    return { post, uploadedImageCount };
  }

  /**
   * ファイルから投稿を作成する
   */
  static async createPostFromFile(
    input: CreatePostFromFileInput,
    ctx: HandlerContext
  ): Promise<CreatePostResult> {
    const filePath = input.file_path;
    const processed = processMarkdownFile(filePath);

    // タイトルはファイルから抽出、なければファイル名を使用
    const title =
      processed.title || path.basename(filePath, path.extname(filePath));

    // Markdownコンテンツを読み込み
    let markdown = fs.readFileSync(path.resolve(filePath), 'utf-8');
    let uploadedImageCount = 0;

    // ローカル画像のアップロード
    if (processed.localImages.length > 0) {
      const uploadResult = await ImageUploadPipeline.uploadAndReplace(
        markdown,
        processed.localImages,
        ctx.wpAPI
      );
      markdown = uploadResult.updatedMarkdown;
      uploadedImageCount = uploadResult.uploadedCount;
    }

    const htmlContent = convertToGutenbergBlocks(markdown);

    // Excerpt自動生成
    const finalExcerpt = await this.generateExcerptIfNeeded(
      undefined,
      title,
      markdown
    );

    // WordPress投稿作成
    const post = await ctx.wpAPI.createPost({
      title,
      content: htmlContent,
      status: input.status || 'draft',
      categories: input.categories,
      tags: input.tags,
      excerpt: finalExcerpt,
      featured_media: input.featured_media,
    });

    return { post, uploadedImageCount };
  }

  /**
   * 投稿を更新する
   */
  static async updatePost(
    input: UpdatePostInput,
    ctx: HandlerContext
  ): Promise<WPPost> {
    const isMarkdown = input.is_markdown !== false;
    let htmlContent: string | undefined;

    if (input.content) {
      if (isMarkdown) {
        const result = await this.processMarkdownContent(
          input.content,
          input.base_path,
          ctx
        );
        htmlContent = result.htmlContent;
      } else {
        htmlContent = input.content;
      }
    }

    // WordPress投稿更新
    const post = await ctx.wpAPI.updatePost(input.post_id, {
      title: input.title,
      content: htmlContent,
      status: input.status,
      categories: input.categories,
      tags: input.tags,
      excerpt: input.excerpt,
      featured_media: input.featured_media,
    });

    return post;
  }

  /**
   * Markdownコンテンツを処理する（共通処理）
   *
   * @param markdown - 元のMarkdownコンテンツ
   * @param basePath - 相対パスの基準ディレクトリ
   * @param ctx - ハンドラーコンテキスト
   * @returns 処理結果
   */
  private static async processMarkdownContent(
    markdown: string,
    basePath: string | undefined,
    ctx: HandlerContext
  ): Promise<{
    htmlContent: string;
    uploadedImageCount: number;
    processedMarkdown: string;
  }> {
    const processed = processMarkdown(markdown, basePath);
    let content = markdown;
    let uploadedImageCount = 0;

    // ローカル画像のアップロード
    if (processed.localImages.length > 0) {
      const uploadResult = await ImageUploadPipeline.uploadAndReplace(
        content,
        processed.localImages,
        ctx.wpAPI
      );
      content = uploadResult.updatedMarkdown;
      uploadedImageCount = uploadResult.uploadedCount;
    }

    const htmlContent = convertToGutenbergBlocks(content);

    return {
      htmlContent,
      uploadedImageCount,
      processedMarkdown: content,
    };
  }

  /**
   * 必要に応じてExcerptを自動生成する
   *
   * @param explicitExcerpt - 明示的に指定されたExcerpt
   * @param title - 投稿タイトル
   * @param content - 投稿コンテンツ
   * @returns Excerpt文字列（生成できない場合はundefined）
   */
  private static async generateExcerptIfNeeded(
    explicitExcerpt: string | undefined,
    title: string,
    content: string
  ): Promise<string | undefined> {
    // 明示的に指定されている場合はそれを使用
    if (explicitExcerpt) {
      return explicitExcerpt;
    }

    // Gemini APIが設定されていない場合はスキップ
    if (!isGeminiConfigured()) {
      return undefined;
    }

    try {
      const result = await generateExcerpt({ title, content });
      console.error(
        `Auto-generated excerpt (${result.characterCount} chars)`
      );
      return result.excerpt;
    } catch (error) {
      // Excerpt生成失敗は警告のみ（投稿作成は継続）
      console.error('Failed to generate excerpt:', error);
      return undefined;
    }
  }
}
