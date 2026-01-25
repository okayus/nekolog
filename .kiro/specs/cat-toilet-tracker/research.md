# Research & Design Decisions

## Summary
- **Feature**: `cat-toilet-tracker`
- **Discovery Scope**: New Feature (グリーンフィールド)
- **Key Findings**:
  - Hono RPC により、バックエンドとフロントエンド間で型安全なAPI通信が実現可能
  - Clerk は @hono/clerk-auth ミドルウェアで Cloudflare Workers と統合可能
  - Drizzle ORM は D1 との相性が良く、TypeScript ファーストの設計
  - Turborepo + pnpm workspaces でモノレポ構成、共有パッケージで型を共有
  - GitHub Actions + wrangler-action で CI/CD を自動化
  - **neverthrow** による Railway Oriented Programming で型安全なエラーハンドリングを実現

## Research Log

### neverthrow による Railway Oriented Programming
- **Context**: Domain Modeling Made Functional に基づく型安全なエラーハンドリング
- **Sources Consulted**:
  - [neverthrow GitHub](https://github.com/supermacro/neverthrow)
  - [NeverThrow and Railway Oriented Programming in TypeScript](https://blog.eneascaccabarozzi.xyz/neverthrow-and-railway-oriented-programming-in-typescript/)
  - [jambit - Try but don't catch](https://www.jambit.com/en/latest-info/toilet-papers/try-but-dont-catch-elegant-error-handling-with-typescript/)
- **Findings**:
  - `Result<T, E>` 型で成功（`Ok`）と失敗（`Err`）を表現
  - `andThen()` でワークフローをチェーン、失敗時は自動的に短絡評価
  - `ResultAsync<T, E>` で非同期ワークフローも同様に合成可能
  - `Result.fromThrowable()` で既存の throw ベースのコードをラップ可能
  - `eslint-plugin-neverthrow` で Result の未処理を防止
  - Zod バリデーションと組み合わせて入力検証を Result に変換可能
- **Implications**:
  - サービス層は `Result<T, DomainError>` を返す
  - API ルートで `match()` を使って HTTP レスポンスに変換
  - ドメインエラーは discriminated union で定義
  - try-catch を使わず、型で失敗を表現

### Cloudflare Workers + Hono + D1 統合
- **Context**: サーバーレスバックエンドの技術スタック選定
- **Sources Consulted**:
  - [Cloudflare D1 + Hono ドキュメント](https://developers.cloudflare.com/d1/examples/d1-and-hono/)
  - [Drizzle ORM D1 連携](https://orm.drizzle.team/docs/connect-cloudflare-d1)
- **Findings**:
  - Hono は Cloudflare Workers に最適化されたフレームワーク
  - D1 バインディングは `c.env.DB` でアクセス可能
  - Drizzle ORM は D1 とのネイティブ統合をサポート
  - 型定義: `type Bindings = { DB: D1Database; }`
- **Implications**:
  - バックエンドは Hono + Drizzle + D1 で構成
  - 環境変数とバインディングの型定義が必要

### Hono RPC による型安全API
- **Context**: フロントエンド・バックエンド間の型共有
- **Sources Consulted**:
  - [Hono RPC ドキュメント](https://hono.dev/docs/guides/rpc)
  - [Hono RPC TypeScript 解説](https://blog.yusu.ke/hono-rpc/)
- **Findings**:
  - `AppType` を export してクライアントで型推論
  - Zod Validator との組み合わせで入力検証 + 型安全
  - `hc<AppType>()` でクライアント生成、補完が効く
  - モノレポ構成では TypeScript project references が必要
- **Implications**:
  - API 定義は Zod スキーマベース
  - フロントエンドは hc クライアントで API 呼び出し
  - 型定義の共有により、スキーマ駆動開発が実現

### Clerk 認証と Cloudflare Workers 統合
- **Context**: 認証プロバイダーの選定と統合方法
- **Sources Consulted**:
  - [Hono + Clerk 統合例](https://honobyexample.com/posts/clerk-backend)
  - [Clerk Backend SDK](https://clerk.com/docs/guides/development/sdk-development/backend-only)
- **Findings**:
  - `@hono/clerk-auth` ミドルウェアが利用可能
  - `@clerk/backend` は V8 isolates（Workers）に対応
  - フロントエンドは `@clerk/clerk-react` を使用
  - セッショントークンをヘッダーで送信する方式
- **Implications**:
  - バックエンドは Clerk ミドルウェアで保護
  - ユーザー作成機能なし = Clerk Dashboard で事前登録
  - 招待制はメールドメイン制限または allowlist で実現

### TanStack Query ベストプラクティス
- **Context**: フロントエンドのデータ取得戦略
- **Sources Consulted**:
  - [TanStack Query 公式ドキュメント](https://tanstack.com/query/latest/docs/framework/react/overview)
  - [Request Waterfalls 回避](https://tanstack.com/query/latest/docs/framework/react/guides/request-waterfalls)
- **Findings**:
  - Query Key は配列形式で一意に管理
  - staleTime と gcTime で再取得戦略を制御
  - Mutation 後は invalidateQueries で更新
  - DevTools で状態確認可能
- **Implications**:
  - Hono RPC クライアントを queryFn で使用
  - 楽観的更新でUX向上
  - エラーハンドリングは共通化

### Cloudflare R2 画像ストレージ
- **Context**: 猫の写真アップロード機能
- **Sources Consulted**:
  - [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
  - [R2 Image Worker 例](https://github.com/yusukebe/r2-image-worker)
- **Findings**:
  - R2 バインディングで直接アクセス可能
  - `BUCKET.put(key, body)` でアップロード
  - `BUCKET.get(key)` で取得
  - 署名付きURLまたは認証ミドルウェアで保護
- **Implications**:
  - 猫の写真は R2 に保存
  - アップロードは認証必須
  - 将来的に Cloudflare Images での最適化も検討可能

### Turborepo + pnpm モノレポ構成
- **Context**: プロジェクト構成とビルドオーケストレーション
- **Sources Consulted**:
  - [Cloudflare Monorepos ドキュメント](https://developers.cloudflare.com/pages/configuration/monorepos/)
  - [Hono RPC Monorepo Template](https://github.com/sor4chi/hono-rpc-monorepo-pnpm-turbo)
  - [TypeScript Monorepo Setup](https://www.outstand.so/blog/typescript-monorepo-setup)
- **Findings**:
  - pnpm workspaces で依存関係を一元管理
  - Turborepo で効率的なビルドキャッシュとタスク並列実行
  - 共有パッケージは TypeScript ソースのまま export（コンパイル不要）
  - `workspace:*` プロトコルでローカルパッケージを参照
  - Hono RPC の型共有にはモノレポが最適
- **Implications**:
  - `apps/web` (フロントエンド), `apps/api` (バックエンド), `packages/shared` (共有型) の構成
  - Turborepo が依存グラフを理解し、変更があった部分のみリビルド
  - TypeScript project references で型の整合性を保証

### GitHub Actions CI/CD
- **Context**: 自動テスト・デプロイパイプライン
- **Sources Consulted**:
  - [Cloudflare GitHub Actions ドキュメント](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
  - [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action)
- **Findings**:
  - `cloudflare/wrangler-action@v3` で Workers/Pages デプロイ
  - `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` が必要
  - `deployment-url` output でデプロイ URL を取得可能
  - Pages は `pages-deployment-alias-url` でプレビュー URL 取得
  - pnpm + Turborepo はキャッシュ設定で高速化
- **Implications**:
  - main ブランチへの push で本番デプロイ
  - PR でプレビューデプロイ
  - Turborepo のリモートキャッシュで CI 高速化

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| モノリス（単一Workers） | API + 静的ファイルを1つの Workers でホスト | シンプル、デプロイ容易 | スケールの柔軟性低 | 初期開発に適切 |
| マイクロサービス | 機能ごとに Workers を分割 | スケーラブル | 複雑性増大、初期には過剰 | 将来の拡張時に検討 |
| **選択: モノリス + レイヤード** | Hono routes を機能別に分割しつつ単一 Workers | 適度な分離と簡潔さのバランス | - | 採用 |

## Design Decisions

### Decision: エラーハンドリング戦略
- **Context**: Domain Modeling Made Functional に基づくワークフロー実装
- **Alternatives Considered**:
  1. try-catch + カスタムエラークラス
  2. fp-ts の Either 型
  3. neverthrow の Result 型
- **Selected Approach**: neverthrow の Result 型
- **Rationale**:
  - 軽量（依存ゼロ）で学習コストが低い
  - TypeScript との相性が良く、型推論が効く
  - `andThen()` によるワークフロー合成が直感的
  - `ResultAsync` で非同期処理も同様に扱える
  - eslint プラグインで未処理 Result を検出可能
- **Trade-offs**: fp-ts ほどの抽象化は提供しないが、シンプルさを優先
- **Follow-up**: ESLint プラグインの設定

### Decision: データベース設計
- **Context**: 猫とトイレ記録のデータ構造
- **Alternatives Considered**:
  1. 正規化設計（cats, toilet_logs 分離）
  2. 非正規化（logs に cat 情報を埋め込み）
- **Selected Approach**: 正規化設計
- **Rationale**:
  - 猫の情報更新時に一貫性を保てる
  - 将来の機能拡張（体重履歴など）に対応しやすい
- **Trade-offs**: JOIN が必要だが、D1 のパフォーマンスで問題なし
- **Follow-up**: インデックス戦略の検討

### Decision: 認証フロー
- **Context**: Clerk を使った認証の実装方式
- **Alternatives Considered**:
  1. サーバーサイドセッション
  2. JWT トークン（Clerk 標準）
- **Selected Approach**: Clerk JWT + @hono/clerk-auth ミドルウェア
- **Rationale**:
  - Clerk の標準フローに従うことで実装が簡潔
  - Workers のステートレス性と相性が良い
- **Trade-offs**: Clerk への依存
- **Follow-up**: トークンリフレッシュの動作確認

### Decision: フロントエンドアーキテクチャ
- **Context**: React SPA の構成
- **Alternatives Considered**:
  1. Next.js（SSR）
  2. Vite + React（SPA）
  3. Remix
- **Selected Approach**: Vite + React SPA
- **Rationale**:
  - Cloudflare Pages で静的ホスティング
  - シンプルで学習コストが低い
  - Hono RPC との相性が良い
- **Trade-offs**: SEO が不要なプライベートアプリなので SSR 不要
- **Follow-up**: Cloudflare Pages へのデプロイ設定

### Decision: 画像ストレージ
- **Context**: 猫の写真保存先
- **Alternatives Considered**:
  1. R2 直接保存
  2. 外部サービス（Cloudinary など）
  3. D1 に Base64 で保存
- **Selected Approach**: Cloudflare R2
- **Rationale**:
  - Cloudflare エコシステム内で完結
  - エグレス料金無料
  - Workers から直接アクセス可能
- **Trade-offs**: 画像リサイズは別途実装が必要
- **Follow-up**: 画像のサイズ制限とバリデーション

### Decision: モノレポ構成
- **Context**: プロジェクトの構成とパッケージ管理
- **Alternatives Considered**:
  1. 単一リポジトリ（フラット構成）
  2. 複数リポジトリ（マイクロリポ）
  3. pnpm workspaces + Turborepo モノレポ
- **Selected Approach**: pnpm workspaces + Turborepo
- **Rationale**:
  - Hono RPC の型共有にモノレポが最適
  - Turborepo のキャッシュでビルド高速化
  - 依存関係の一元管理
  - アトミックコミットで整合性確保
- **Trade-offs**: 初期セットアップの複雑さ
- **Follow-up**: Turborepo リモートキャッシュの設定

### Decision: CI/CD パイプライン
- **Context**: 自動テスト・デプロイの実現
- **Alternatives Considered**:
  1. Cloudflare 組み込み Git 連携
  2. GitHub Actions + wrangler-action
  3. その他 CI サービス（CircleCI など）
- **Selected Approach**: GitHub Actions + wrangler-action
- **Rationale**:
  - GitHub との緊密な統合
  - wrangler-action の公式サポート
  - カスタマイズの柔軟性
  - pnpm/Turborepo との相性
- **Trade-offs**: Cloudflare 組み込み連携より設定が必要
- **Follow-up**: プレビューデプロイの PR コメント連携

## Risks & Mitigations
- **D1 のパフォーマンス制限** — 小規模アプリなので問題なし。必要に応じてインデックス追加
- **Clerk の料金** — 無料枠（10,000 MAU）で十分。超過時は Cloudflare Access に移行検討
- **R2 のファイルサイズ** — Workers API は 100MB 制限。画像は十分対応可能
- **モノレポの複雑さ** — Turborepo の学習コストあり。公式テンプレートをベースに構築
- **CI キャッシュの問題** — pnpm + モノレポでキャッシュが効かない報告あり。適切なキャッシュキー設定で対応
- **neverthrow 学習コスト** — シンプルなAPIなので低い。eslint プラグインで強制的に習慣化

## References
- [Hono 公式ドキュメント](https://hono.dev/) — フレームワーク全般
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/) — データベース
- [Drizzle ORM ドキュメント](https://orm.drizzle.team/docs) — ORM
- [Clerk ドキュメント](https://clerk.com/docs) — 認証
- [TanStack Query ドキュメント](https://tanstack.com/query/latest) — データフェッチング
- [Cloudflare R2 ドキュメント](https://developers.cloudflare.com/r2/) — オブジェクトストレージ
- [Turborepo 公式ドキュメント](https://turbo.build/repo/docs) — モノレポオーケストレーション
- [pnpm Workspaces](https://pnpm.io/workspaces) — ワークスペース管理
- [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) — CI/CD
- [wrangler-action](https://github.com/cloudflare/wrangler-action) — デプロイアクション
- [neverthrow](https://github.com/supermacro/neverthrow) — Railway Oriented Programming
- [Scott Wlaschin - Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/) — ROP 概念
