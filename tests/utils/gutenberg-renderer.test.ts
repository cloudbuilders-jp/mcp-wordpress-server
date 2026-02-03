import { describe, it, expect } from 'vitest';
import { convertToGutenbergBlocks } from '../../src/utils/gutenberg-renderer.js';

describe('convertToGutenbergBlocks', () => {
  describe('タイトル処理', () => {
    it('最初のH1タイトルを除去する', () => {
      const markdown = '# Title\n\nContent here';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).not.toContain('Title');
      expect(result).toContain('Content here');
    });
  });

  describe('段落', () => {
    it('段落をwp:paragraphブロックに変換する', () => {
      const markdown = 'This is a paragraph.';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:paragraph -->');
      expect(result).toContain('<p>This is a paragraph.</p>');
      expect(result).toContain('<!-- /wp:paragraph -->');
    });

    it('複数の段落を個別のブロックに変換する', () => {
      const markdown = 'First paragraph.\n\nSecond paragraph.';
      const result = convertToGutenbergBlocks(markdown);

      const paragraphMatches = result.match(/<!-- wp:paragraph -->/g);
      expect(paragraphMatches).toHaveLength(2);
    });
  });

  describe('見出し', () => {
    it('H2をwp:headingブロックに変換する', () => {
      const markdown = '## Heading 2';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:heading {"level":2} -->');
      expect(result).toContain('<h2 class="wp-block-heading">Heading 2</h2>');
      expect(result).toContain('<!-- /wp:heading -->');
    });

    it('H3をwp:headingブロックに変換する', () => {
      const markdown = '### Heading 3';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:heading {"level":3} -->');
      expect(result).toContain('<h3 class="wp-block-heading">Heading 3</h3>');
    });

    it('H4-H6も正しく変換する', () => {
      const markdown = '#### H4\n\n##### H5\n\n###### H6';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('"level":4');
      expect(result).toContain('"level":5');
      expect(result).toContain('"level":6');
    });
  });

  describe('リスト', () => {
    it('順序なしリストをwp:listブロックに変換する', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:list -->');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
      expect(result).toContain('<li>Item 3</li>');
      expect(result).toContain('</ul>');
      expect(result).toContain('<!-- /wp:list -->');
    });

    it('順序付きリストをwp:listブロックに変換する', () => {
      const markdown = '1. First\n2. Second\n3. Third';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:list {"ordered":true} -->');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>First</li>');
      expect(result).toContain('</ol>');
    });

    it('ネストされたリストを正しく変換する', () => {
      const markdown = '- Parent\n  - Child 1\n  - Child 2';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Parent');
      // ネストされたリストはブロックコメントなしで出力される
      expect(result).toContain('<ul><li>Child 1</li><li>Child 2</li></ul>');
    });
  });

  describe('コードブロック', () => {
    it('言語指定ありのコードブロックをHighlighting Code Block形式に変換する', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:loos-hcb/code-block');
      expect(result).toContain('langType');
      expect(result).toContain('langName');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('<!-- /wp:loos-hcb/code-block -->');
    });

    it('言語指定なしのコードブロックを変換する', () => {
      const markdown = '```\nplain code\n```';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:loos-hcb/code-block -->');
      expect(result).toContain('lang-plain');
      expect(result).toContain('plain code');
    });

    it('TypeScriptコードブロックを正しく変換する', () => {
      const markdown = '```typescript\nconst x: number = 1;\n```';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('TypeScript');
    });

    it('コード内のHTML特殊文字をエスケープする', () => {
      const markdown = '```html\n<div class="test">&amp;</div>\n```';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('&lt;div');
      expect(result).toContain('&gt;');
      expect(result).toContain('&amp;amp;');
    });
  });

  describe('引用', () => {
    it('引用をwp:quoteブロックに変換する', () => {
      const markdown = '> This is a quote.';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:quote -->');
      expect(result).toContain('<blockquote class="wp-block-quote">');
      expect(result).toContain('This is a quote.');
      expect(result).toContain('<!-- /wp:quote -->');
    });

    it('複数行の引用を正しく変換する', () => {
      const markdown = '> Line 1\n> Line 2';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
    });
  });

  describe('画像', () => {
    it('単独行の画像をwp:imageブロックに変換する', () => {
      const markdown = '![Alt text](https://example.com/image.png)';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:image -->');
      expect(result).toContain('<figure class="wp-block-image">');
      expect(result).toContain('src="https://example.com/image.png"');
      expect(result).toContain('alt="Alt text"');
      expect(result).toContain('<!-- /wp:image -->');
    });

    it('画像のtitle属性を含める', () => {
      const markdown = '![Alt](https://example.com/img.png "Image Title")';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('title="Image Title"');
    });
  });

  describe('テーブル', () => {
    it('テーブルをwp:tableブロックに変換する', () => {
      const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
      `;
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:table -->');
      expect(result).toContain('<figure class="wp-block-table">');
      expect(result).toContain('<thead>');
      expect(result).toContain('<th>Header 1</th>');
      expect(result).toContain('<th>Header 2</th>');
      expect(result).toContain('<tbody>');
      expect(result).toContain('<td>Cell 1</td>');
      expect(result).toContain('<!-- /wp:table -->');
    });
  });

  describe('区切り線', () => {
    it('区切り線をwp:separatorブロックに変換する', () => {
      const markdown = '---';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<!-- wp:separator -->');
      expect(result).toContain('<hr class="wp-block-separator');
      expect(result).toContain('<!-- /wp:separator -->');
    });
  });

  describe('インライン要素', () => {
    it('インラインコードを<code>タグに変換する', () => {
      const markdown = 'Use `const` for constants.';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<code>const</code>');
    });

    it('太字を<strong>タグに変換する', () => {
      const markdown = 'This is **bold** text.';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<strong>bold</strong>');
    });

    it('斜体を<em>タグに変換する', () => {
      const markdown = 'This is *italic* text.';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<em>italic</em>');
    });

    it('リンクを<a>タグに変換する', () => {
      const markdown = '[Link text](https://example.com)';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<a href="https://example.com">Link text</a>');
    });

    it('取り消し線を<del>タグに変換する', () => {
      const markdown = 'This is ~~deleted~~ text.';
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('<del>deleted</del>');
    });
  });

  describe('HTMLブロック', () => {
    it('インラインHTMLをwp:htmlブロックに変換する', () => {
      const markdown = '<div class="custom">Custom HTML</div>';
      const result = convertToGutenbergBlocks(markdown);

      // インラインHTMLはwp:htmlブロックでラップされる
      expect(result).toContain('<!-- wp:html -->');
      expect(result).toContain('<!-- /wp:html -->');
    });
  });

  describe('複合ケース', () => {
    it('複数の要素を含むMarkdownを正しく変換する', () => {
      const markdown = `
## Introduction

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

\`\`\`javascript
const x = 1;
\`\`\`

> A quote
      `;
      const result = convertToGutenbergBlocks(markdown);

      expect(result).toContain('wp:heading');
      expect(result).toContain('wp:paragraph');
      expect(result).toContain('wp:list');
      expect(result).toContain('wp:loos-hcb/code-block');
      expect(result).toContain('wp:quote');
    });
  });
});
