#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

import { WordPressAPI, WordPressAPIError } from "./utils/wordpress-api.js";
import {
  processMarkdown,
  processMarkdownFile,
  replaceImagePaths,
  convertToGutenbergBlocks,
} from "./utils/markdown.js";
import {
  generateImage,
  saveImageToTempFile,
  cleanupTempFile,
  isGeminiConfigured,
  GeminiAPIError,
} from "./utils/gemini-image.js";
import { generateExcerpt } from "./utils/gemini-excerpt.js";
import type { AspectRatio, ImageStyle } from "./types/gemini.js";
import { postTools } from "./tools/posts.js";
import { mediaTools, categoryTools, tagTools, taxonomyTools } from "./tools/media.js";

// 環境変数チェック
const WORDPRESS_URL = process.env.WORDPRESS_URL;
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME;
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;
const WORDPRESS_POST_TYPE = process.env.WP_POST_TYPE || "posts";

if (!WORDPRESS_URL || !WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
  console.error("Error: Required environment variables are not set.");
  console.error("Please set: WORDPRESS_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD");
  console.error("Optional: WP_POST_TYPE (default: posts)");
  process.exit(1);
}

// WordPress API クライアント
const wpAPI = new WordPressAPI(
  WORDPRESS_URL,
  WORDPRESS_USERNAME,
  WORDPRESS_APP_PASSWORD,
  WORDPRESS_POST_TYPE
);

