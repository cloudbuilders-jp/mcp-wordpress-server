# /release - リリース準備

リリース前の確認と準備を行います。

## 引数

$ARGUMENTS

## リリースチェックリスト

### 1. コード品質確認

```bash
npm run typecheck && npm run lint && npm test
```

すべてパスすることを確認。

### 2. ビルド確認

```bash
npm run build
```

TypeScript コンパイルが成功することを確認。

### 3. package.json バージョン確認

現在のバージョンを確認し、セマンティックバージョニングに従って更新が必要か判断：

- **MAJOR**: 破壊的変更がある場合
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### 4. CHANGELOG 確認（存在する場合）

- 新機能、修正、破壊的変更が記載されているか
- バージョン番号と日付が正しいか

### 5. README 確認

- 新機能のドキュメントが追加されているか
- セットアップ手順が最新か
- 環境変数の説明が最新か

### 6. Git 状態確認

```bash
git status
git log --oneline -5
```

- 未コミットの変更がないか
- 最近のコミットが適切か

## リリース手順

1. すべてのチェックがパスしたら、バージョンを更新
2. CHANGELOG を更新（あれば）
3. コミット: `git commit -m "chore: bump version to X.Y.Z"`
4. タグ作成: `git tag vX.Y.Z`
5. プッシュ: `git push && git push --tags`

## 注意

- main ブランチからリリースすること
- 必要に応じて PR を作成してレビューを受けること
