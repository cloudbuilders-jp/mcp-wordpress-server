# /new-tool - 新規MCPツール追加ガイド

新しいMCPツールを追加する際のチェックリストとガイドです。

## ツール名

$ARGUMENTS

## 追加手順チェックリスト

### Step 1: ツールスキーマ定義
`src/tools/posts.ts` または `src/tools/media.ts` に JSON Schema を追加

```typescript
export const newToolSchema = {
  name: "tool_name",
  description: "ツールの説明",
  inputSchema: {
    type: "object",
    properties: {
      // パラメータ定義
    },
    required: ["required_param"]
  }
};
```

### Step 2: Zod バリデーションスキーマ
`src/schemas/` に Zod スキーマを追加

```typescript
import { z } from "zod";

export const NewToolInputSchema = z.object({
  // バリデーションルール
});

export type NewToolInput = z.infer<typeof NewToolInputSchema>;
```

### Step 3: ハンドラー実装
`src/handlers/` にハンドラー関数を追加

```typescript
export async function handleNewTool(
  args: unknown,
  context: HandlerContext
): Promise<HandlerResult> {
  const input = NewToolInputSchema.parse(args);
  // 実装
}
```

### Step 4: ハンドラー登録
`src/handlers/index.ts` の `handlerMap` に登録

```typescript
export const handlerMap: HandlerMap = {
  // 既存のハンドラー...
  tool_name: handleNewTool,
};
```

### Step 5: テスト追加
`tests/` にユニットテストを追加

```typescript
import { describe, it, expect } from 'vitest';
import { handleNewTool } from '../src/handlers/xxx-handler';

describe('handleNewTool', () => {
  it('should handle valid input', async () => {
    // テスト実装
  });

  it('should throw on invalid input', async () => {
    // バリデーションエラーのテスト
  });
});
```

## 確認コマンド

```bash
npm run typecheck  # 型チェック
npm test           # テスト実行
npm run dev        # 動作確認
```

## 注意点

- ツール名はスネークケース（例: `get_posts`, `upload_media`）
- 必ずZodでバリデーションを行う（`args as Type` は禁止）
- エラーハンドリングを適切に実装する
