import type { HandlerContext } from '../types/handler.js';
import { getDisplayText } from '../utils/wordpress-helpers.js';
import {
  getCategoriesSchema,
  createCategorySchema,
  getTagsSchema,
  createTagSchema,
  getTaxonomiesSchema,
  getTaxonomyTermsSchema,
  createTaxonomyTermSchema,
  setPostTermsSchema,
} from '../schemas/taxonomy-schemas.js';

/**
 * get_categories ハンドラー
 */
export async function handleGetCategories(args: unknown, ctx: HandlerContext) {
  const input = getCategoriesSchema.parse(args);

  const categories = await ctx.wpAPI.getCategories({
    search: input.search,
    perPage: input.per_page,
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    count: cat.count,
    parent: cat.parent,
  }));
}

/**
 * create_category ハンドラー
 */
export async function handleCreateCategory(args: unknown, ctx: HandlerContext) {
  const input = createCategorySchema.parse(args);

  const category = await ctx.wpAPI.createCategory({
    name: input.name,
    slug: input.slug,
    description: input.description,
    parent: input.parent,
  });

  return {
    success: true,
    message: 'カテゴリを作成しました',
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent: category.parent,
    },
  };
}

/**
 * get_tags ハンドラー
 */
export async function handleGetTags(args: unknown, ctx: HandlerContext) {
  const input = getTagsSchema.parse(args);

  const tags = await ctx.wpAPI.getTags({
    search: input.search,
    perPage: input.per_page,
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    count: tag.count,
  }));
}

/**
 * create_tag ハンドラー
 */
export async function handleCreateTag(args: unknown, ctx: HandlerContext) {
  const input = createTagSchema.parse(args);

  const tag = await ctx.wpAPI.createTag({
    name: input.name,
    slug: input.slug,
    description: input.description,
  });

  return {
    success: true,
    message: 'タグを作成しました',
    tag: {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    },
  };
}

/**
 * get_taxonomies ハンドラー
 */
export async function handleGetTaxonomies(args: unknown, ctx: HandlerContext) {
  getTaxonomiesSchema.parse(args);

  const taxonomies = await ctx.wpAPI.getTaxonomies();

  return Object.entries(taxonomies).map(([slug, taxonomy]) => ({
    slug,
    name: taxonomy.name,
    description: taxonomy.description,
    types: taxonomy.types,
    hierarchical: taxonomy.hierarchical,
    rest_base: taxonomy.rest_base,
  }));
}

/**
 * get_taxonomy_terms ハンドラー
 */
export async function handleGetTaxonomyTerms(
  args: unknown,
  ctx: HandlerContext
) {
  const input = getTaxonomyTermsSchema.parse(args);

  const terms = await ctx.wpAPI.getTaxonomyTerms(input.taxonomy, {
    search: input.search,
    perPage: input.per_page,
    parent: input.parent,
    hide_empty: input.hide_empty,
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

/**
 * create_taxonomy_term ハンドラー
 */
export async function handleCreateTaxonomyTerm(
  args: unknown,
  ctx: HandlerContext
) {
  const input = createTaxonomyTermSchema.parse(args);

  const term = await ctx.wpAPI.createTaxonomyTerm(input.taxonomy, {
    name: input.name,
    slug: input.slug,
    description: input.description,
    parent: input.parent,
  });

  return {
    success: true,
    message: 'タームを作成しました',
    term: {
      id: term.id,
      name: term.name,
      slug: term.slug,
      parent: term.parent,
    },
  };
}

/**
 * set_post_terms ハンドラー
 */
export async function handleSetPostTerms(args: unknown, ctx: HandlerContext) {
  const input = setPostTermsSchema.parse(args);

  const post = await ctx.wpAPI.updatePostTaxonomyTerms(
    input.post_id,
    input.taxonomy,
    input.term_ids
  );

  return {
    success: true,
    message: '投稿にタームを設定しました',
    post: {
      id: post.id,
      title: getDisplayText(post.title),
      admin_url: ctx.wpAPI.getAdminPostUrl(post.id),
    },
  };
}
