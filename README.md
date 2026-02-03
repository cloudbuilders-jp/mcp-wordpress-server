# WordPress MCP Server

Cursor / Claude から WordPress にブログ記事を投稿できる MCP (Model Context Protocol) Server です。

## 機能

- **投稿管理**: 作成・更新・取得・削除
- **Markdown 対応**: GFM (GitHub Flavored Markdown) を自動で Gutenberg ブロックに変換
- **Gutenberg ブロック出力**: 段落、見出し、リスト、画像、引用、テーブルなどが適切なブロック形式で出力
- **Highlighting Code Block 対応**: コードブロックは [Highlighting Code Block](https://ja.wordpress.org/plugins/highlighting-code-block/) プラグイン形式で出力
- **画像自動アップロード**: Markdown 内のローカル画像を検出して自動アップロード
- **画像自動圧縮**: 1MB以上の画像を自動で圧縮（JPEG/PNG/WebP対応）
- **アイキャッチ画像**: 投稿作成・更新時にアイキャッチ画像を設定可能
- **AI アイキャッチ画像生成**: Gemini API を使って記事内容からアイキャッチ画像を自動生成
- **SEO Excerpt 自動生成**: Gemini API を使って記事の抜粋（meta description）を自動生成
- **メディア管理**: 画像や動画のアップロード・削除
- **カテゴリ・タグ**: 一覧取得、新規作成、投稿への設定
- **カスタムタクソノミー対応**: カスタム投稿タイプのタクソノミー（カテゴリ・タグ）の取得・作成・設定

> 📖 詳細なドキュメントは [docs/](./docs/) を参照してください。

## セットアップ

### 1. インストール

```bash
git clone <repository-url>
cd mcp-wordpress-server
npm install
npm run build
```

### 2. WordPress の設定

#### アプリケーションパスワードの発行

1. WordPress 管理画面にログイン
2. **ユーザー** → **プロフィール** に移動
3. 「アプリケーションパスワード」セクションまでスクロール
4. アプリケーション名を入力（例: `Cursor MCP`）
5. 「新しいアプリケーションパスワードを追加」をクリック
6. 表示されたパスワードを安全に保管（再表示されません）

> **注意**: アプリケーションパスワードは WordPress 5.6 以上で利用可能です。HTTPS が必須です。

### 3. Cursor の設定

`~/.cursor/mcp.json` を作成または編集:

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["/path/to/mcp-wordpress-server/dist/index.js"],
      "env": {
        "WORDPRESS_URL": "https://your-site.com",
        "WORDPRESS_USERNAME": "your-username",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx xxxx",
        "WP_POST_TYPE": "articles"
      }
    }
  }
}
```

**パスは絶対パスで指定してください。**

### 環境変数

| 変数名                   | 必須 | 説明                              |
| ------------------------ | ---- | --------------------------------- |
| `WORDPRESS_URL`          | ✅   | WordPress サイトの URL            |
| `WORDPRESS_USERNAME`     | ✅   | WordPress ユーザー名              |
| `WORDPRESS_APP_PASSWORD` | ✅   | アプリケーションパスワード        |
| `WP_POST_TYPE`           | ❌   | 投稿タイプ（デフォルト: `posts`） |
| `GEMINI_API_KEY`         | ❌   | Gemini API キー（AI画像生成・Excerpt自動生成に必要） |

**画像圧縮設定（すべてオプション）:**

| 変数名                      | デフォルト | 説明                              |
| --------------------------- | ---------- | --------------------------------- |
| `IMAGE_COMPRESSION_ENABLED` | `true`     | 圧縮の有効/無効（`false`で無効化）|
| `IMAGE_SIZE_THRESHOLD`      | `1048576`  | 圧縮対象のファイルサイズ（バイト、デフォルト1MB） |
| `IMAGE_COMPRESSION_QUALITY` | `80`       | 圧縮品質（1-100）                 |
| `IMAGE_MAX_WIDTH`           | `1920`     | リサイズ後の最大幅（ピクセル）    |
| `IMAGE_MAX_HEIGHT`          | `1080`     | リサイズ後の最大高さ（ピクセル）  |

> **カスタム投稿タイプの使用**: `WP_POST_TYPE` を設定すると、通常の「投稿」ではなくカスタム投稿タイプに対して操作を行います。例えば `articles` を設定すると、`/wp-json/wp/v2/articles` エンドポイントを使用します。

### 4. Cursor を再起動

設定を反映するため、Cursor を完全に終了して再起動します。

## 使い方

Cursor で Claude に以下のように指示できます:

### 投稿を作成

```
このMarkdownファイルをWordPressの下書きとして投稿して
```

```
以下の内容でブログ記事を作成して:
タイトル: TypeScriptの基礎
本文: ...
```

### ファイルから投稿

```
./blog/my-article.md をWordPressに投稿して
```

### 投稿一覧を確認

```
WordPressの下書き一覧を見せて
```

### 投稿を公開

```
投稿ID 123 を公開して
```

### 画像をアップロード

```
./images/screenshot.png をWordPressにアップロードして
```

## 利用可能な Tools

### 投稿管理

| Tool                    | 説明                            |
| ----------------------- | ------------------------------- |
| `get_posts`             | 投稿一覧を取得                  |
| `get_post`              | 指定 ID の投稿を取得            |
| `create_post`           | 新規投稿を作成                  |
| `create_post_from_file` | Markdown ファイルから投稿を作成 |
| `update_post`           | 投稿を更新                      |
| `delete_post`           | 投稿を削除                      |

### メディア管理

| Tool                      | 説明                                         |
| ------------------------- | -------------------------------------------- |
| `upload_media`            | メディアをアップロード                       |
| `get_media`               | メディア情報を取得                           |
| `delete_media`            | メディアを削除                               |
| `generate_featured_image` | AI でアイキャッチ画像を生成してアップロード  |

### カテゴリ・タグ管理

| Tool              | 説明               |
| ----------------- | ------------------ |
| `get_categories`  | カテゴリ一覧を取得 |
| `create_category` | カテゴリを新規作成 |
| `get_tags`        | タグ一覧を取得     |
| `create_tag`      | タグを新規作成     |

### カスタムタクソノミー管理

カスタム投稿タイプで使用されるカスタムタクソノミー（カテゴリ・タグ）を操作できます。

| Tool                   | 説明                                   |
| ---------------------- | -------------------------------------- |
| `get_taxonomies`       | 利用可能なタクソノミー一覧を取得       |
| `get_taxonomy_terms`   | 指定タクソノミーのターム一覧を取得     |
| `create_taxonomy_term` | 指定タクソノミーに新しいタームを作成   |
| `set_post_terms`       | 投稿にカスタムタクソノミーを設定       |

#### 使用例

```
# 1. 利用可能なタクソノミーを確認
get_taxonomies を実行して、articles 投稿タイプで使えるタクソノミーを確認

