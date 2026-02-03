import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const postTools: Tool[] = [
  {
    name: 'get_posts',
    description:
      'WordPress の投稿一覧を取得します。ステータス、カテゴリ、検索キーワードでフィルタリング可能です。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        page: {
          type: 'number',
          description: 'ページ番号（デフォルト: 1）',
        },
        per_page: {
          type: 'number',
          description: '1ページあたりの件数（デフォルト: 10、最大: 100）',
        },
        status: {
          type: 'string',
          enum: ['publish', 'draft', 'pending', 'private', 'any'],
          description: '投稿ステータス（デフォルト: any）',
        },
        search: {
          type: 'string',
          description: '検索キーワード',
        },
        categories: {
          type: 'array',
          items: { type: 'number' },
          description: 'カテゴリ ID の配列',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_post',
    description: '指定した ID の投稿を取得します。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        post_id: {
          type: 'number',
          description: '投稿 ID',
        },
      },
      required: ['post_id'],
    },
  },
  {
    name: 'create_post',
    description:
      '新しい投稿を作成します。Markdown 形式のコンテンツを指定すると自動的に HTML に変換されます。ローカル画像は自動的に WordPress にアップロードされます。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: '投稿タイトル',
        },
        content: {
          type: 'string',
          description: '投稿本文（Markdown または HTML）',
        },
        status: {
          type: 'string',
          enum: ['publish', 'draft', 'pending', 'private'],
          description: '投稿ステータス（デフォルト: draft）',
        },
        categories: {
          type: 'array',
          items: { type: 'number' },
          description: 'カテゴリ ID の配列',
        },
        tags: {
          type: 'array',
          items: { type: 'number' },
          description: 'タグ ID の配列',
        },
        excerpt: {
          type: 'string',
          description: '抜粋',
        },
        is_markdown: {
          type: 'boolean',
          description: 'content が Markdown かどうか（デフォルト: true）',
        },
        base_path: {
          type: 'string',
          description: 'Markdown 内の相対画像パスを解決するための基準ディレクトリ',
        },
        featured_media: {
          type: 'number',
          description: 'アイキャッチ画像のメディア ID',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'create_post_from_file',
    description:
      'Markdown ファイルから投稿を作成します。ファイル内の最初の H1 がタイトルになります。ローカル画像は自動的に WordPress にアップロードされます。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_path: {
          type: 'string',
          description: 'Markdown ファイルのパス',
        },
        status: {
          type: 'string',
          enum: ['publish', 'draft', 'pending', 'private'],
          description: '投稿ステータス（デフォルト: draft）',
        },
        categories: {
          type: 'array',
          items: { type: 'number' },
          description: 'カテゴリ ID の配列',
        },
        tags: {
          type: 'array',
          items: { type: 'number' },
          description: 'タグ ID の配列',
        },
        featured_media: {
          type: 'number',
          description: 'アイキャッチ画像のメディア ID',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'update_post',
    description: '既存の投稿を更新します。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        post_id: {
          type: 'number',
          description: '更新する投稿の ID',
        },
        title: {
          type: 'string',
          description: '新しいタイトル',
        },
        content: {
          type: 'string',
          description: '新しい本文（Markdown または HTML）',
        },
        status: {
          type: 'string',
          enum: ['publish', 'draft', 'pending', 'private'],
          description: '新しいステータス',
        },
        categories: {
          type: 'array',
          items: { type: 'number' },
          description: 'カテゴリ ID の配列',
        },
        tags: {
          type: 'array',
          items: { type: 'number' },
          description: 'タグ ID の配列',
        },
        is_markdown: {
          type: 'boolean',
          description: 'content が Markdown かどうか（デフォルト: true）',
        },
        base_path: {
          type: 'string',
          description: 'Markdown 内の相対画像パスを解決するための基準ディレクトリ',
        },
        featured_media: {
          type: 'number',
          description: 'アイキャッチ画像のメディア ID',
        },
      },
      required: ['post_id'],
    },
  },
  {
    name: 'delete_post',
    description: '投稿を削除します（ゴミ箱へ移動、または完全削除）。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        post_id: {
          type: 'number',
          description: '削除する投稿の ID',
        },
        force: {
          type: 'boolean',
          description: '完全削除するか（デフォルト: false でゴミ箱へ移動）',
        },
      },
      required: ['post_id'],
    },
  },
];
