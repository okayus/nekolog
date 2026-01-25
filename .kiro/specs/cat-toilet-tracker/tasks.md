# Implementation Plan

## Overview
NekoLog（猫トイレ記録アプリ）の実装タスク一覧。各タスクは PR 単位で管理可能なサイズに分割。
Domain Modeling Made Functional + neverthrow による Railway Oriented Programming を採用。

---

## Tasks

- [x] 1. リポジトリ初期化と CI 基盤構築
- [x] 1.1 GitHub パブリックリポジトリの作成とモノレポ基盤セットアップ
  - GitHub にパブリックリポジトリを作成
  - pnpm workspace と Turborepo の初期設定
  - ルートの package.json、pnpm-workspace.yaml、turbo.json を作成
  - 共通の tsconfig.base.json を作成
  - .gitignore、.nvmrc（Node 20）を追加
  - _Requirements: N/A（インフラ基盤）_

- [x] 1.2 GitHub Actions CI ワークフローの構築（プレースホルダーテスト）
  - .github/workflows/ci.yml を作成
  - pnpm install と Turborepo キャッシュの設定
  - プレースホルダーとして常に成功する簡単なテストを追加
  - PR 作成時に CI が動作することを確認
  - _Requirements: N/A（インフラ基盤）_

- [ ] 2. 共有パッケージのセットアップ
- [x] 2.1 packages/shared の初期化と neverthrow エラー型定義
  - packages/shared パッケージを作成
  - neverthrow と Zod をインストール
  - DomainError 型の定義（discriminated union）
  - DomainErrors コンストラクタの実装
  - fromZodError ヘルパーの実装
  - _Requirements: WF3-11（全ワークフローで使用）_

- [x] 2.2 共有スキーマと型定義
  - Cat、ToiletLog の Zod スキーマ定義
  - createCatSchema、updateCatSchema の実装
  - createLogSchema、updateLogSchema の実装
  - logsQuerySchema（フィルタ・ページネーション）の実装
  - ToiletType、Period の型定義
  - API レスポンス型（CatSummary、ChartData 等）の定義
  - _Requirements: WF3-11_

- [x] 2.3 共有パッケージのユニットテスト追加
  - Vitest をセットアップ
  - Zod スキーマのバリデーションテストを追加
  - DomainErrors コンストラクタのテスト
  - fromZodError のテスト
  - CI で `pnpm turbo test` が実行されることを確認
  - _Requirements: WF3-11_

- [ ] 3. バックエンド API 基盤構築
- [x] 3.1 apps/api の初期化と Hono セットアップ
  - apps/api パッケージを作成
  - Hono v4 をインストール
  - Cloudflare Workers 用の wrangler.toml を作成
  - ヘルスチェック用の `/api/health` エンドポイントを実装
  - AppType を export して RPC の型共有基盤を作成
  - Bindings 型の定義（DB, BUCKET, CLERK_*）
  - _Requirements: N/A（インフラ基盤）_

- [x] 3.2 Drizzle ORM と D1 データベース設定
  - Drizzle ORM をインストールし設定
  - D1 用のスキーマ定義（users, cats, toilet_logs テーブル）
  - インデックス設定（idx_cats_user_id, idx_toilet_logs_cat_id 等）
  - drizzle-kit でマイグレーションファイルを生成
  - ローカル開発用の D1 バインディング設定
  - _Requirements: WF3-11_

- [x] 3.3 Clerk 認証ミドルウェアの統合
  - @hono/clerk-auth をインストール
  - 認証ミドルウェアを実装し全 API ルートを保護
  - 認証済みユーザーの userId を取得する仕組みを実装
  - 未認証リクエストに 401（DomainError.unauthorized）を返す動作を確認
  - _Requirements: WF1, WF2_

- [x] 3.4 handleDomainError ユーティリティの実装
  - DomainError を HTTP レスポンスに変換する関数
  - validation → 400、not_found → 404、unauthorized → 401、confirmation_required → 422、database → 500
  - エラーレスポンスの JSON 形式統一
  - _Requirements: WF3-11_

- [ ] 4. 猫管理ワークフローと API の実装
- [x] 4.1 CatRepository の実装
  - リポジトリインターフェースの定義
  - create: ResultAsync<Cat, DomainError>
  - update: ResultAsync<Cat, DomainError>
  - delete: ResultAsync<void, DomainError>
  - findById: ResultAsync<Cat | null, DomainError>
  - findAllByUserId: ResultAsync<Cat[], DomainError>
  - DB エラーを DomainError.database に変換
  - _Requirements: WF3-6_

