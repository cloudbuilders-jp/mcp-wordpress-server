# WordPress MCP Server

Cursor / Claude から WordPress にブログ記事を投稿できる MCP (Model Context Protocol) Server です。

## 機能

- **投稿管理**: 作成・更新・取得・削除
- **Markdown 対応**: GFM (GitHub Flavored Markdown) を自動で Gutenberg ブロックに変換
- **Gutenberg ブロック出力**: 段落、見出し、リスト、画像、引用、テーブルなどが適切なブロック形式で出力
- **Highlighting Code Block 対応**: コードブロックは [Highlighting Code Block](https://ja.wordpress.org/plugins/highlighting-code-block/) プラグイン形式で出力
- **画像自動アップロード**: Markdown 内のローカル画像を検出して自動アップロード
- **アイキャッチ画像**: 投稿作成・更新時にアイキャッチ画像を設定可能
- **メディア管理**: 画像や動画のアップロード・削除
- **カテゴリ・タグ**: 一覧取得、新規作成、投稿への設定
- **カスタムタクソノミー対応**: カスタム投稿タイプのタクソノミー（カテゴリ・タグ）の取得・作成・設定

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

| Tool           | 説明                   |
| -------------- | ---------------------- |
| `upload_media` | メディアをアップロード |
| `get_media`    | メディア情報を取得     |
| `delete_media` | メディアを削除         |

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
