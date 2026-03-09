# NekoLog 本番環境セットアップ手順

## 概要

NekoLog API（Cloudflare Workers）を本番環境にデプロイするための手順書です。
各ステップに「コマンド実行」か「ブラウザ操作」かを明記しています。

## 前提条件

- Node.js 20 以上
- pnpm インストール済み
- `pnpm install` 実行済み

---

## Step 1: Wrangler 認証

### 🖥️ コマンド → 🌐 ブラウザ

```bash
npx wrangler login
```

ブラウザが開くので Cloudflare アカウントで認証してください。

確認:
```bash
npx wrangler whoami
```

---

## Step 2: D1 データベース作成

### 🖥️ コマンド

```bash
# D1 データベース作成
npx wrangler d1 create nekolog-db
```

出力される `database_id` を控えてください。

`apps/api/wrangler.jsonc` の `env.production.d1_databases[0].database_id` に設定します:

```jsonc
"database_id": "取得した database_id"
```

> **現在の設定値**: `dd8a7f08-831a-4f09-9b89-14db4e545ccf`（作成済み）

---

## Step 3: D1 マイグレーション適用

### 🖥️ コマンド

```bash
cd apps/api
npx wrangler d1 migrations apply nekolog-db --remote --env production
```

users, cats, toilet_logs テーブルが作成されます。

---

## Step 4: R2 有効化とバケット作成

### 🌐 ブラウザ（初回のみ）

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン
2. 左メニュー「**R2 Object Storage**」をクリック
3. プランを有効化（Free プランあり）

### 🖥️ コマンド

```bash
npx wrangler r2 bucket create nekolog-images
```

> **ステータス**: 作成済み

---

## Step 5: Clerk シークレット設定

### 🌐 ブラウザ

1. [Clerk Dashboard](https://dashboard.clerk.com/) にログイン
2. NekoLog アプリケーションを選択
3. 「**API Keys**」から以下をコピー:
   - **Secret key** (`sk_test_...` または `sk_live_...`)
   - **Publishable key** (`pk_test_...` または `pk_live_...`)

### 🖥️ コマンド

```bash
cd apps/api

# Secret Key を設定（プロンプトに値をペースト）
npx wrangler secret put CLERK_SECRET_KEY --env production

# Publishable Key を設定（プロンプトに値をペースト）
npx wrangler secret put CLERK_PUBLISHABLE_KEY --env production
```

> **現在の状態**: 開発用キー（`sk_test_...` / `pk_test_...`）で設定済み。本番用キーへの差し替えは Step 8 参照。

---

## Step 6: Workers デプロイ

### 🖥️ コマンド

```bash
cd apps/api
npx wrangler deploy --env production
```

デプロイ完了後に表示される URL が API のエンドポイントです:

```
https://nekolog-api-production.{account-subdomain}.workers.dev
```

> **現在のURL**: `https://nekolog-api-production.toshiaki-mukai-9981.workers.dev`

確認:
```bash
curl https://nekolog-api-production.toshiaki-mukai-9981.workers.dev/api/health
# → {"status":"ok","service":"nekolog-api"}
```

---

## Step 7: PUBLIC_BUCKET_URL の設定

R2 バケットの公開 URL が決まったら `apps/api/wrangler.jsonc` を更新してください:

```jsonc
"vars": {
  "PUBLIC_BUCKET_URL": "https://実際のR2公開URL"
}
```

R2 の公開方法は以下のいずれか:

- **R2 カスタムドメイン** 🌐: Cloudflare ダッシュボード → R2 → nekolog-images → Settings → Public access でドメイン設定
- **Workers 経由**: 画像配信用の Workers ルートを作成

更新後に再デプロイ:
```bash
npx wrangler deploy --env production
```

> **現在の状態**: プレースホルダー (`PUBLIC_BUCKET_URL_HERE`) のまま。画像アップロード機能を使うまでに設定が必要。

---

## Step 8: Clerk 本番インスタンスへの切り替え（後日）

### 🌐 ブラウザ

1. [Clerk Dashboard](https://dashboard.clerk.com/) にログイン
2. 左下の環境スイッチャーで「**Production**」を選択
3. 本番インスタンスを作成（ドメイン設定が求められます）
4. Workers の URL をドメインとして設定
5. 「**API Keys**」から本番用キー (`sk_live_...` / `pk_live_...`) をコピー

### 🖥️ コマンド

```bash
cd apps/api

# 本番用キーで上書き
npx wrangler secret put CLERK_SECRET_KEY --env production
npx wrangler secret put CLERK_PUBLISHABLE_KEY --env production
```

---

## 現在の進捗サマリー

| ステップ | 状態 | 操作種別 |
|---------|------|---------|
| Step 1: Wrangler 認証 | ✅ 完了 | コマンド + ブラウザ |
| Step 2: D1 作成 | ✅ 完了 | コマンド |
| Step 3: マイグレーション | ✅ 完了 | コマンド |
| Step 4: R2 有効化・作成 | ✅ 完了 | ブラウザ + コマンド |
| Step 5: Clerk シークレット | ✅ 完了（開発用キー） | ブラウザ + コマンド |
| Step 6: Workers デプロイ | ✅ 完了 | コマンド |
| Step 7: PUBLIC_BUCKET_URL | ⏳ 未設定 | 設定次第 |
| Step 8: Clerk 本番切り替え | ⏳ 後日対応 | ブラウザ + コマンド |
