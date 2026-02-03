# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WordPress MCP Server - An MCP (Model Context Protocol) server that enables posting articles to WordPress directly from Cursor/Claude. Converts Markdown to Gutenberg blocks with automatic image upload and compression support.

## Commands

```bash
npm run build      # TypeScript build (tsc)
npm run start      # Run the server (node dist/index.js)
npm run dev        # Build and run
npm run inspect    # Debug with MCP Inspector (requires env vars)
```

For debugging with inspector:

```bash
WORDPRESS_URL=https://... WORDPRESS_USERNAME=... WORDPRESS_APP_PASSWORD=... WP_POST_TYPE=articles npm run inspect
```

## Architecture

### Directory Structure

```
src/
├── index.ts              # Entry point (minimal - just starts server)
├── server.ts             # MCP server setup and routing
├── config/
│   └── environment.ts    # Environment variable management with Zod validation
├── handlers/             # MCP tool handlers (business logic)
│   ├── index.ts          # Handler routing map
│   ├── post-handler.ts   # Post-related handlers
│   ├── media-handler.ts  # Media-related handlers
│   └── taxonomy-handler.ts # Taxonomy-related handlers
├── services/             # Business logic layer
│   ├── post-service.ts   # Post creation/update logic
│   ├── media-service.ts  # Media upload logic
│   └── image-upload-pipeline.ts # Shared image upload pipeline
├── schemas/              # Zod validation schemas
│   ├── post-schemas.ts   # Post tool input schemas
│   ├── media-schemas.ts  # Media tool input schemas
│   └── taxonomy-schemas.ts # Taxonomy tool input schemas
├── tools/                # MCP tool definitions (JSON Schema)
│   ├── posts.ts          # Post tool schemas
│   └── media.ts          # Media/taxonomy tool schemas
├── utils/                # Low-level utilities
│   ├── wordpress-api.ts  # WordPress REST API client
│   ├── markdown.ts       # Markdown processing
│   ├── gutenberg-renderer.ts # Gutenberg block conversion
│   ├── gemini-image.ts   # Gemini image generation
│   ├── gemini-excerpt.ts # Gemini excerpt generation
│   ├── image-compression.ts # Image compression
│   └── language-map.ts   # Code language mapping
└── types/                # TypeScript type definitions
    ├── wordpress.ts      # WordPress API types
    ├── gemini.ts         # Gemini API types
    ├── image-compression.ts # Compression types
    └── handler.ts        # Handler context types
```

### Layer Responsibilities

1. **Entry Point** (`index.ts`, `server.ts`)
   - MCP server initialization
   - Tool routing via handler map (no switch statement)
   - Error response formatting

2. **Handlers** (`handlers/`)
   - Input validation with Zod schemas
   - Delegate to services for business logic
   - Format response for MCP

3. **Services** (`services/`)
   - Core business logic
   - Orchestrate multiple operations (Markdown processing, image upload, etc.)
   - Reusable across handlers

4. **Schemas** (`schemas/`)
   - Zod schemas for type-safe input validation
   - Eliminates unsafe type casts (`args as number`)

5. **Utils** (`utils/`)
   - Low-level utilities
   - External API clients (WordPress, Gemini)
   - Pure functions

### Tool Definitions

- `src/tools/posts.ts` - Post-related MCP tool schemas (get_posts, create_post, etc.)
- `src/tools/media.ts` - Media, category, tag, taxonomy, and image generation tool schemas

### Core Utilities

- `src/utils/wordpress-api.ts` - WordPress REST API client using axios with Basic Auth
- `src/utils/markdown.ts` - Markdown processing: title extraction, local image detection, path replacement
- `src/utils/gutenberg-renderer.ts` - Custom marked.js renderer converting Markdown to Gutenberg blocks
- `src/utils/language-map.ts` - Language identifier mapping for Highlighting Code Block plugin
- `src/utils/gemini-image.ts` - Gemini API client for AI image generation (featured images)
- `src/utils/gemini-excerpt.ts` - Gemini API client for AI excerpt/meta description generation
- `src/utils/image-compression.ts` - Image compression using sharp (size threshold, quality, resize)

## Key Implementation Details

### Available MCP Tools

**Post Management:**

- `get_posts` - List posts with filtering (status, category, search)
- `get_post` - Get single post by ID
- `create_post` - Create post from Markdown/HTML content
- `create_post_from_file` - Create post from Markdown file
- `update_post` - Update existing post
- `delete_post` - Delete post (trash or permanent)

**Media Management:**

