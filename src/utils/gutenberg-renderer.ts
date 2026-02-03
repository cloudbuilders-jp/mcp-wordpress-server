/**
 * Markdown → WordPress Gutenberg ブロック変換
 * コードブロックには Highlighting Code Block プラグインを使用
 */

import { marked, Renderer, Tokens } from 'marked';
import { getLanguageMapping } from './language-map.js';

/**
 * HTML特殊文字をエスケープ
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 画像ブロックを生成するヘルパー関数
 * ブロックレベルの画像（単独行の画像）用
 */
function renderImageBlock(token: Tokens.Image): string {
  const altAttr = token.text ? ` alt="${escapeHtml(token.text)}"` : '';
  const titleAttr = token.title ? ` title="${escapeHtml(token.title)}"` : '';

  return (
    `<!-- wp:image -->\n` +
    `<figure class="wp-block-image"><img src="${token.href}"${altAttr}${titleAttr}/></figure>\n` +
    `<!-- /wp:image -->\n\n`
  );
}

/**
 * ネストされたリストをレンダリング（Gutenbergブロックコメントなし）
 * トップレベルでないリストに使用
 */
function renderNestedList(token: Tokens.List, parser: any): string {
  const tag = token.ordered ? 'ol' : 'ul';

  let body = '';
  for (const item of token.items) {
    body += renderNestedListItem(item, parser);
  }

  return `<${tag}>${body}</${tag}>`;
}

/**
 * ネストされたリストアイテムをレンダリング
 */
function renderNestedListItem(item: Tokens.ListItem, parser: any): string {
  let content = '';

  for (const token of item.tokens) {
    if (token.type === 'text') {
      const textToken = token as Tokens.Text;
      if (textToken.tokens) {
        content += parser.parseInline(textToken.tokens);
      } else {
        content += textToken.text;
      }
    } else if (token.type === 'list') {
      // 再帰的にネストリストを処理
      content += renderNestedList(token as Tokens.List, parser);
    } else {
      content += parser.parse([token]);
    }
  }

  return `<li>${content.trim()}</li>`;
}

/**
 * Gutenberg ブロック用カスタムレンダラー
 */
