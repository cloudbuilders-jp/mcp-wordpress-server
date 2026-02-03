import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ZodError } from "zod";

import { WordPressAPI, WordPressAPIError } from "./utils/wordpress-api.js";
import { GeminiAPIError } from "./utils/gemini-image.js";
import { postTools } from "./tools/posts.js";
import {
  mediaTools,
  categoryTools,
  tagTools,
  taxonomyTools,
} from "./tools/media.js";
import { loadConfig } from "./config/environment.js";
import { getHandler } from "./handlers/index.js";
import type { HandlerContext } from "./types/handler.js";

/**
 * MCPサーバーを作成して起動する
 */
export async function createServer() {
  // 設定の読み込み
  const config = loadConfig();

  // WordPress API クライアント
  const wpAPI = new WordPressAPI(
    config.WORDPRESS_URL,
    config.WORDPRESS_USERNAME,
    config.WORDPRESS_APP_PASSWORD,
    config.WP_POST_TYPE
  );

  // ハンドラーコンテキスト
  const ctx: HandlerContext = {
    wpAPI,
    config,
  };

  // MCP Server
  const server = new Server(
    {
      name: "wordpress-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // すべての Tools を結合
  const allTools = [
    ...postTools,
    ...mediaTools,
    ...categoryTools,
    ...tagTools,
    ...taxonomyTools,
  ];

  // Tool リスト
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  // Tool 呼び出し
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const handler = getHandler(name);
      const result = await handler(args, ctx);

      return {
        content: [
          {
            type: "text",
            text:
              typeof result === "string"
                ? result
                : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return formatErrorResponse(error);
    }
  });

  return server;
}

/**
 * エラーレスポンスをフォーマットする
 */
function formatErrorResponse(error: unknown) {
  let errorMessage: string;

  if (error instanceof ZodError) {
    // バリデーションエラー
    errorMessage = `Validation Error: ${error.message}`;
  } else if (error instanceof WordPressAPIError) {
    errorMessage = `WordPress API Error: ${error.message}`;
  } else if (error instanceof GeminiAPIError) {
    errorMessage = `Gemini API Error: ${error.message} (${error.code || "UNKNOWN"})`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = "Unknown error occurred";
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: errorMessage }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * サーバーを起動する
 */
export async function startServer() {
  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WordPress MCP Server started");
}
