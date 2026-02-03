import { z } from 'zod';

/**
 * アスペクト比のスキーマ
 */
export const aspectRatioSchema = z.enum([
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
]);

/**
 * 画像スタイルのスキーマ
 */
export const imageStyleSchema = z.enum([
  'photorealistic',
  'illustration',
  'abstract',
  'minimalist',
]);

/**
 * upload_media のスキーマ
 */
export const uploadMediaSchema = z.object({
  file_path: z.string(),
  title: z.string().optional(),
  alt_text: z.string().optional(),
  caption: z.string().optional(),
});
export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;

/**
 * get_media のスキーマ
 */
export const getMediaSchema = z.object({
  media_id: z.number(),
});
export type GetMediaInput = z.infer<typeof getMediaSchema>;

/**
 * delete_media のスキーマ
 */
export const deleteMediaSchema = z.object({
  media_id: z.number(),
  force: z.boolean().optional(),
});
export type DeleteMediaInput = z.infer<typeof deleteMediaSchema>;

/**
 * generate_featured_image のスキーマ
 */
export const generateFeaturedImageSchema = z.object({
  title: z.string(),
  content: z.string(),
  custom_prompt: z.string().optional(),
  aspect_ratio: aspectRatioSchema.optional(),
  style: imageStyleSchema.optional(),
  alt_text: z.string().optional(),
});
export type GenerateFeaturedImageInput = z.infer<typeof generateFeaturedImageSchema>;
