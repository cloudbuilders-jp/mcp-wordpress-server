# WordPress MCP Server

MCP server for posting Markdown articles to WordPress with Gutenberg block conversion, image upload/compression, and AI features.

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | TypeScript build |
| `npm run dev` | Build and run |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format |
| `npm run typecheck` | Type check without emit |
| `npm run inspect` | Debug with MCP Inspector (requires env vars) |

```bash
# Inspector debugging
WORDPRESS_URL=https://... WORDPRESS_USERNAME=... WORDPRESS_APP_PASSWORD=... npm run inspect
```

## Architecture

```
src/
├── index.ts, server.ts    # Entry point, MCP server setup
├── config/                # Environment config (Zod validation)
├── handlers/              # MCP tool handlers (input validation → service calls)
├── services/              # Business logic (post creation, media upload)
├── schemas/               # Zod input validation schemas
├── tools/                 # MCP tool definitions (JSON Schema)
├── utils/                 # WordPress API client, Markdown/Gutenberg, Gemini, image compression
└── types/                 # TypeScript type definitions
```

**Layer flow**: `server.ts` → `handlers/` → `services/` → `utils/`

## Adding a New Tool

1. Add tool schema to `src/tools/posts.ts` or `src/tools/media.ts`
2. Add Zod validation schema to `src/schemas/`
3. Add handler function to `src/handlers/`
4. Register handler in `src/handlers/index.ts`

## Key Behaviors

- **Markdown → Gutenberg**: `gutenberg-renderer.ts` converts Markdown to `wp:*` block comments
- **Code blocks**: Uses `wp:loos-hcb/code-block` (requires Highlighting Code Block plugin)
- **Local images**: Auto-uploaded via `ImageUploadPipeline`, compressed if >1MB
- **SEO excerpt**: Auto-generated via Gemini if `GEMINI_API_KEY` set and no manual excerpt
- **Custom post types**: Set `WP_POST_TYPE` env var to change from default "posts"

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `WORDPRESS_URL` | Yes | WordPress site URL |
| `WORDPRESS_USERNAME` | Yes | WordPress username |
| `WORDPRESS_APP_PASSWORD` | Yes | Application password (WP 5.6+, HTTPS required) |
| `WP_POST_TYPE` | No | Custom post type slug (default: "posts") |
| `GEMINI_API_KEY` | No | For AI image generation and auto excerpt |
| `IMAGE_COMPRESSION_ENABLED` | No | Enable compression (default: true) |
| `IMAGE_SIZE_THRESHOLD` | No | Compression threshold in bytes (default: 1MB) |
| `IMAGE_COMPRESSION_QUALITY` | No | Quality 1-100 (default: 80) |
| `IMAGE_MAX_WIDTH` / `IMAGE_MAX_HEIGHT` | No | Max dimensions (default: 1920x1080) |

## Gotchas

- **Highlighting Code Block plugin required**: Code blocks won't render correctly without it on WordPress
- **HTTPS required**: WordPress Application Passwords only work over HTTPS
- **GIF/SVG not compressed**: Animation and vector formats are skipped
- **PNG transparency preserved**: PNGs with alpha channel skip compression
- **Gemini failures are silent**: Post creation continues even if AI excerpt generation fails