- [x] 4.2 猫管理ワークフローの実装（RegisterCat, UpdateCat, DeleteCat, ListCats）
  - registerCat: 入力検証 → 猫作成（andThen チェーン）
  - updateCat: 猫存在確認 → 入力検証 → 更新
  - deleteCat: 確認フラグチェック → 猫存在確認 → 削除（カスケード削除）
  - listCats: ユーザーの全猫取得
  - getCat: 単一猫取得
  - 各ワークフローは ResultAsync<T, DomainError> を返す
  - _Requirements: WF3-6_

- [x] 4.3 猫管理 API ルートの実装
  - GET /api/cats → listCats workflow → match でレスポンス
  - GET /api/cats/:id → getCat workflow → match
  - POST /api/cats → registerCat workflow → match
  - PUT /api/cats/:id → updateCat workflow → match
  - DELETE /api/cats/:id?confirmed=true → deleteCat workflow → match
  - _Requirements: WF3-6_

- [ ] 4.4 猫の画像アップロード機能（R2 統合）
  - POST /api/cats/:id/image エンドポイント実装
  - R2 バケットへの画像保存処理
  - 画像 URL の cats テーブルへの保存
  - ファイルサイズ・形式のバリデーション
  - ResultAsync でエラーハンドリング
  - _Requirements: WF3_

- [ ] 5. トイレ記録ワークフローと API の実装
- [ ] 5.1 LogRepository の実装
  - リポジトリインターフェースの定義
  - create: ResultAsync<ToiletLog, DomainError>
  - update: ResultAsync<ToiletLog, DomainError>
  - delete: ResultAsync<void, DomainError>
  - findById: ResultAsync<ToiletLog | null, DomainError>
  - findWithFilters: ResultAsync<PaginatedLogs, DomainError>
  - _Requirements: WF7-10_

- [ ] 5.2 トイレ記録ワークフローの実装（AddLog, UpdateLog, DeleteLog, GetHistory）
  - addLog: 入力検証 → 猫存在確認 → 記録作成
  - updateLog: 記録存在確認 → 入力検証 → 更新
  - deleteLog: 確認フラグチェック → 記録存在確認 → 削除
  - getHistory: フィルタ検証 → ページネーション付き取得
  - 各ワークフローは ResultAsync<T, DomainError> を返す
  - _Requirements: WF7-10_

- [ ] 5.3 トイレ記録 API ルートの実装
  - GET /api/logs → getHistory workflow → match
  - GET /api/logs/:id → getLog workflow → match
  - POST /api/logs → addLog workflow → match
  - PUT /api/logs/:id → updateLog workflow → match
  - DELETE /api/logs/:id?confirmed=true → deleteLog workflow → match
  - _Requirements: WF7-10_

- [ ] 6. 統計ワークフローと API の実装
- [ ] 6.1 統計ワークフローの実装（GetDashboardStats）
  - getDailySummary: 本日の全猫サマリー取得
  - getChartData: 期間別・猫別のチャートデータ取得
  - 日別・週別・月別の集計ロジック
  - 排尿・排便の区別した集計
  - ResultAsync<T, DomainError> を返す
  - _Requirements: WF11_

- [ ] 6.2 統計 API ルートの実装
  - GET /api/stats/summary → getDailySummary workflow → match
  - GET /api/stats/chart?catId&period&from&to → getChartData workflow → match
  - _Requirements: WF11_

- [ ] 7. フロントエンド基盤構築
- [ ] 7.1 apps/web の初期化と React + Vite セットアップ
  - apps/web パッケージを作成
  - Vite + React + TypeScript の設定
  - Tailwind CSS と shadcn/ui のセットアップ
  - Hono Client (hc) の設定と AppType の型インポート
  - _Requirements: NFR1_

- [ ] 7.2 TanStack Query と API クライアントの設定
  - TanStack Query v5 のプロバイダー設定
  - Hono RPC クライアントの初期化
  - 共通のエラーハンドリング設定
  - DomainError のフロントエンド表示ヘルパー
  - _Requirements: N/A（インフラ基盤）_

- [ ] 7.3 Clerk 認証 UI の統合
  - @clerk/clerk-react のセットアップ
  - ClerkProvider の設定
  - ログインページとサインインコンポーネント
  - 認証状態に応じたルーティング（ProtectedRoute）
  - ヘッダーにログアウトボタンを配置
  - _Requirements: WF1, WF2_

- [ ] 8. 猫管理 UI の実装
- [ ] 8.1 猫一覧・登録画面の実装
  - 猫一覧ページ（CatsPage）の作成
  - 猫カード コンポーネント（名前、写真、基本情報表示）
  - 猫登録フォーム（名前必須、オプション項目）
  - 画像アップロード UI
  - バリデーションエラーの表示
  - _Requirements: WF3, WF6_

- [ ] 8.2 猫編集・削除機能の実装
  - 猫編集フォーム
  - 削除確認ダイアログ
  - 削除時の関連データ削除の警告表示
  - ConfirmationRequired エラーのハンドリング
  - _Requirements: WF4, WF5_

