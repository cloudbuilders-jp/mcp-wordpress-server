# ツールリファレンス

WordPress MCP Server で利用可能な全18ツールの詳細リファレンスです。

## 目次

- [投稿管理](#投稿管理)
  - [get_posts](#get_posts)
  - [get_post](#get_post)
  - [create_post](#create_post)
  - [create_post_from_file](#create_post_from_file)
  - [update_post](#update_post)
  - [delete_post](#delete_post)
- [メディア管理](#メディア管理)
  - [upload_media](#upload_media)
  - [get_media](#get_media)
  - [delete_media](#delete_media)
  - [generate_featured_image](#generate_featured_image)
- [カテゴリ・タグ管理](#カテゴリタグ管理)
  - [get_categories](#get_categories)
  - [create_category](#create_category)
  - [get_tags](#get_tags)
  - [create_tag](#create_tag)
- [カスタムタクソノミー管理](#カスタムタクソノミー管理)
  - [get_taxonomies](#get_taxonomies)
  - [get_taxonomy_terms](#get_taxonomy_terms)
  - [create_taxonomy_term](#create_taxonomy_term)
  - [set_post_terms](#set_post_terms)

---

## 投稿管理

### get_posts

WordPress の投稿一覧を取得します。ステータス、カテゴリ、検索キーワードでフィルタリング可能です。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `page` | number | ❌ | ページ番号（デフォルト: 1） |
| `per_page` | number | ❌ | 1ページあたりの件数（デフォルト: 10、最大: 100） |
| `status` | string | ❌ | 投稿ステータス: `publish`, `draft`, `pending`, `private`, `any`（デフォルト: any） |
| `search` | string | ❌ | 検索キーワード |
| `categories` | number[] | ❌ | カテゴリ ID の配列 |

#### レスポンス例

```json
[
  {
    "id": 123,
    "title": "記事タイトル",
    "status": "publish",
    "date": "2024-01-01T12:00:00",
    "link": "https://example.com/post/123",
    "admin_url": "https://example.com/wp-admin/post.php?post=123&action=edit"
  }
]
```

#### 使用例

```
下書きの投稿一覧を取得して
→ get_posts(status: "draft")

カテゴリID 5 の公開済み記事を10件取得して
→ get_posts(status: "publish", categories: [5], per_page: 10)
```

---

### get_post

指定した ID の投稿を取得します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `post_id` | number | ✅ | 投稿 ID |

#### レスポンス例

```json
{
  "id": 123,
  "title": "記事タイトル",
  "content": "記事本文...",
  "status": "publish",
  "date": "2024-01-01T12:00:00",
  "modified": "2024-01-02T10:00:00",
  "link": "https://example.com/post/123",
  "categories": [1, 5],
  "tags": [10, 20],
  "admin_url": "https://example.com/wp-admin/post.php?post=123&action=edit"
}
```

#### 使用例

```
投稿ID 123 の詳細を見せて
→ get_post(post_id: 123)
```

---

### create_post

新しい投稿を作成します。Markdown 形式のコンテンツを指定すると自動的に Gutenberg ブロック形式に変換されます。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | string | ✅ | 投稿タイトル |
| `content` | string | ✅ | 投稿本文（Markdown または HTML） |
| `status` | string | ❌ | 投稿ステータス: `publish`, `draft`, `pending`, `private`（デフォルト: draft） |
| `categories` | number[] | ❌ | カテゴリ ID の配列 |
| `tags` | number[] | ❌ | タグ ID の配列 |
| `excerpt` | string | ❌ | 抜粋（未指定時は Gemini API で自動生成） |
| `is_markdown` | boolean | ❌ | content が Markdown かどうか（デフォルト: true） |
| `base_path` | string | ❌ | Markdown 内の相対画像パスを解決するための基準ディレクトリ |
| `featured_media` | number | ❌ | アイキャッチ画像のメディア ID |

#### 特徴

- **Markdown 自動変換**: `is_markdown: true`（デフォルト）の場合、Gutenberg ブロック形式に変換
- **画像自動アップロード**: Markdown 内の相対パス画像を WordPress にアップロードし、URL を置換
- **画像自動圧縮**: 1MB以上の画像は自動圧縮
- **SEO Excerpt 自動生成**: `excerpt` 未指定かつ `GEMINI_API_KEY` 設定時、160文字程度の抜粋を自動生成

#### レスポンス例

```json
{
  "success": true,
  "message": "投稿を作成しました",
  "uploaded_images": 2,
  "post": {
    "id": 124,
    "title": "新しい記事",
    "status": "draft",
    "link": "https://example.com/?p=124",
    "preview_url": "https://example.com/?p=124&preview=true",
    "admin_url": "https://example.com/wp-admin/post.php?post=124&action=edit"
  }
}
```

#### 使用例

```
以下の内容で下書き投稿を作成して
タイトル: TypeScript入門
本文: ## はじめに...
→ create_post(title: "TypeScript入門", content: "## はじめに...")

カテゴリ「技術」(ID: 5)で公開投稿を作成
→ create_post(title: "記事", content: "本文", status: "publish", categories: [5])
```

---

### create_post_from_file

Markdown ファイルから投稿を作成します。ファイル内の最初の H1 (`# タイトル`) がタイトルになります。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `file_path` | string | ✅ | Markdown ファイルのパス |
| `status` | string | ❌ | 投稿ステータス（デフォルト: draft） |
| `categories` | number[] | ❌ | カテゴリ ID の配列 |
| `tags` | number[] | ❌ | タグ ID の配列 |
| `featured_media` | number | ❌ | アイキャッチ画像のメディア ID |

#### 特徴

- **タイトル自動抽出**: ファイル内の最初の `# 見出し` をタイトルとして使用
- **画像自動アップロード**: ファイルからの相対パス画像を自動アップロード
- **SEO Excerpt 自動生成**: `GEMINI_API_KEY` 設定時、抜粋を自動生成

#### 使用例

```
./blog/my-article.md をWordPressの下書きとして投稿して
→ create_post_from_file(file_path: "./blog/my-article.md")

./docs/guide.md を公開投稿として作成
→ create_post_from_file(file_path: "./docs/guide.md", status: "publish")
```

---

### update_post

既存の投稿を更新します。指定したパラメータのみが更新されます。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `post_id` | number | ✅ | 更新する投稿の ID |
| `title` | string | ❌ | 新しいタイトル |
| `content` | string | ❌ | 新しい本文（Markdown または HTML） |
| `status` | string | ❌ | 新しいステータス |
| `categories` | number[] | ❌ | カテゴリ ID の配列 |
| `tags` | number[] | ❌ | タグ ID の配列 |
| `excerpt` | string | ❌ | 新しい抜粋 |
| `is_markdown` | boolean | ❌ | content が Markdown かどうか（デフォルト: true） |
| `base_path` | string | ❌ | 相対画像パスの基準ディレクトリ |
| `featured_media` | number | ❌ | アイキャッチ画像のメディア ID |

#### 使用例

```
投稿ID 123 を公開して
→ update_post(post_id: 123, status: "publish")

投稿ID 123 のタイトルと本文を更新
→ update_post(post_id: 123, title: "新タイトル", content: "新しい本文")
```

---

### delete_post

投稿を削除します（ゴミ箱へ移動、または完全削除）。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `post_id` | number | ✅ | 削除する投稿の ID |
| `force` | boolean | ❌ | 完全削除するか（デフォルト: false でゴミ箱へ移動） |

#### 使用例

```
投稿ID 123 をゴミ箱に移動
→ delete_post(post_id: 123)

投稿ID 123 を完全に削除
→ delete_post(post_id: 123, force: true)
```

---

## メディア管理

### upload_media

ローカルファイルを WordPress のメディアライブラリにアップロードします。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `file_path` | string | ✅ | アップロードするファイルのパス |
| `title` | string | ❌ | メディアのタイトル |
| `alt_text` | string | ❌ | 代替テキスト（画像のアクセシビリティ用） |
| `caption` | string | ❌ | キャプション |

#### 特徴

- **自動圧縮**: 1MB以上の画像は自動圧縮（JPEG, PNG, WebP対応）
- **対応形式**: jpg, jpeg, png, gif, webp, svg, pdf, mp4, webm

#### レスポンス例

```json
{
  "success": true,
  "message": "メディアをアップロードしました",
  "media": {
    "id": 456,
    "title": "screenshot",
    "url": "https://example.com/wp-content/uploads/2024/01/screenshot.png",
    "mime_type": "image/png",
    "width": 1920,
    "height": 1080
  }
}
```

#### 使用例

```
./images/photo.jpg をWordPressにアップロード
→ upload_media(file_path: "./images/photo.jpg", alt_text: "写真の説明")
```

---

### get_media

指定した ID のメディア情報を取得します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `media_id` | number | ✅ | メディア ID |

#### 使用例

```
メディアID 456 の情報を取得
→ get_media(media_id: 456)
```

---

### delete_media

指定した ID のメディアを削除します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `media_id` | number | ✅ | 削除するメディアの ID |
| `force` | boolean | ❌ | 完全に削除するか（デフォルト: true） |

#### 使用例

```
メディアID 456 を削除
→ delete_media(media_id: 456)
```

---

### generate_featured_image

記事のタイトルと本文から AI でアイキャッチ画像を自動生成し、WordPress にアップロードします。

> **必要条件**: `GEMINI_API_KEY` または `GOOGLE_API_KEY` 環境変数の設定が必要

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | string | ✅ | 記事のタイトル |
| `content` | string | ✅ | 記事の本文（Markdown 可） |
| `custom_prompt` | string | ❌ | カスタム画像生成プロンプト（指定時は自動生成をスキップ） |
| `aspect_ratio` | string | ❌ | アスペクト比（デフォルト: `16:9`） |
| `style` | string | ❌ | スタイル（デフォルト: `illustration`） |
| `alt_text` | string | ❌ | 代替テキスト（未指定時はタイトルを使用） |

#### アスペクト比オプション

`1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`

#### スタイルオプション

| スタイル | 説明 |
|---------|------|
| `photorealistic` | 写実的な画像 |
| `illustration` | イラスト風（デフォルト） |
| `abstract` | 抽象的なアート |
| `minimalist` | ミニマリストデザイン |

#### レスポンス例

```json
{
  "success": true,
  "message": "アイキャッチ画像を生成してアップロードしました",
  "media": {
    "id": 789,
    "title": "TypeScript入門",
    "url": "https://example.com/wp-content/uploads/2024/01/generated-image.png",
    "width": 1920,
    "height": 1080
  },
  "generation_info": {
    "prompt_used": "A modern illustration about TypeScript programming...",
    "aspect_ratio": "16:9",
    "style": "illustration"
  },
  "usage_hint": "このメディア ID (789) を create_post の featured_media パラメータに指定してください"
}
```

#### 使用例

```
この記事のアイキャッチ画像を生成して
→ generate_featured_image(title: "記事タイトル", content: "記事本文...")

カスタムプロンプトで画像を生成
→ generate_featured_image(title: "記事", content: "本文", custom_prompt: "青い空と白い雲のイラスト")
```

---

## カテゴリ・タグ管理

### get_categories

WordPress のカテゴリ一覧を取得します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `search` | string | ❌ | 検索キーワード |
| `per_page` | number | ❌ | 取得件数（デフォルト: 100） |

#### レスポンス例

```json
[
  {
    "id": 1,
    "name": "未分類",
    "slug": "uncategorized",
    "count": 5,
    "parent": 0
  },
  {
    "id": 5,
    "name": "技術",
    "slug": "tech",
    "count": 10,
    "parent": 0
  }
]
```

---

### create_category

新しいカテゴリを作成します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `name` | string | ✅ | カテゴリ名 |
| `slug` | string | ❌ | スラッグ（URL用識別子） |
| `description` | string | ❌ | カテゴリの説明 |
| `parent` | number | ❌ | 親カテゴリの ID |

---

### get_tags

WordPress のタグ一覧を取得します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `search` | string | ❌ | 検索キーワード |
| `per_page` | number | ❌ | 取得件数（デフォルト: 100） |

---

### create_tag

新しいタグを作成します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `name` | string | ✅ | タグ名 |
| `slug` | string | ❌ | スラッグ |
| `description` | string | ❌ | タグの説明 |

---

## カスタムタクソノミー管理

カスタム投稿タイプで使用されるカスタムタクソノミーを操作するためのツールです。

### get_taxonomies

WordPress で利用可能なタクソノミー（分類）一覧を取得します。

#### パラメータ

なし

#### レスポンス例

```json
[
  {
    "slug": "category",
    "name": "カテゴリー",
    "description": "",
    "types": ["post"],
    "hierarchical": true,
    "rest_base": "categories"
  },
  {
    "slug": "article_category",
    "name": "記事カテゴリー",
    "description": "",
    "types": ["articles"],
    "hierarchical": true,
    "rest_base": "article-categories"
  }
]
```

---

### get_taxonomy_terms

指定したタクソノミーのターム（項目）一覧を取得します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `taxonomy` | string | ✅ | タクソノミーの REST ベース（`rest_base` の値） |
| `search` | string | ❌ | 検索キーワード |
| `per_page` | number | ❌ | 取得件数（デフォルト: 100） |
| `parent` | number | ❌ | 親タームの ID |
| `hide_empty` | boolean | ❌ | 投稿がないタームを非表示にするか（デフォルト: false） |

#### 使用例

```
カスタムタクソノミー「article-categories」のターム一覧を取得
→ get_taxonomy_terms(taxonomy: "article-categories")
```

---

### create_taxonomy_term

指定したタクソノミーに新しいタームを作成します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `taxonomy` | string | ✅ | タクソノミーの REST ベース |
| `name` | string | ✅ | ターム名 |
| `slug` | string | ❌ | スラッグ |
| `description` | string | ❌ | タームの説明 |
| `parent` | number | ❌ | 親タームの ID |

---

### set_post_terms

投稿にカスタムタクソノミーのタームを設定します。

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `post_id` | number | ✅ | 投稿 ID |
| `taxonomy` | string | ✅ | タクソノミーの REST ベース |
| `term_ids` | number[] | ✅ | 設定するターム ID の配列 |

#### 使用例

```
投稿ID 123 にカスタムタクソノミー「article-categories」のターム [1, 2] を設定
→ set_post_terms(post_id: 123, taxonomy: "article-categories", term_ids: [1, 2])
```

---

## 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要・クイックスタート
- [セットアップガイド](./setup-guide.md) - 詳細なセットアップ手順
