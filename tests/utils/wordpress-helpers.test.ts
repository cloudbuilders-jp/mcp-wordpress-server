import { describe, it, expect } from 'vitest';
import { getDisplayText } from '../../src/utils/wordpress-helpers.js';

describe('getDisplayText', () => {
  it('renderedが存在する場合はrenderedを返す', () => {
    const field = { rendered: 'Rendered Text', raw: 'Raw Text' };
    expect(getDisplayText(field)).toBe('Rendered Text');
  });

  it('renderedが空でrawが存在する場合はrawを返す', () => {
    const field = { rendered: '', raw: 'Raw Text' };
    expect(getDisplayText(field)).toBe('Raw Text');
  });

  it('rawが未定義でrenderedが存在する場合はrenderedを返す', () => {
    const field = { rendered: 'Rendered Text' };
    expect(getDisplayText(field)).toBe('Rendered Text');
  });

  it('両方が空の場合は空文字を返す', () => {
    const field = { rendered: '', raw: '' };
    expect(getDisplayText(field)).toBe('');
  });

  it('renderedが空でrawが未定義の場合は空文字を返す', () => {
    const field = { rendered: '' };
    expect(getDisplayText(field)).toBe('');
  });

  it('HTMLを含むrenderedを正しく返す', () => {
    const field = { rendered: '<strong>Bold</strong> text' };
    expect(getDisplayText(field)).toBe('<strong>Bold</strong> text');
  });

  it('特殊文字を含むテキストを正しく返す', () => {
    const field = { rendered: 'Text with "quotes" & <brackets>' };
    expect(getDisplayText(field)).toBe('Text with "quotes" & <brackets>');
  });

  it('日本語テキストを正しく返す', () => {
    const field = { rendered: 'こんにちは世界' };
    expect(getDisplayText(field)).toBe('こんにちは世界');
  });

  it('絵文字を含むテキストを正しく返す', () => {
    const field = { rendered: 'Hello 👋 World 🌍' };
    expect(getDisplayText(field)).toBe('Hello 👋 World 🌍');
  });
});