- [ ] 9. トイレ記録 UI の実装
- [ ] 9.1 クイック記録フォームの実装
  - トイレ記録追加フォーム（LogForm）
  - 猫選択ドロップダウン
  - 排尿/排便のトグルボタン
  - 日時ピッカー（デフォルト現在時刻）
  - メモ入力欄（オプション）
  - 保存成功時のトースト通知
  - バリデーションエラーの表示
  - _Requirements: WF7_

- [ ] 9.2 記録履歴ページの実装
  - 履歴一覧ページ（HistoryPage）
  - 時系列での記録表示
  - 猫・期間・種類でのフィルタリング UI
  - ページネーション
  - 記録の編集・削除機能
  - _Requirements: WF8, WF9, WF10_

- [ ] 10. ダッシュボード UI の実装
- [ ] 10.1 ダッシュボードサマリーの実装
  - ダッシュボードページ（DashboardPage）
  - 本日の全猫トイレ回数サマリー表示
  - 猫ごとの排尿・排便回数カード
  - _Requirements: WF11_

- [ ] 10.2 統計グラフの実装
  - Recharts による折れ線グラフ（動的インポート）
  - 期間セレクター（日別/週別/月別）
  - 猫選択による詳細統計表示
  - _Requirements: WF11_

- [ ] 11. レスポンシブ対応とオフライン通知
- [ ] 11.1 モバイル最適化
  - 全ページのモバイルレスポンシブ対応
  - タッチ操作に最適化したUI調整
  - クイック記録ボタンのモバイル配置
  - _Requirements: NFR1_

- [ ] 11.2 オフライン状態の通知
  - ネットワーク状態の検知
  - オフライン時のバナー表示
  - _Requirements: NFR2_

- [ ] 12. 本番デプロイ設定
- [ ] 12.1 Cloudflare リソースのセットアップ
  - D1 データベースの作成（本番環境）
  - R2 バケットの作成
  - 環境変数とシークレットの設定
  - _Requirements: N/A（インフラ基盤）_

- [ ] 12.2 GitHub Actions デプロイワークフローの構築
  - .github/workflows/deploy.yml の作成
  - main ブランチマージ時の自動デプロイ
  - Workers と Pages の両方をデプロイ
  - _Requirements: N/A（インフラ基盤）_

- [ ] 13. 統合テストと最終確認
- [ ] 13.1 E2E テストの実装
  - Playwright のセットアップ
  - ログイン → ダッシュボード表示のテスト
  - 猫登録 → トイレ記録 → 統計確認のフローテスト
  - エラーケースのテスト（バリデーション、NotFound）
  - _Requirements: WF1-11_

- [ ] 13.2 全機能の統合確認
  - 全 API エンドポイントの動作確認
  - 認証フローの E2E 確認
  - モバイル・デスクトップでの表示確認
  - _Requirements: All_

---

## Requirements Coverage (Workflow-based)

| Workflow | Tasks |
|----------|-------|
| WF1 AuthenticateUser | 3.3, 7.3, 13.1 |
| WF2 TerminateSession | 3.3, 7.3 |
| WF3 RegisterCat | 2.1, 2.2, 4.1, 4.2, 4.3, 4.4, 8.1 |
| WF4 UpdateCat | 2.1, 2.2, 4.1, 4.2, 4.3, 8.2 |
| WF5 DeleteCat | 2.1, 4.1, 4.2, 4.3, 8.2 |
| WF6 ListCats | 2.1, 4.1, 4.2, 4.3, 8.1 |
| WF7 AddToiletLog | 2.1, 2.2, 5.1, 5.2, 5.3, 9.1 |
| WF8 UpdateToiletLog | 2.1, 2.2, 5.1, 5.2, 5.3, 9.2 |
| WF9 DeleteToiletLog | 2.1, 5.1, 5.2, 5.3, 9.2 |
| WF10 GetToiletHistory | 2.2, 5.1, 5.2, 5.3, 9.2 |
| WF11 GetDashboardStats | 2.2, 6.1, 6.2, 10.1, 10.2 |
| NFR1 Responsive | 7.1, 11.1 |
| NFR2 Offline Notice | 11.2 |

---

## Architecture Notes

### Railway Oriented Programming Pattern
各ワークフローは以下のパターンで実装:
1. 入力を `validateInput()` で検証 → `ResultAsync<ValidatedInput, DomainError>`
2. `andThen()` で次のステップへチェーン（エラー時は自動短絡評価）
3. ルートハンドラで `match()` を使って HTTP レスポンスに変換

### Layer Structure
```
Routes (Hono) → Workflows (neverthrow) → Repositories → D1/R2
              ↓
          handleDomainError → HTTP Response
```