const gutenbergRenderer: Partial<Renderer> = {
  // コードブロック → Highlighting Code Block
  code(this: Renderer, token: Tokens.Code): string {
    const escapedCode = escapeHtml(token.text);
    const langMapping = getLanguageMapping(token.lang);

    if (langMapping) {
      const attrs = JSON.stringify({
        langType: langMapping.langType,
        langName: langMapping.langName,
      });
      return (
        `<!-- wp:loos-hcb/code-block ${attrs} -->\n` +
        `<div class="hcb_wrap"><pre class="prism undefined-numbers lang-${langMapping.langType}" ` +
        `data-lang="${langMapping.langName}"><code>${escapedCode}</code></pre></div>\n` +
        `<!-- /wp:loos-hcb/code-block -->\n\n`
      );
    }

    // 言語指定なし
    return (
      `<!-- wp:loos-hcb/code-block -->\n` +
      `<div class="hcb_wrap"><pre class="prism undefined-numbers lang-plain"><code>${escapedCode}</code></pre></div>\n` +
      `<!-- /wp:loos-hcb/code-block -->\n\n`
    );
  },

  // 段落
  paragraph(this: Renderer, token: Tokens.Paragraph): string {
    // 段落が画像のみを含む場合、画像ブロックを直接出力
    // marked.js は単独行の画像も段落としてパースするため、この処理が必要
    if (token.tokens.length === 1 && token.tokens[0].type === 'image') {
      return renderImageBlock(token.tokens[0] as Tokens.Image);
    }

    const content = this.parser.parseInline(token.tokens);
    // 空の段落はスキップ
    if (!content.trim()) return '';
    return `<!-- wp:paragraph -->\n<p>${content}</p>\n<!-- /wp:paragraph -->\n\n`;
  },

  // 見出し
  heading(this: Renderer, token: Tokens.Heading): string {
    const content = this.parser.parseInline(token.tokens);
    const tag = `h${token.depth}`;
    return (
      `<!-- wp:heading {"level":${token.depth}} -->\n` +
      `<${tag} class="wp-block-heading">${content}</${tag}>\n` +
      `<!-- /wp:heading -->\n\n`
    );
  },

  // リスト
  list(this: Renderer, token: Tokens.List): string {
    const tag = token.ordered ? 'ol' : 'ul';
    const attrs = token.ordered ? ` {"ordered":true}` : '';

    let body = '';
    for (const item of token.items) {
      body += this.listitem(item);
    }

    return `<!-- wp:list${attrs} -->\n<${tag}>${body}</${tag}>\n<!-- /wp:list -->\n\n`;
  },

  // リストアイテム
  listitem(this: Renderer, item: Tokens.ListItem): string {
    let content = '';

    for (const token of item.tokens) {
      if (token.type === 'text') {
        // テキストトークンの場合、インライン要素として処理
        const textToken = token as Tokens.Text;
        if (textToken.tokens) {
          content += this.parser.parseInline(textToken.tokens);
        } else {
          content += textToken.text;
        }
      } else if (token.type === 'list') {
        // ネストされたリストの場合（Gutenbergブロックコメントなしで処理）
        content += renderNestedList(token as Tokens.List, this.parser);
      } else {
        // その他のトークン
        content += this.parser.parse([token]);
      }
    }

    return `<li>${content.trim()}</li>`;
  },

  // 引用
  blockquote(this: Renderer, token: Tokens.Blockquote): string {
    // 内部コンテンツを処理
    let innerContent = '';
    for (const t of token.tokens) {
      if (t.type === 'paragraph') {
        const paragraphToken = t as Tokens.Paragraph;
        innerContent += `<p>${this.parser.parseInline(paragraphToken.tokens)}</p>`;
      } else {
        innerContent += this.parser.parse([t]);
      }
    }

    return (
      `<!-- wp:quote -->\n` +
      `<blockquote class="wp-block-quote">${innerContent}</blockquote>\n` +
      `<!-- /wp:quote -->\n\n`
    );
  },

  // 画像（インライン用）
  // 注: ブロックレベルの画像は paragraph() 内で renderImageBlock() を使用して処理される
  // この関数はテキスト中に埋め込まれた画像（インライン画像）用
  image(this: Renderer, token: Tokens.Image): string {
    const altAttr = token.text ? ` alt="${escapeHtml(token.text)}"` : '';
    const titleAttr = token.title ? ` title="${escapeHtml(token.title)}"` : '';
    return `<img src="${token.href}"${altAttr}${titleAttr}/>`;
  },

  // 区切り線
  hr(): string {
    return `<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->\n\n`;
  },

  // テーブル
  table(this: Renderer, token: Tokens.Table): string {
    let header = '<thead><tr>';
    for (const cell of token.header) {
      const align = cell.align ? ` style="text-align:${cell.align}"` : '';
      header += `<th${align}>${this.parser.parseInline(cell.tokens)}</th>`;
    }
    header += '</tr></thead>';

    let body = '<tbody>';
    for (const row of token.rows) {
      body += '<tr>';
      for (const cell of row) {
        const align = cell.align ? ` style="text-align:${cell.align}"` : '';
        body += `<td${align}>${this.parser.parseInline(cell.tokens)}</td>`;
      }
      body += '</tr>';
    }
    body += '</tbody>';

    return (
      `<!-- wp:table -->\n` +
      `<figure class="wp-block-table"><table>${header}${body}</table></figure>\n` +
      `<!-- /wp:table -->\n\n`
    );
  },

  // インラインコード
  codespan(token: Tokens.Codespan): string {
    return `<code>${escapeHtml(token.text)}</code>`;
  },

  // 太字
  strong(this: Renderer, token: Tokens.Strong): string {
    return `<strong>${this.parser.parseInline(token.tokens)}</strong>`;
  },

  // 斜体
  em(this: Renderer, token: Tokens.Em): string {
    return `<em>${this.parser.parseInline(token.tokens)}</em>`;
  },

  // リンク
  link(this: Renderer, token: Tokens.Link): string {
    const text = this.parser.parseInline(token.tokens);
    const titleAttr = token.title ? ` title="${escapeHtml(token.title)}"` : '';
    return `<a href="${token.href}"${titleAttr}>${text}</a>`;
  },

  // 取り消し線
  del(this: Renderer, token: Tokens.Del): string {
    return `<del>${this.parser.parseInline(token.tokens)}</del>`;
  },

  // 改行
  br(): string {
    return '<br />';
  },

  // 生HTML
  html(token: Tokens.HTML): string {
    // HTMLブロックとしてラップ
    const trimmed = token.text.trim();
    if (!trimmed) return '';
    return `<!-- wp:html -->\n${trimmed}\n<!-- /wp:html -->\n\n`;
  },
};

/**
 * Markdown を WordPress Gutenberg ブロック形式に変換
 * タイトル（最初のH1）は除去される
 */
export function convertToGutenbergBlocks(markdown: string): string {
  // タイトル（最初の H1）を除去
  const contentWithoutTitle = markdown.replace(/^#\s+.+\n*/m, '');

  // カスタムレンダラーを使用
  const renderer = new Renderer();
  Object.assign(renderer, gutenbergRenderer);

  marked.use({
    gfm: true,
    breaks: true,
    renderer,
  });

  const result = marked.parse(contentWithoutTitle) as string;

  // 末尾の余分な空行を整理
  return result.trim() + '\n';
}
