import { marked } from "marked";
import * as path from "path";
import * as fs from "fs";

// Gutenberg ブロック変換を再エクスポート
export { convertToGutenbergBlocks } from "./gutenberg-renderer.js";

// GFM (GitHub Flavored Markdown) を有効化
marked.use({
  gfm: true,
  breaks: true,
});

export interface ImageReference {
  originalText: string;
  altText: string;
  originalPath: string;  // Markdown内の元のパス（相対パス）
  imagePath: string;     // 絶対パス（アップロード用）
  isLocal: boolean;
}

export interface ProcessedMarkdown {
  html: string;
  title: string | null;
  localImages: ImageReference[];
}

/**
 * Markdown から H1 タイトルを抽出
 */
export function extractTitle(markdown: string): string | null {
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  return h1Match ? h1Match[1].trim() : null;
}

/**
 * Markdown からローカル画像参照を抽出
 */
export function extractLocalImages(
  markdown: string,
  basePath?: string
): ImageReference[] {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: ImageReference[] = [];
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    const altText = match[1];
    const imagePath = match[2];

    // URL（http/https）はスキップ
    const isLocal = !imagePath.startsWith("http://") && !imagePath.startsWith("https://");

    if (isLocal) {
      // 相対パスを絶対パスに変換
      const absolutePath = basePath
        ? path.resolve(basePath, imagePath)
        : path.resolve(imagePath);

      images.push({
        originalText: match[0],
        altText,
        originalPath: imagePath,  // 元の相対パスを保持
        imagePath: absolutePath,
        isLocal: true,
      });
    }
  }

  return images;
}

/**
 * Markdown 内の画像パスを新しい URL に置換
 */
export function replaceImagePaths(
  markdown: string,
  replacements: Map<string, string>
): string {
  let result = markdown;

  for (const [originalPath, newUrl] of replacements) {
    // パスをエスケープして正規表現で置換
    const escapedPath = originalPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${escapedPath}\\)`, "g");
    result = result.replace(regex, `![$1](${newUrl})`);
  }

  return result;
}

/**
 * Markdown を HTML に変換
 */
export function convertToHtml(markdown: string): string {
  // タイトル（最初の H1）を除去するオプション
  const contentWithoutTitle = markdown.replace(/^#\s+.+\n*/m, "");
  return marked.parse(contentWithoutTitle) as string;
}

/**
 * Markdown を処理（タイトル抽出、画像検出、HTML変換）
 */
export function processMarkdown(
  markdown: string,
  basePath?: string
): ProcessedMarkdown {
  const title = extractTitle(markdown);
  const localImages = extractLocalImages(markdown, basePath);
  const html = convertToHtml(markdown);

  return {
    html,
    title,
    localImages,
  };
}

/**
 * ファイルパスから Markdown を読み込んで処理
 */
export function processMarkdownFile(filePath: string): ProcessedMarkdown {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const markdown = fs.readFileSync(absolutePath, "utf-8");
  const basePath = path.dirname(absolutePath);

  return processMarkdown(markdown, basePath);
}
