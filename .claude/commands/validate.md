# /validate - 品質チェック一括実行

コードの品質チェックを一括で実行します。

## 実行内容

以下のコマンドを順番に実行してください：

1. **TypeScript型チェック**
   ```bash
   npm run typecheck
   ```

2. **ESLint チェック**
   ```bash
   npm run lint
   ```

3. **Prettier フォーマットチェック**
   ```bash
   npm run format:check
   ```

4. **テスト実行**
   ```bash
   npm test
   ```

## 期待される結果

- すべてのコマンドがエラーなく完了すること
- 型エラー、lint エラー、フォーマットエラーがないこと
- すべてのテストがパスすること

## エラーが発生した場合

- **型エラー**: 該当ファイルを修正
- **lint エラー**: `npm run lint:fix` で自動修正を試みる
- **フォーマットエラー**: `npm run format` で自動修正
- **テスト失敗**: テストコードまたは実装を確認

$ARGUMENTS
