import { z } from 'zod';

/**
 * 投稿ステータスのスキーマ
 */
export const postStatusSchema = z.enum(['publish', 'draft', 'pending', 'private']);

/**
 * get_posts のスキーマ
 */
export const getPostsSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  categories: z.array(z.number()).optional(),
});
export type GetPostsInput = z.infer<typeof getPostsSchema>;

/**
 * get_post のスキーマ
 */
export const getPostSchema = z.object({
  post_id: z.number(),
});
export type GetPostInput = z.infer<typeof getPostSchema>;

/**
 * create_post のスキーマ
 */
export const createPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  status: postStatusSchema.optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  excerpt: z.string().optional(),
  is_markdown: z.boolean().optional().default(true),
  base_path: z.string().optional(),
  featured_media: z.number().optional(),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * create_post_from_file のスキーマ
 */
export const createPostFromFileSchema = z.object({
  file_path: z.string(),
  status: postStatusSchema.optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  featured_media: z.number().optional(),
});
export type CreatePostFromFileInput = z.infer<typeof createPostFromFileSchema>;

/**
 * update_post のスキーマ
 */
export const updatePostSchema = z.object({
  post_id: z.number(),
  title: z.string().optional(),
  content: z.string().optional(),
  status: postStatusSchema.optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  excerpt: z.string().optional(),
  is_markdown: z.boolean().optional().default(true),
  base_path: z.string().optional(),
  featured_media: z.number().optional(),
});
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

/**
 * delete_post のスキーマ
 */
export const deletePostSchema = z.object({
  post_id: z.number(),
  force: z.boolean().optional(),
});
export type DeletePostInput = z.infer<typeof deletePostSchema>;
