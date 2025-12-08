# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WordPress MCP Server - An MCP (Model Context Protocol) server that enables posting articles to WordPress directly from Cursor/Claude. Converts Markdown to Gutenberg blocks with automatic image upload support.

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

### Entry Point
- `src/index.ts` - MCP server setup and tool call handler (switch statement routing)

### Tool Definitions
- `src/tools/posts.ts` - Post-related MCP tool schemas (get_posts, create_post, etc.)
- `src/tools/media.ts` - Media, category, and tag tool schemas

### Core Utilities
- `src/utils/wordpress-api.ts` - WordPress REST API client using axios with Basic Auth
- `src/utils/markdown.ts` - Markdown processing: title extraction, local image detection, path replacement
- `src/utils/gutenberg-renderer.ts` - Custom marked.js renderer converting Markdown to Gutenberg blocks
- `src/utils/language-map.ts` - Language identifier mapping for Highlighting Code Block plugin

### Types
- `src/types/wordpress.ts` - TypeScript interfaces for WordPress REST API (WPPost, WPMedia, etc.)

## Key Implementation Details

### Markdown to Gutenberg Conversion
The custom renderer in `gutenberg-renderer.ts` wraps each element with Gutenberg block comments:
- Code blocks use `wp:loos-hcb/code-block` format (requires Highlighting Code Block plugin on WordPress)
- Paragraphs, headings, lists, quotes, images, tables all have corresponding `wp:*` block wrappers

### Image Handling
Local images in Markdown (`![alt](./path/to/image.png)`) are:
1. Detected via regex in `extractLocalImages()`
2. Uploaded to WordPress media library via `wpAPI.uploadMedia()`
3. Replaced with WordPress URLs in content before posting

### Custom Post Type Support
Set `WP_POST_TYPE` env var to use custom post types instead of default "posts". This changes the API endpoint from `/wp-json/wp/v2/posts` to `/wp-json/wp/v2/{post_type}`.

## Environment Variables

Required:
- `WORDPRESS_URL` - WordPress site URL
- `WORDPRESS_USERNAME` - WordPress username
- `WORDPRESS_APP_PASSWORD` - Application password (WordPress 5.6+, requires HTTPS)

Optional:
- `WP_POST_TYPE` - Custom post type slug (default: "posts")

## Branch Strategy

This project uses **GitHub Flow**:
1. `main` branch is always deployable
2. Create feature branches from `main` (e.g., `feature/add-new-tool`, `fix/image-upload-bug`)
3. Open a Pull Request to `main` when ready for review
4. After review and approval, merge to `main`
