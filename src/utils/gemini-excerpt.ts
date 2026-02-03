import { GoogleGenAI } from '@google/genai';
import { GeminiAPIError, getApiKey } from './gemini-image.js';
import type { GenerateExcerptOptions, GeneratedExcerpt } from '../types/gemini.js';

// コンテンツをクリーンアップしてプロンプト用に整形
function cleanContentForPrompt(content: string): string {
  return content
    .replace(/^#.*$/gm, '') // 見出しを除去
    .replace(/!\[.*?\]\(.*?\)/g, '') // 画像記法を除去
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // リンクをテキストに
    .replace(/```[\s\S]*?```/g, '') // コードブロックを除去
    .replace(/`[^`]+`/g, '') // インラインコードを除去
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold を除去
    .replace(/\*([^*]+)\*/g, '$1') // Italic を除去
    .replace(/\n+/g, ' ') // 改行を空白に
    .replace(/\s+/g, ' ') // 連続空白を1つに
    .trim()
    .slice(0, 1500); // 最大1500文字まで
}

// プロンプト生成
export function generateExcerptPrompt(options: GenerateExcerptOptions): string {
  const { title, content, maxLength = 160 } = options;
  const cleanContent = cleanContentForPrompt(content);

  return `以下のブログ記事のメタディスクリプション（excerpt）を生成してください。

記事タイトル: ${title}

記事本文:
${cleanContent}

要件:
- ${maxLength}文字以内（厳守）
- SEOに最適化された要約文
- 読者の興味を引く魅力的な内容
- 記事の主要なポイントを簡潔にまとめる
- 「この記事では」「について解説します」などの冗長な表現は避ける
- 検索結果に表示されることを想定した文章

生成するメタディスクリプションのテキストのみを返してください。前置きや説明は不要です。`;
}

// Excerpt 生成
export async function generateExcerpt(options: GenerateExcerptOptions): Promise<GeneratedExcerpt> {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const maxLength = options.maxLength || 160;
  const prompt = generateExcerptPrompt(options);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    // レスポンスからテキストを抽出
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new GeminiAPIError('No excerpt generated from Gemini API', 'NO_CANDIDATES');
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      throw new GeminiAPIError('No text in response', 'NO_PARTS');
    }

    // テキストパートを取得
    let excerpt = '';
    for (const part of parts) {
      if (part.text) {
        excerpt += part.text;
      }
    }

    // 前後の空白・改行・引用符を削除
    excerpt = excerpt.trim().replace(/^["'「」]|["'「」]$/g, '');

    // 最大文字数を超えている場合は切り詰め
    if (excerpt.length > maxLength) {
      excerpt = excerpt.slice(0, maxLength - 3) + '...';
    }

    return {
      excerpt,
      characterCount: excerpt.length,
      promptUsed: prompt,
    };
  } catch (error) {
    if (error instanceof GeminiAPIError) {
      throw error;
    }
    throw new GeminiAPIError(
      error instanceof Error ? error.message : 'Unknown error during excerpt generation',
      'GENERATION_FAILED'
    );
  }
}
