import type { HandlerContext } from '../types/handler.js';
import { MediaService } from '../services/media-service.js';
import { getDisplayText } from '../utils/wordpress-helpers.js';
import {
  uploadMediaSchema,
  getMediaSchema,
  deleteMediaSchema,
  generateFeaturedImageSchema,
} from '../schemas/media-schemas.js';

/**
 * upload_media ハンドラー
 */
export async function handleUploadMedia(args: unknown, ctx: HandlerContext) {
  const input = uploadMediaSchema.parse(args);

  const media = await MediaService.uploadMedia(input, ctx);

  return {
    success: true,
    message: 'メディアをアップロードしました',
    media: {
      id: media.id,
      title: getDisplayText(media.title),
      url: media.source_url,
      mime_type: media.mime_type,
      width: media.media_details?.width,
      height: media.media_details?.height,
    },
  };
}

/**
 * get_media ハンドラー
 */
export async function handleGetMedia(args: unknown, ctx: HandlerContext) {
  const input = getMediaSchema.parse(args);

  const media = await ctx.wpAPI.getMedia(input.media_id);

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

/**
 * delete_media ハンドラー
 */
export async function handleDeleteMedia(args: unknown, ctx: HandlerContext) {
  const input = deleteMediaSchema.parse(args);

  const result = await ctx.wpAPI.deleteMedia(input.media_id, input.force ?? true);

  return {
    success: true,
    message: 'メディアを削除しました',
    deleted_media: {
      id: result.previous.id,
      title: result.previous.title.rendered || result.previous.title.raw,
      url: result.previous.source_url,
    },
  };
}

/**
 * generate_featured_image ハンドラー
 */
export async function handleGenerateFeaturedImage(args: unknown, ctx: HandlerContext) {
  const input = generateFeaturedImageSchema.parse(args);

  const result = await MediaService.generateFeaturedImage(input, ctx);

  return {
    success: true,
    message: 'アイキャッチ画像を生成してアップロードしました',
    media: {
      id: result.media.id,
      title: result.media.title.rendered || result.media.title.raw,
      url: result.media.source_url,
      width: result.media.media_details?.width,
      height: result.media.media_details?.height,
    },
    generation_info: {
      prompt_used: result.generationInfo.prompt,
      aspect_ratio: result.generationInfo.aspectRatio,
      style: result.generationInfo.style,
    },
    usage_hint: `このメディア ID (${result.media.id}) を create_post の featured_media パラメータに指定してください`,
  };
}
