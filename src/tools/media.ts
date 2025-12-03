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
];
