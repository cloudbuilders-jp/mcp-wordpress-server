import type { HandlerMap } from '../types/handler.js';
import * as postHandlers from './post-handler.js';
import * as mediaHandlers from './media-handler.js';
import * as taxonomyHandlers from './taxonomy-handler.js';

/**
 * ツール名からハンドラーへのマッピング
 *
 * 元の index.ts の 500行switch文を置き換える
 */
export const handlers: HandlerMap = {
  // ========== 投稿 ==========
  get_posts: postHandlers.handleGetPosts,
  get_post: postHandlers.handleGetPost,
  create_post: postHandlers.handleCreatePost,
  create_post_from_file: postHandlers.handleCreatePostFromFile,
  update_post: postHandlers.handleUpdatePost,
  delete_post: postHandlers.handleDeletePost,

  // ========== メディア ==========
  upload_media: mediaHandlers.handleUploadMedia,
  get_media: mediaHandlers.handleGetMedia,
  delete_media: mediaHandlers.handleDeleteMedia,
  generate_featured_image: mediaHandlers.handleGenerateFeaturedImage,

  // ========== カテゴリ ==========
  get_categories: taxonomyHandlers.handleGetCategories,
  create_category: taxonomyHandlers.handleCreateCategory,

  // ========== タグ ==========
  get_tags: taxonomyHandlers.handleGetTags,
  create_tag: taxonomyHandlers.handleCreateTag,

  // ========== カスタムタクソノミー ==========
  get_taxonomies: taxonomyHandlers.handleGetTaxonomies,
  get_taxonomy_terms: taxonomyHandlers.handleGetTaxonomyTerms,
  create_taxonomy_term: taxonomyHandlers.handleCreateTaxonomyTerm,
  set_post_terms: taxonomyHandlers.handleSetPostTerms,
};

/**
 * ツール名からハンドラーを取得する
 *
 * @param toolName - ツール名
 * @returns ハンドラー関数
 * @throws ツールが見つからない場合
 */
export function getHandler(toolName: string) {
  const handler = handlers[toolName];
  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  return handler;
}