# 2. タクソノミーのタームを取得
get_taxonomy_terms で rest_base（例: tag-words）を指定してターム一覧を取得

# 3. 投稿にタームを設定
set_post_terms で投稿ID、タクソノミー、ターム ID の配列を指定して設定
```

### アイキャッチ画像の設定

`create_post`、`create_post_from_file`、`update_post` で `featured_media` パラメータを使用してアイキャッチ画像を設定できます：

```
1. まず画像をアップロード: upload_media で画像をアップロードし、メディアIDを取得
2. 投稿作成時に指定: create_post の featured_media にメディアIDを設定
```

### AI アイキャッチ画像生成

`generate_featured_image` ツールを使用すると、記事のタイトルと本文から AI（Gemini API）でアイキャッチ画像を自動生成できます。

**必要な設定**: 環境変数 `GEMINI_API_KEY` を設定してください。

**パラメータ**:

| パラメータ     | 必須 | 説明                                                      |
| -------------- | ---- | --------------------------------------------------------- |
| `title`        | ✅   | 記事のタイトル                                            |
| `content`      | ✅   | 記事の本文（Markdown 可）                                 |
| `custom_prompt`| ❌   | カスタム画像生成プロンプト（指定時は本文からの自動生成をスキップ） |
| `aspect_ratio` | ❌   | アスペクト比（デフォルト: `16:9`）                        |
| `style`        | ❌   | スタイル: `photorealistic`, `illustration`, `abstract`, `minimalist`（デフォルト: `illustration`） |
| `alt_text`     | ❌   | 代替テキスト                                              |

**使用例**:

```
# 記事内容からアイキャッチ画像を自動生成
generate_featured_image でタイトルと本文を指定
→ メディア ID が返却される