- `upload_media` - Upload file to WordPress media library (with auto-compression)
- `get_media` - Get media info by ID
- `delete_media` - Delete media item
- `generate_featured_image` - Generate AI image using Gemini API and upload

**Taxonomy Management:**

- `get_categories` / `create_category` - Manage categories
- `get_tags` / `create_tag` - Manage tags
- `get_taxonomies` - List available taxonomies (including custom)
- `get_taxonomy_terms` / `create_taxonomy_term` - Manage taxonomy terms
- `set_post_terms` - Assign taxonomy terms to a post

### Adding a New Tool

1. Add tool schema to `src/tools/posts.ts` or `src/tools/media.ts`
2. Add Zod validation schema to `src/schemas/`
3. Add handler function to `src/handlers/`
4. Register handler in `src/handlers/index.ts`

### Markdown to Gutenberg Conversion

The custom renderer in `gutenberg-renderer.ts` wraps each element with Gutenberg block comments:

- Code blocks use `wp:loos-hcb/code-block` format (requires Highlighting Code Block plugin on WordPress)
- Paragraphs, headings, lists, quotes, images, tables all have corresponding `wp:*` block wrappers
- GFM (GitHub Flavored Markdown) enabled: tables, strikethrough, autolinks

### Image Handling

Local images in Markdown (`![alt](./path/to/image.png)`) are processed by `ImageUploadPipeline`:

1. Detected via regex in `extractLocalImages()` (markdown.ts)
2. Uploaded to WordPress media library via `ImageUploadPipeline.uploadAndReplace()`
3. Automatically compressed if over size threshold
4. Replaced with WordPress URLs in content before posting

### Image Compression

Automatic image compression using `sharp` library:

- **Trigger**: Files over 1MB (configurable via `IMAGE_SIZE_THRESHOLD`)
- **Compression**: Quality reduction (default 80%) then resize if still over threshold
- **Max dimensions**: 1920x1080 (configurable)
- **Skipped formats**: GIF (animation), SVG (vector), PNG with transparency (alpha preservation)
- **Supported formats**: JPEG, PNG (without alpha), WebP

### SEO Excerpt Auto-Generation

Automatic SEO-optimized excerpt (meta description) generation using Gemini AI:

- **Trigger**: When `excerpt` is not provided in `create_post` or `create_post_from_file` and `GEMINI_API_KEY` is set
- **Output**: 160-character SEO-optimized summary of the article
- **Behavior**:
  - Manual excerpt takes precedence (never overwritten)
  - Graceful failure: post creation continues even if excerpt generation fails
  - Works with both `create_post` and `create_post_from_file`

### Custom Post Type Support

Set `WP_POST_TYPE` env var to use custom post types instead of default "posts". This changes the API endpoint from `/wp-json/wp/v2/posts` to `/wp-json/wp/v2/{post_type}`.

## Environment Variables

**Required:**

- `WORDPRESS_URL` - WordPress site URL
- `WORDPRESS_USERNAME` - WordPress username
- `WORDPRESS_APP_PASSWORD` - Application password (WordPress 5.6+, requires HTTPS)

**Optional:**

- `WP_POST_TYPE` - Custom post type slug (default: "posts")
- `GEMINI_API_KEY` or `GOOGLE_API_KEY` - Gemini API key (required for `generate_featured_image` tool and auto excerpt generation)

**Image Compression (all optional):**

- `IMAGE_COMPRESSION_ENABLED` - Enable/disable compression (default: true, set to "false" to disable)
- `IMAGE_SIZE_THRESHOLD` - File size threshold in bytes (default: 1048576 = 1MB)
- `IMAGE_COMPRESSION_QUALITY` - JPEG/PNG/WebP quality 1-100 (default: 80)
- `IMAGE_MAX_WIDTH` - Max width in pixels after resize (default: 1920)
- `IMAGE_MAX_HEIGHT` - Max height in pixels after resize (default: 1080)

## Dependencies

**Runtime:**

- `@modelcontextprotocol/sdk` - MCP SDK for server implementation
- `axios` - HTTP client for WordPress REST API
- `form-data` - Multipart form data for file uploads
- `marked` - Markdown parser (v15)
- `sharp` - Image processing and compression
- `@google/genai` - Gemini API client for AI image generation
- `zod` - Schema validation and type inference

**Dev:**

- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions

## Branch Strategy

This project uses **GitHub Flow**:

1. `main` branch is always deployable
2. Create feature branches from `main` (e.g., `feature/add-new-tool`, `fix/image-upload-bug`)
3. Open a Pull Request to `main` when ready for review
4. After review and approval, merge to `main`
