#!/usr/bin/env node

import { startServer } from './server.js';

/**
 * WordPress MCP Server エントリーポイント
 *
 * MCP (Model Context Protocol) サーバーとして動作し、
 * WordPressへの投稿作成・編集・メディアアップロードなどの
 * 機能を提供します。
 */
startServer().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