# 投稿作成時に設定
create_post で featured_media に返却されたメディア ID を指定
```

### SEO Excerpt 自動生成

`GEMINI_API_KEY` を設定すると、`create_post` や `create_post_from_file` で `excerpt` を指定しなかった場合に、記事内容から SEO に最適化された抜粋（160文字程度）を自動生成します。

- 手動で `excerpt` を指定した場合はそちらが優先されます
- 生成に失敗しても投稿作成は継続されます

### 画像自動圧縮

1MB を超える画像は自動的に圧縮されます：

- **対象フォーマット**: JPEG, PNG（透過なし）, WebP
- **スキップ**: GIF（アニメーション）, SVG（ベクター）, 透過PNG
- **処理**: 品質調整 → 必要に応じてリサイズ

環境変数で圧縮設定をカスタマイズできます（上記の環境変数セクション参照）。

## Markdown の対応

GFM (GitHub Flavored Markdown) に対応し、WordPress Gutenberg ブロック形式で出力します:

| Markdown 要素 | 出力ブロック |
| --- | --- |
| 段落 | `wp:paragraph` |
| 見出し (`#`, `##`, `###`) | `wp:heading` |
| リスト（順序付き、順序なし） | `wp:list` |
| コードブロック | `wp:loos-hcb/code-block` (Highlighting Code Block) |
| 引用 (`>`) | `wp:quote` |
| 画像 | `wp:image` |
| テーブル | `wp:table` |
| 区切り線 (`---`) | `wp:separator` |
| 打ち消し線 (`~~text~~`) | インライン `<del>` |
| インラインコード | インライン `<code>` |

### Highlighting Code Block

コードブロックは [Highlighting Code Block](https://ja.wordpress.org/plugins/highlighting-code-block/) プラグイン形式で出力されます。WordPress にこのプラグインをインストールしておく必要があります。

対応言語（一部）:
- JavaScript / TypeScript (`js`, `ts`, `jsx`, `tsx`)
- Python (`python`, `py`)
- HTML / CSS / SCSS
- Bash / Shell
- PHP, Ruby, Go, Rust, Java, C/C++, SQL
- YAML, JSON, Markdown
- その他多数

### 画像の自動アップロード

Markdown 内の相対パス画像は自動的に WordPress にアップロードされます:

```markdown
![スクリーンショット](./images/screenshot.png)
```

上記の画像は WordPress のメディアライブラリにアップロードされ、URL が自動的に置換されます。

## トラブルシューティング

### 401 Unauthorized

- ユーザー名とアプリケーションパスワードを確認
- アプリケーションパスワードにスペースが含まれていても問題ありません

### REST API が利用できない

- WordPress の URL が正しいか確認
- `https://your-site.com/wp-json/wp/v2/posts` にブラウザでアクセスして確認
- セキュリティプラグインが REST API をブロックしていないか確認

### 画像がアップロードできない

- ファイルパスが正しいか確認
- サポートされている形式: jpg, jpeg, png, gif, webp, svg, pdf, mp4, webm

## 開発

### ビルド

```bash
npm run build
```

### デバッグ

MCP Inspector を使ってデバッグ:

```bash
WORDPRESS_URL=https://... WORDPRESS_USERNAME=... WORDPRESS_APP_PASSWORD=... WP_POST_TYPE=articles npm run inspect
```

## ライセンス

MIT
