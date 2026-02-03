import { describe, it, expect } from 'vitest';
import { extractTitle, extractLocalImages, replaceImagePaths } from '../../src/utils/markdown.js';

describe('extractTitle', () => {
  it('H1タイトルを抽出する', () => {
    const markdown = '# Hello World\n\nSome content';
    expect(extractTitle(markdown)).toBe('Hello World');
  });

  it('H1がない場合はnullを返す', () => {
    const markdown = '## Subtitle\n\nSome content';
    expect(extractTitle(markdown)).toBeNull();
  });

  it('複数のH1がある場合は最初のものを返す', () => {
    const markdown = '# First Title\n\n# Second Title';
    expect(extractTitle(markdown)).toBe('First Title');
  });

  it('空文字列の場合はnullを返す', () => {
    expect(extractTitle('')).toBeNull();
  });

  it('H1の前後の空白を除去する', () => {
    const markdown = '#   Spaced Title   \n\nContent';
    expect(extractTitle(markdown)).toBe('Spaced Title');
  });

  it('H1記号の後にスペースがない場合はマッチしない', () => {
    const markdown = '#NoSpace\n\nContent';
    expect(extractTitle(markdown)).toBeNull();
  });

  it('行の途中にあるH1はマッチしない', () => {
    const markdown = 'Some text # Not a title\n\nContent';
    expect(extractTitle(markdown)).toBeNull();
  });
});

describe('extractLocalImages', () => {
  it('ローカル画像を抽出する', () => {
    const markdown = '![alt text](./images/photo.png)';
    const images = extractLocalImages(markdown);

    expect(images).toHaveLength(1);
    expect(images[0].altText).toBe('alt text');
    expect(images[0].originalPath).toBe('./images/photo.png');
    expect(images[0].isLocal).toBe(true);
  });

  it('複数の画像を抽出する', () => {
    const markdown = `
![image1](./img1.png)
Some text
![image2](./img2.jpg)
    `;
    const images = extractLocalImages(markdown);

    expect(images).toHaveLength(2);
    expect(images[0].originalPath).toBe('./img1.png');
    expect(images[1].originalPath).toBe('./img2.jpg');
  });

  it('HTTPSのURLはスキップする', () => {
    const markdown = '![remote](https://example.com/image.png)';
    const images = extractLocalImages(markdown);

    expect(images).toHaveLength(0);
  });

  it('HTTPのURLはスキップする', () => {
    const markdown = '![remote](http://example.com/image.png)';
    const images = extractLocalImages(markdown);

    expect(images).toHaveLength(0);
  });

  it('ローカルとリモートの画像が混在している場合、ローカルのみ抽出する', () => {
    const markdown = `
![local](./local.png)
![remote](https://example.com/remote.png)
![local2](../other/image.jpg)
    `;
    const images = extractLocalImages(markdown);

    expect(images).toHaveLength(2);
    expect(images[0].originalPath).toBe('./local.png');
    expect(images[1].originalPath).toBe('../other/image.jpg');
  });

  it('altTextが空の場合も正しく処理する', () => {
    const markdown = '![](./image.png)';
    const images = extractLocalImages(markdown);

    expect(images).toHaveLength(1);
    expect(images[0].altText).toBe('');
  });

  it('画像がない場合は空配列を返す', () => {
    const markdown = 'Just some text without images';
    const images = extractLocalImages(markdown);

    expect(images).toHaveLength(0);
  });

  it('絶対パスの画像も抽出する', () => {
    const markdown = '![abs](/absolute/path/image.png)';
    const images = extractLocalImages(markdown);

    expect(images).toHaveLength(1);
    expect(images[0].originalPath).toBe('/absolute/path/image.png');
  });

  it('originalTextに元のMarkdown記法を含む', () => {
    const markdown = '![my alt](./path/to/image.png)';
    const images = extractLocalImages(markdown);

    expect(images[0].originalText).toBe('![my alt](./path/to/image.png)');
  });
});

describe('replaceImagePaths', () => {
  it('単一のパスを置換する', () => {
    const markdown = '![alt](./local.png)';
    const replacements = new Map([['./local.png', 'https://wp.com/uploaded.png']]);

    const result = replaceImagePaths(markdown, replacements);
    expect(result).toBe('![alt](https://wp.com/uploaded.png)');
  });

  it('複数のパスを置換する', () => {
    const markdown = `
![img1](./a.png)
![img2](./b.jpg)
    `;
    const replacements = new Map([
      ['./a.png', 'https://wp.com/a.png'],
      ['./b.jpg', 'https://wp.com/b.jpg'],
    ]);

    const result = replaceImagePaths(markdown, replacements);
    expect(result).toContain('![img1](https://wp.com/a.png)');
    expect(result).toContain('![img2](https://wp.com/b.jpg)');
  });

  it('altTextを保持する', () => {
    const markdown = '![My Alt Text](./image.png)';
    const replacements = new Map([['./image.png', 'https://wp.com/image.png']]);

    const result = replaceImagePaths(markdown, replacements);
    expect(result).toBe('![My Alt Text](https://wp.com/image.png)');
  });

  it('置換対象がない場合は元のMarkdownを返す', () => {
    const markdown = '![alt](./not-replaced.png)';
    const replacements = new Map([['./other.png', 'https://wp.com/other.png']]);

    const result = replaceImagePaths(markdown, replacements);
    expect(result).toBe(markdown);
  });

  it('空のreplacementsの場合は元のMarkdownを返す', () => {
    const markdown = '![alt](./image.png)';
    const replacements = new Map<string, string>();

    const result = replaceImagePaths(markdown, replacements);
    expect(result).toBe(markdown);
  });

  it('特殊文字を含むパスを正しく置換する', () => {
    const markdown = '![alt](./path (1).png)';
    const replacements = new Map([['./path (1).png', 'https://wp.com/path-1.png']]);

    const result = replaceImagePaths(markdown, replacements);
    expect(result).toBe('![alt](https://wp.com/path-1.png)');
  });

  it('同じパスが複数回出現する場合、すべて置換する', () => {
    const markdown = `
![first](./same.png)
![second](./same.png)
    `;
    const replacements = new Map([['./same.png', 'https://wp.com/same.png']]);

    const result = replaceImagePaths(markdown, replacements);
    expect(result.match(/https:\/\/wp\.com\/same\.png/g)).toHaveLength(2);
  });
});
