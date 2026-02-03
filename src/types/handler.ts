import type { WordPressAPI } from '../utils/wordpress-api.js';
import type { AppConfig } from '../config/environment.js';

/**
 * ハンドラーコンテキスト
 * 各ハンドラーに渡される共通のコンテキスト
 */
export interface HandlerContext {
  wpAPI: WordPressAPI;
  config: AppConfig;
}

/**
 * ツールハンドラー関数の型
 */
export type ToolHandler = (args: unknown, ctx: HandlerContext) => Promise<unknown>;

/**
 * ツール名からハンドラーへのマッピング
 */
export type HandlerMap = Record<string, ToolHandler>;
