import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mediaTools: Tool[] = [
  {
    name: "upload_media",
    description:
      "ローカルファイルを WordPress のメディアライブラリにアップロードします。",
    inputSchema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "アップロードするファイルのパス",
        },
        title: {
          type: "string",
          description: "メディアのタイトル",
        },
        alt_text: {
          type: "string",
          description: "代替テキスト（画像のアクセシビリティ用）",
        },
        caption: {
          type: "string",
          description: "キャプション",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "get_media",
    description: "指定した ID のメディア情報を取得します。",
    inputSchema: {
      type: "object" as const,
      properties: {
        media_id: {
          type: "number",
          description: "メディア ID",
        },
      },
      required: ["media_id"],
    },
  },
  {
    name: "delete_media",
    description:
      "指定した ID のメディアを削除します。",
    inputSchema: {
      type: "object" as const,
      properties: {
        media_id: {
          type: "number",
          description: "削除するメディアの ID",
        },
        force: {
          type: "boolean",
          description: "完全に削除するか（デフォルト: true）",
        },
      },
      required: ["media_id"],
    },
  },
];

export const categoryTools: Tool[] = [
  {
    name: "get_categories",
    description: "WordPress のカテゴリ一覧を取得します。",
    inputSchema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "検索キーワード",
        },
        per_page: {
          type: "number",
          description: "取得件数（デフォルト: 100）",
        },
      },
      required: [],
    },
  },
  {
    name: "create_category",
    description: "新しいカテゴリを作成します。",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "カテゴリ名（必須）",
        },
        slug: {
          type: "string",
          description: "スラッグ（URLに使用される識別子）",
        },
        description: {
          type: "string",
          description: "カテゴリの説明",
        },
        parent: {
          type: "number",
          description: "親カテゴリの ID（階層構造にする場合）",
        },
      },
      required: ["name"],
    },
  },
];

export const tagTools: Tool[] = [
  {
    name: "get_tags",
    description: "WordPress のタグ一覧を取得します。",
    inputSchema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "検索キーワード",
        },
        per_page: {
          type: "number",
          description: "取得件数（デフォルト: 100）",
        },
      },
      required: [],
    },
  },
  {
    name: "create_tag",
    description: "新しいタグを作成します。",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "タグ名（必須）",
        },
        slug: {
          type: "string",
          description: "スラッグ（URLに使用される識別子）",
        },
        description: {
          type: "string",
          description: "タグの説明",
        },
      },
      required: ["name"],
    },
  },
];

export const taxonomyTools: Tool[] = [
  {
    name: "get_taxonomies",
    description:
      "WordPress で利用可能なタクソノミー（分類）一覧を取得します。カスタム投稿タイプのカテゴリやタグを確認する際に使用します。",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_taxonomy_terms",
    description:
      "指定したタクソノミーのターム（項目）一覧を取得します。カスタムタクソノミーの項目を確認する際に使用します。",
    inputSchema: {
      type: "object" as const,
      properties: {
        taxonomy: {
          type: "string",
          description:
            "タクソノミーの REST ベース（get_taxonomies で取得した rest_base の値）",
        },
        search: {
          type: "string",
          description: "検索キーワード",
        },
        per_page: {
          type: "number",
          description: "取得件数（デフォルト: 100）",
        },
        parent: {
          type: "number",
          description: "親タームの ID（階層構造のタクソノミーで子タームを取得する場合）",
        },
        hide_empty: {
          type: "boolean",
          description: "投稿がないタームを非表示にするか（デフォルト: false）",
        },
      },
      required: ["taxonomy"],
    },
  },
  {
    name: "create_taxonomy_term",
    description:
      "指定したタクソノミーに新しいターム（項目）を作成します。カスタムタクソノミーに新しいカテゴリやタグを追加する際に使用します。",
    inputSchema: {
      type: "object" as const,
      properties: {
        taxonomy: {
          type: "string",
          description:
            "タクソノミーの REST ベース（get_taxonomies で取得した rest_base の値）",
        },
        name: {
          type: "string",
          description: "ターム名（必須）",
        },
        slug: {
          type: "string",
          description: "スラッグ（URLに使用される識別子）",
        },
        description: {
          type: "string",
          description: "タームの説明",
        },
        parent: {
          type: "number",
          description: "親タームの ID（階層構造のタクソノミーで子タームを作成する場合）",
        },
      },
      required: ["taxonomy", "name"],
    },
  },
  {
    name: "set_post_terms",
    description:
      "投稿にカスタムタクソノミーのタームを設定します。カスタム投稿タイプのカテゴリやタグを設定する際に使用します。",
    inputSchema: {
      type: "object" as const,
      properties: {
        post_id: {
          type: "number",
          description: "投稿 ID",
        },
        taxonomy: {
          type: "string",
          description:
            "タクソノミーの REST ベース（get_taxonomies で取得した rest_base の値）",
        },
        term_ids: {
          type: "array",
          items: { type: "number" },
          description: "設定するターム ID の配列",
        },
      },
      required: ["post_id", "taxonomy", "term_ids"],
    },
  },
];