// MCP Server
const server = new Server(
  {
    name: "wordpress-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// すべての Tools を結合
const allTools = [...postTools, ...mediaTools, ...categoryTools, ...tagTools, ...taxonomyTools];

// Tool リスト
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

// Tool 呼び出し
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleToolCall(name, args as Record<string, unknown>);
    return {
      content: [
        {
          type: "text",
          text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof WordPressAPIError
        ? `WordPress API Error: ${error.message}`
        : error instanceof GeminiAPIError
          ? `Gemini API Error: ${error.message} (${error.code || "UNKNOWN"})`
          : error instanceof Error
            ? error.message
            : "Unknown error occurred";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    // ========== 投稿 ==========
    case "get_posts": {
      const posts = await wpAPI.getPosts({
        page: args.page as number,
        perPage: args.per_page as number,
        status: args.status as string,
        search: args.search as string,
        categories: args.categories as number[],
      });
      return posts.map((post) => ({
        id: post.id,
        title: post.title.rendered || post.title.raw,
        status: post.status,
        date: post.date,
        link: post.link,
        admin_url: wpAPI.getAdminPostUrl(post.id),
      }));
    }

    case "get_post": {
      const post = await wpAPI.getPost(args.post_id as number);
      return {
        id: post.id,
        title: post.title.rendered || post.title.raw,
        content: post.content.raw || post.content.rendered,
        status: post.status,
        date: post.date,
        modified: post.modified,
        link: post.link,
        categories: post.categories,
        tags: post.tags,
        admin_url: wpAPI.getAdminPostUrl(post.id),
      };
    }

    case "create_post": {
      const isMarkdown = args.is_markdown !== false;
      let content = args.content as string;
      let htmlContent = content;

      // Markdown 処理
      if (isMarkdown) {
        const basePath = args.base_path as string | undefined;
        const processed = processMarkdown(content, basePath);

        // ローカル画像のアップロード
        if (processed.localImages.length > 0) {
          const replacements = new Map<string, string>();

          for (const img of processed.localImages) {
            if (fs.existsSync(img.imagePath)) {
              const media = await wpAPI.uploadMedia(img.imagePath, {
                altText: img.altText,
              });
              // 元の相対パスをキーにして置換マップに追加
              replacements.set(img.originalPath, media.source_url);
            }
          }

          // 画像パスを置換してから Gutenberg ブロック変換
          content = replaceImagePaths(content, replacements);
          htmlContent = convertToGutenbergBlocks(content);
        } else {
          htmlContent = convertToGutenbergBlocks(content);
        }
      }

      // Excerpt 自動生成（未指定時のみ）
      let finalExcerpt = args.excerpt as string | undefined;
      if (!finalExcerpt && isGeminiConfigured()) {
        try {
          const excerptResult = await generateExcerpt({
            title: args.title as string,
            content: content, // Markdown元テキストを使用
          });
          finalExcerpt = excerptResult.excerpt;
          console.error(
            `Auto-generated excerpt (${excerptResult.characterCount} chars)`
          );
        } catch (error) {
          // Excerpt生成失敗は警告のみ（投稿作成は継続）
          console.error("Failed to generate excerpt:", error);
        }
      }

      const post = await wpAPI.createPost({
        title: args.title as string,
        content: htmlContent,
        status: (args.status as "publish" | "draft" | "pending" | "private") || "draft",
        categories: args.categories as number[],
        tags: args.tags as number[],
        excerpt: finalExcerpt,
        featured_media: args.featured_media as number,
      });

      return {
        success: true,
        message: "投稿を作成しました",
        post: {
          id: post.id,
          title: post.title.rendered || post.title.raw,
          status: post.status,
          link: post.link,
          preview_url: wpAPI.getPostPreviewUrl(post.id),
          admin_url: wpAPI.getAdminPostUrl(post.id),
        },
      };
    }

    case "create_post_from_file": {
      const filePath = args.file_path as string;
      const processed = processMarkdownFile(filePath);

      // タイトルはファイルから抽出、なければファイル名を使用
      const title = processed.title || path.basename(filePath, path.extname(filePath));

      // ローカル画像のアップロード
      let markdown = fs.readFileSync(path.resolve(filePath), "utf-8");
      if (processed.localImages.length > 0) {
        const replacements = new Map<string, string>();

        for (const img of processed.localImages) {
          if (fs.existsSync(img.imagePath)) {
            const media = await wpAPI.uploadMedia(img.imagePath, {
              altText: img.altText,
            });
            // 元の相対パスをキーにして置換マップに追加
            replacements.set(img.originalPath, media.source_url);
          }
        }

        markdown = replaceImagePaths(markdown, replacements);
      }

      const htmlContent = convertToGutenbergBlocks(markdown);

      // Excerpt 自動生成（Gemini API設定時のみ）
      let finalExcerpt: string | undefined;
      if (isGeminiConfigured()) {
        try {
          const excerptResult = await generateExcerpt({
            title,
            content: markdown, // Markdown元テキストを使用
          });
          finalExcerpt = excerptResult.excerpt;
          console.error(
            `Auto-generated excerpt (${excerptResult.characterCount} chars)`
          );
        } catch (error) {
          // Excerpt生成失敗は警告のみ（投稿作成は継続）
          console.error("Failed to generate excerpt:", error);
        }
      }

      const post = await wpAPI.createPost({
        title,
        content: htmlContent,
        status: (args.status as "publish" | "draft" | "pending" | "private") || "draft",
        categories: args.categories as number[],
        tags: args.tags as number[],
        excerpt: finalExcerpt,
        featured_media: args.featured_media as number,
      });

      return {
        success: true,
        message: "ファイルから投稿を作成しました",
        source_file: filePath,
        uploaded_images: processed.localImages.length,
        post: {
          id: post.id,
          title: post.title.rendered || post.title.raw,
          status: post.status,
          link: post.link,
          preview_url: wpAPI.getPostPreviewUrl(post.id),
          admin_url: wpAPI.getAdminPostUrl(post.id),
        },
      };
    }

    case "update_post": {
      const postId = args.post_id as number;
      const isMarkdown = args.is_markdown !== false;
      let htmlContent: string | undefined;

      if (args.content) {
        const content = args.content as string;

        if (isMarkdown) {
          const basePath = args.base_path as string | undefined;
          const processed = processMarkdown(content, basePath);

          if (processed.localImages.length > 0) {
            const replacements = new Map<string, string>();

            for (const img of processed.localImages) {
              if (fs.existsSync(img.imagePath)) {
                const media = await wpAPI.uploadMedia(img.imagePath, {
                  altText: img.altText,
                });
                // 元の相対パスをキーにして置換マップに追加
                replacements.set(img.originalPath, media.source_url);
              }
            }

            const updatedContent = replaceImagePaths(content, replacements);
            htmlContent = convertToGutenbergBlocks(updatedContent);
          } else {
            htmlContent = convertToGutenbergBlocks(content);
          }
        } else {
          htmlContent = content;
        }
      }

      const post = await wpAPI.updatePost(postId, {
        title: args.title as string,
        content: htmlContent,
        status: args.status as "publish" | "draft" | "pending" | "private",
        categories: args.categories as number[],
        tags: args.tags as number[],
        featured_media: args.featured_media as number,
      });

      return {
        success: true,
        message: "投稿を更新しました",
        post: {
          id: post.id,
          title: post.title.rendered || post.title.raw,
          status: post.status,
          link: post.link,
          admin_url: wpAPI.getAdminPostUrl(post.id),
        },
      };
    }

    case "delete_post": {
      const result = await wpAPI.deletePost(
        args.post_id as number,
        args.force as boolean
      );
      return {
        success: true,
        message: args.force ? "投稿を完全に削除しました" : "投稿をゴミ箱に移動しました",
        deleted_post: {
          id: result.previous.id,
          title: result.previous.title.rendered || result.previous.title.raw,
        },
      };
    }

    // ========== メディア ==========
    case "upload_media": {
      const media = await wpAPI.uploadMedia(args.file_path as string, {
        title: args.title as string,
        altText: args.alt_text as string,
        caption: args.caption as string,
      });

      return {
        success: true,
        message: "メディアをアップロードしました",
        media: {
          id: media.id,
          title: media.title.rendered || media.title.raw,
          url: media.source_url,
          mime_type: media.mime_type,
          width: media.media_details?.width,
          height: media.media_details?.height,
        },
      };
    }

    case "get_media": {
      const media = await wpAPI.getMedia(args.media_id as number);
      return {
        id: media.id,
        title: media.title.rendered || media.title.raw,
        url: media.source_url,
        alt_text: media.alt_text,
        mime_type: media.mime_type,
        width: media.media_details?.width,
        height: media.media_details?.height,
      };
    }

    case "delete_media": {
      const result = await wpAPI.deleteMedia(
        args.media_id as number,
        args.force as boolean ?? true
      );
      return {
        success: true,
        message: "メディアを削除しました",
        deleted_media: {
          id: result.previous.id,
          title: result.previous.title.rendered || result.previous.title.raw,
          url: result.previous.source_url,
        },
      };
    }

    case "generate_featured_image": {
      // API キーチェック
      if (!isGeminiConfigured()) {
        throw new GeminiAPIError(
          "Gemini API is not configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.",
          "API_KEY_MISSING"
        );
      }

      // 画像生成
      const generated = await generateImage({
        title: args.title as string,
        content: args.content as string,
        customPrompt: args.custom_prompt as string | undefined,
        aspectRatio: (args.aspect_ratio as AspectRatio) || "16:9",
        style: (args.style as ImageStyle) || "illustration",
      });

      // 一時ファイルのパスを try-finally スコープの外で宣言
      // これにより、saveImageToTempFile 後のあらゆるエラーでもクリーンアップが保証される
      let tempFilePath: string | undefined;
      try {
        // 一時ファイルに保存
        tempFilePath = await saveImageToTempFile(
          generated.base64Data,
          generated.mimeType
        );

        // WordPress にアップロード
        const media = await wpAPI.uploadMedia(tempFilePath, {
          title: args.title as string,
          altText: (args.alt_text as string) || (args.title as string),
        });

        return {
          success: true,
          message: "アイキャッチ画像を生成してアップロードしました",
          media: {
            id: media.id,
            title: media.title.rendered || media.title.raw,
            url: media.source_url,
            width: media.media_details?.width,
            height: media.media_details?.height,
          },
          generation_info: {
            prompt_used: generated.prompt,
            aspect_ratio: args.aspect_ratio || "16:9",
            style: args.style || "illustration",
          },
          usage_hint: `このメディア ID (${media.id}) を create_post の featured_media パラメータに指定してください`,
        };
      } finally {
        // 一時ファイルが作成されていた場合はクリーンアップ
        if (tempFilePath) {
          cleanupTempFile(tempFilePath);
        }
      }
    }

    // ========== カテゴリ ==========
    case "get_categories": {
      const categories = await wpAPI.getCategories({
        search: args.search as string,
        perPage: args.per_page as number,
      });
      return categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count,
        parent: cat.parent,
      }));
    }

    case "create_category": {
      const category = await wpAPI.createCategory({
        name: args.name as string,
        slug: args.slug as string,
        description: args.description as string,
        parent: args.parent as number,
      });
      return {
        success: true,
        message: "カテゴリを作成しました",
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          parent: category.parent,
        },
      };
    }

    // ========== タグ ==========
    case "get_tags": {
      const tags = await wpAPI.getTags({
        search: args.search as string,
        perPage: args.per_page as number,
      });
      return tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag.count,
      }));
    }

    case "create_tag": {
      const tag = await wpAPI.createTag({
        name: args.name as string,
        slug: args.slug as string,
        description: args.description as string,
      });
      return {
        success: true,
        message: "タグを作成しました",
        tag: {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        },
      };
    }

    // ========== カスタムタクソノミー ==========
    case "get_taxonomies": {
      const taxonomies = await wpAPI.getTaxonomies();
      return Object.entries(taxonomies).map(([slug, taxonomy]) => ({
        slug,
        name: taxonomy.name,
        description: taxonomy.description,
        types: taxonomy.types,
        hierarchical: taxonomy.hierarchical,
        rest_base: taxonomy.rest_base,
      }));
    }

    case "get_taxonomy_terms": {
      const terms = await wpAPI.getTaxonomyTerms(args.taxonomy as string, {
        search: args.search as string,
        perPage: args.per_page as number,
        parent: args.parent as number,
        hide_empty: args.hide_empty as boolean,
      });
      return terms.map((term) => ({
        id: term.id,
        name: term.name,
        slug: term.slug,
        description: term.description,
        parent: term.parent,
        count: term.count,
      }));
    }

    case "create_taxonomy_term": {
      const term = await wpAPI.createTaxonomyTerm(args.taxonomy as string, {
        name: args.name as string,
        slug: args.slug as string,
        description: args.description as string,
        parent: args.parent as number,
      });
      return {
        success: true,
        message: "タームを作成しました",
        term: {
          id: term.id,
          name: term.name,
          slug: term.slug,
          parent: term.parent,
        },
      };
    }

    case "set_post_terms": {
      const post = await wpAPI.updatePostTaxonomyTerms(
        args.post_id as number,
        args.taxonomy as string,
        args.term_ids as number[]
      );
      return {
        success: true,
        message: "投稿にタームを設定しました",
        post: {
          id: post.id,
          title: post.title.rendered || post.title.raw,
          admin_url: wpAPI.getAdminPostUrl(post.id),
        },
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WordPress MCP Server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
