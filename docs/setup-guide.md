# セットアップガイド

WordPress MCP Server の詳細なセットアップ手順です。

## 目次

- [必要条件](#必要条件)
- [インストール](#インストール)
- [WordPress の設定](#wordpress-の設定)
- [クライアントの設定](#クライアントの設定)
  - [Cursor](#cursor)
  - [Claude Desktop](#claude-desktop)
- [オプション機能の設定](#オプション機能の設定)
  - [AI 機能（Gemini API）](#ai-機能gemini-api)
  - [画像圧縮](#画像圧縮)
  - [カスタム投稿タイプ](#カスタム投稿タイプ)
- [動作確認](#動作確認)
- [トラブルシューティング](#トラブルシューティング)

---

## 必要条件

### サーバー側

- **WordPress 5.6 以上**（アプリケーションパスワード機能が必要）
- **HTTPS 必須**（アプリケーションパスワードは HTTP では動作しません）
- REST API が有効（通常はデフォルトで有効）

### クライアント側

- **Node.js 18 以上**
- npm または yarn

### オプション

- [Highlighting Code Block](https://ja.wordpress.org/plugins/highlighting-code-block/) プラグイン（コードブロックのシンタックスハイライト用）
- Gemini API キー（AI 画像生成・Excerpt 自動生成用）

---

## インストール

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-org/mcp-wordpress-server.git
cd mcp-wordpress-server
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. ビルド

```bash
npm run build
```

ビルドが成功すると `dist/` ディレクトリに JavaScript ファイルが生成されます。

---

## WordPress の設定

### アプリケーションパスワードの発行

WordPress のアプリケーションパスワードは、外部アプリケーションが REST API 経由で WordPress にアクセスするための認証方式です。

1. WordPress 管理画面にログイン
2. **ユーザー** → **プロフィール** に移動
3. ページ下部の「**アプリケーションパスワード**」セクションまでスクロール
4. 「新しいアプリケーションパスワード名」に識別しやすい名前を入力
   - 例: `Cursor MCP`, `Claude Desktop`
5. 「**新しいアプリケーションパスワードを追加**」をクリック
6. 表示されたパスワードを**すぐにコピーして安全に保管**
   - ⚠️ このパスワードは一度しか表示されません
   - スペースが含まれていますが、そのまま使用できます

### アプリケーションパスワードが表示されない場合

以下を確認してください：

1. **HTTPS が有効か**: WordPress サイトが `https://` でアクセスできるか確認
2. **WordPress バージョン**: 5.6 以上であることを確認
3. **プラグイン干渉**: セキュリティプラグインがアプリケーションパスワード機能を無効化していないか確認

### REST API の確認

ブラウザで以下の URL にアクセスして、REST API が動作しているか確認します：

```
https://your-site.com/wp-json/wp/v2/posts
```

JSON レスポンスが返ってくれば REST API は正常に動作しています。

---

## クライアントの設定

### Cursor

Cursor で使用する場合の設定方法です。

#### 設定ファイルの場所

- **macOS**: `~/.cursor/mcp.json`
- **Windows**: `%USERPROFILE%\.cursor\mcp.json`
- **Linux**: `~/.cursor/mcp.json`

#### 設定例

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-wordpress-server/dist/index.js"],
      "env": {
        "WORDPRESS_URL": "https://your-site.com",
        "WORDPRESS_USERNAME": "your-username",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

> ⚠️ **重要**: `args` のパスは**絶対パス**で指定してください。

#### 設定後

1. Cursor を完全に終了
2. Cursor を再起動
3. Claude との会話で WordPress 関連のツールが使えるようになります

---

### Claude Desktop

Claude Desktop で使用する場合の設定方法です。

#### 設定ファイルの場所

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### 設定例

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-wordpress-server/dist/index.js"],
      "env": {
        "WORDPRESS_URL": "https://your-site.com",
        "WORDPRESS_USERNAME": "your-username",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

#### 設定後

1. Claude Desktop を完全に終了
2. Claude Desktop を再起動
3. 設定アイコンから MCP サーバーの接続状況を確認

---

## オプション機能の設定

### AI 機能（Gemini API）

AI アイキャッチ画像生成と SEO Excerpt 自動生成には Gemini API キーが必要です。

#### API キーの取得

1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. Google アカウントでログイン
3. 「Get API key」からキーを作成
4. 生成されたキーをコピー

#### 設定

環境変数に `GEMINI_API_KEY` を追加：

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "WORDPRESS_URL": "https://your-site.com",
        "WORDPRESS_USERNAME": "your-username",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx xxxx",
        "GEMINI_API_KEY": "AIza..."
      }
    }
  }
}
```

> `GOOGLE_API_KEY` でも動作します。

---

### 画像圧縮

画像の自動圧縮はデフォルトで有効です。設定をカスタマイズする場合：

```json
{
  "env": {
    "IMAGE_COMPRESSION_ENABLED": "true",
    "IMAGE_SIZE_THRESHOLD": "1048576",
    "IMAGE_COMPRESSION_QUALITY": "80",
    "IMAGE_MAX_WIDTH": "1920",
    "IMAGE_MAX_HEIGHT": "1080"
  }
}
```

| 変数 | 説明 | デフォルト |
|-----|------|-----------|
| `IMAGE_COMPRESSION_ENABLED` | 圧縮の有効/無効 | `true` |
| `IMAGE_SIZE_THRESHOLD` | 圧縮対象のファイルサイズ（バイト） | `1048576` (1MB) |
| `IMAGE_COMPRESSION_QUALITY` | 圧縮品質（1-100） | `80` |
| `IMAGE_MAX_WIDTH` | 最大幅（ピクセル） | `1920` |
| `IMAGE_MAX_HEIGHT` | 最大高さ（ピクセル） | `1080` |

圧縮を無効にする場合：

```json
{
  "env": {
    "IMAGE_COMPRESSION_ENABLED": "false"
  }
}
```

---

### カスタム投稿タイプ

WordPress のカスタム投稿タイプを使用する場合、`WP_POST_TYPE` を設定します。

```json
{
  "env": {
    "WP_POST_TYPE": "articles"
  }
}
```

これにより、API エンドポイントが `/wp-json/wp/v2/articles` に変更されます。

#### 注意事項

- カスタム投稿タイプは REST API が有効である必要があります
- 投稿タイプ登録時に `show_in_rest` が `true` になっていることを確認
- カスタムタクソノミーも同様に REST API 対応が必要です

---

## 動作確認

### MCP Inspector でデバッグ

MCP Inspector を使って動作確認ができます：

```bash
WORDPRESS_URL=https://your-site.com \
WORDPRESS_USERNAME=your-username \
WORDPRESS_APP_PASSWORD="xxxx xxxx xxxx xxxx" \
npm run inspect
```

ブラウザが開き、インタラクティブにツールをテストできます。

### 基本的な動作確認

Cursor または Claude Desktop で以下を試してください：

1. **投稿一覧の取得**
   ```
   WordPressの下書き一覧を見せて
   ```

2. **投稿の作成**
   ```
   以下の内容でテスト投稿を作成して：
   タイトル: テスト投稿
   本文: これはテスト投稿です。
   ```

3. **投稿の削除**
   ```
   さっき作ったテスト投稿を削除して
   ```

---

## トラブルシューティング

### 401 Unauthorized

**原因**: 認証エラー

**対処法**:
- ユーザー名が正しいか確認
- アプリケーションパスワードが正しくコピーされているか確認
- アプリケーションパスワードにスペースが含まれていても問題ありません

### 403 Forbidden

**原因**: 権限不足または REST API がブロックされている

**対処法**:
- ユーザーに投稿作成権限があるか確認
- セキュリティプラグインが REST API をブロックしていないか確認
- `.htaccess` や Nginx 設定で REST API がブロックされていないか確認

### 404 Not Found

**原因**: エンドポイントが存在しない

**対処法**:
- WordPress URL が正しいか確認
- カスタム投稿タイプを使用している場合、`WP_POST_TYPE` が正しいか確認
- カスタム投稿タイプが REST API に対応しているか確認

### 500 Internal Server Error

**原因**: サーバー側のエラー

**対処法**:
- WordPress のエラーログを確認
- プラグインの競合がないか確認
- PHP のメモリ制限を確認

### 画像がアップロードできない

**原因**: ファイルパスの問題またはファイル形式の問題

**対処法**:
- ファイルパスが正しいか確認（絶対パスまたは作業ディレクトリからの相対パス）
- サポートされている形式か確認: jpg, jpeg, png, gif, webp, svg, pdf, mp4, webm
- WordPress のアップロードサイズ制限を確認

### MCP サーバーが起動しない

**原因**: 設定ファイルの問題または Node.js の問題

**対処法**:
- JSON の構文エラーがないか確認
- `args` のパスが絶対パスか確認
- Node.js 18 以上がインストールされているか確認
- `npm run build` が成功しているか確認

### Gemini API エラー

**原因**: API キーの問題またはクォータ超過

**対処法**:
- API キーが正しいか確認
- API キーが有効か [Google AI Studio](https://aistudio.google.com/) で確認
- 使用量がクォータを超えていないか確認

---

## 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要・クイックスタート
- [ツールリファレンス](./tools-reference.md) - 全ツールの詳細仕様
