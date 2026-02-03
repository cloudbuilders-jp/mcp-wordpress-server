import type { HandlerContext } from '../types/handler.js';
import { PostService } from '../services/post-service.js';
import { getDisplayText } from '../utils/wordpress-helpers.js';
import {
  getPostsSchema,
  getPostSchema,
  createPostSchema,
  createPostFromFileSchema,
  updatePostSchema,
  deletePostSchema,
} from '../schemas/post-schemas.js';

/**
 * get_posts ハンドラー
 */
export async function handleGetPosts(args: unknown, ctx: HandlerContext) {
  const input = getPostsSchema.parse(args);

  const posts = await ctx.wpAPI.getPosts({
    page: input.page,
    perPage: input.per_page,
    status: input.status,
    search: input.search,
    categories: input.categories,
  });

  return posts.map((post) => ({
    id: post.id,
    title: getDisplayText(post.title),
    status: post.status,
    date: post.date,
    link: post.link,
    admin_url: ctx.wpAPI.getAdminPostUrl(post.id),
  }));
}

/**
 * get_post ハンドラー
 */
export async function handleGetPost(args: unknown, ctx: HandlerContext) {
  const input = getPostSchema.parse(args);

  const post = await ctx.wpAPI.getPost(input.post_id);

  return {
    id: post.id,
    title: getDisplayText(post.title),
    content: post.content.raw || post.content.rendered,
    status: post.status,
    date: post.date,
    modified: post.modified,
    link: post.link,
    categories: post.categories,
    tags: post.tags,
    admin_url: ctx.wpAPI.getAdminPostUrl(post.id),
  };
}

/**
 * create_post ハンドラー
 */
export async function handleCreatePost(args: unknown, ctx: HandlerContext) {
  const input = createPostSchema.parse(args);

  const result = await PostService.createPost(input, ctx);

  return {
    success: true,
    message: '投稿を作成しました',
    uploaded_images: result.uploadedImageCount,
    post: {
      id: result.post.id,
      title: getDisplayText(result.post.title),
      status: result.post.status,
      link: result.post.link,
      preview_url: ctx.wpAPI.getPostPreviewUrl(result.post.id),
      admin_url: ctx.wpAPI.getAdminPostUrl(result.post.id),
    },
  };
}

/**
 * create_post_from_file ハンドラー
 */
export async function handleCreatePostFromFile(
  args: unknown,
  ctx: HandlerContext
) {
  const input = createPostFromFileSchema.parse(args);

  const result = await PostService.createPostFromFile(input, ctx);

  return {
    success: true,
    message: 'ファイルから投稿を作成しました',
    source_file: input.file_path,
    uploaded_images: result.uploadedImageCount,
    post: {
      id: result.post.id,
      title: getDisplayText(result.post.title),
      status: result.post.status,
      link: result.post.link,
      preview_url: ctx.wpAPI.getPostPreviewUrl(result.post.id),
      admin_url: ctx.wpAPI.getAdminPostUrl(result.post.id),
    },
  };
}

/**
 * update_post ハンドラー
 */
export async function handleUpdatePost(args: unknown, ctx: HandlerContext) {
  const input = updatePostSchema.parse(args);

  const post = await PostService.updatePost(input, ctx);

  return {
    success: true,
    message: '投稿を更新しました',
    post: {
      id: post.id,
      title: getDisplayText(post.title),
      status: post.status,
      link: post.link,
      admin_url: ctx.wpAPI.getAdminPostUrl(post.id),
    },
  };
}

/**
 * delete_post ハンドラー
 */
export async function handleDeletePost(args: unknown, ctx: HandlerContext) {
  const input = deletePostSchema.parse(args);

  const result = await ctx.wpAPI.deletePost(input.post_id, input.force);

  return {
    success: true,
    message: input.force
      ? '投稿を完全に削除しました'
      : '投稿をゴミ箱に移動しました',
    deleted_post: {
      id: result.previous.id,
      title: getDisplayText(result.previous.title),
    },
  };
}
