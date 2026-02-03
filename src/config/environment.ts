import { z } from 'zod';

/**
 * 環境変数スキーマ
 * Zodによるバリデーション付き設定管理
 */
const envSchema = z.object({
  // WordPress必須設定
  WORDPRESS_URL: z.string().url("WORDPRESS_URL must be a valid URL"),
  WORDPRESS_USERNAME: z.string().min(1, "WORDPRESS_USERNAME is required"),
  WORDPRESS_APP_PASSWORD: z.string().min(1, "WORDPRESS_APP_PASSWORD is required"),
  WP_POST_TYPE: z.string().default('posts'),

  // Gemini API（オプショナル）
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),

  // 画像圧縮設定
  IMAGE_COMPRESSION_ENABLED: z
    .string()
    .optional()
    .transform((val) => val !== 'false'),
  IMAGE_SIZE_THRESHOLD: z.coerce.number().default(1048576),
  IMAGE_COMPRESSION_QUALITY: z.coerce.number().min(1).max(100).default(80),
  IMAGE_MAX_WIDTH: z.coerce.number().default(1920),
  IMAGE_MAX_HEIGHT: z.coerce.number().default(1080),
});

export type AppConfig = z.infer<typeof envSchema>;

/**
 * 環境変数を読み込み、バリデーションを実行
 */
export function loadConfig(): AppConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Environment validation failed:');
    console.error('Please set: WORDPRESS_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD');
    console.error('Optional: WP_POST_TYPE (default: posts)');
    console.error('Optional: GEMINI_API_KEY or GOOGLE_API_KEY');
    process.exit(1);
  }
  return result.data;
}

