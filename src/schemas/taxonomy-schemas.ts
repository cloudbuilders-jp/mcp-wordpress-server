import { z } from 'zod';

/**
 * get_categories のスキーマ
 */
export const getCategoriesSchema = z.object({
  search: z.string().optional(),
  per_page: z.number().optional(),
});
export type GetCategoriesInput = z.infer<typeof getCategoriesSchema>;

/**
 * create_category のスキーマ
 */
export const createCategorySchema = z.object({
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent: z.number().optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/**
 * get_tags のスキーマ
 */
export const getTagsSchema = z.object({
  search: z.string().optional(),
  per_page: z.number().optional(),
});
export type GetTagsInput = z.infer<typeof getTagsSchema>;

/**
 * create_tag のスキーマ
 */
export const createTagSchema = z.object({
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
});
export type CreateTagInput = z.infer<typeof createTagSchema>;

/**
 * get_taxonomies のスキーマ（引数なし）
 */
export const getTaxonomiesSchema = z.object({});
export type GetTaxonomiesInput = z.infer<typeof getTaxonomiesSchema>;

/**
 * get_taxonomy_terms のスキーマ
 */
export const getTaxonomyTermsSchema = z.object({
  taxonomy: z.string(),
  search: z.string().optional(),
  per_page: z.number().optional(),
  parent: z.number().optional(),
  hide_empty: z.boolean().optional(),
});
export type GetTaxonomyTermsInput = z.infer<typeof getTaxonomyTermsSchema>;

/**
 * create_taxonomy_term のスキーマ
 */
export const createTaxonomyTermSchema = z.object({
  taxonomy: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent: z.number().optional(),
});
export type CreateTaxonomyTermInput = z.infer<typeof createTaxonomyTermSchema>;

/**
 * set_post_terms のスキーマ
 */
export const setPostTermsSchema = z.object({
  post_id: z.number(),
  taxonomy: z.string(),
  term_ids: z.array(z.number()),
});
export type SetPostTermsInput = z.infer<typeof setPostTermsSchema>;
