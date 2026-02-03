/**
 * WordPress APIレスポンス用ヘルパー関数
 */

/**
 * WordPressのrenderedフィールドから表示用テキストを取得
 *
 * @param field - rendered/rawプロパティを持つオブジェクト
 * @returns 表示用テキスト（renderedが優先、なければraw）
 */
export function getDisplayText(field: {
  rendered: string;
  raw?: string;
}): string {
  return field.rendered || field.raw || '';
}
