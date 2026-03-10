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

## Step 5: Better Auth シークレット設定

### 🖥️ コマンド

```bash
cd apps/api

# Better Auth のシークレットキーを設定（プロンプトに値をペースト）
npx wrangler secret put BETTER_AUTH_SECRET --env production
```

`BETTER_AUTH_SECRET` には十分に長いランダム文字列を設定してください（例: `openssl rand -base64 32` で生成）。

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

## Step 8: Pages 環境変数の設定

### 🌐 ブラウザ

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン
2. 左メニュー「**Workers & Pages**」→ nekolog プロジェクトを選択
3. 「**Settings**」→「**Environment variables**」
4. Production 環境に以下を設定:

| 変数名 | 値 | 説明 |
|--------|---|------|
| `API_WORKER_URL` | `https://nekolog-api-production.{subdomain}.workers.dev` | Workers API の URL |

この環境変数は Pages Functions proxy が Workers API にリクエストを転送するために使用します。

---

## Step 9: GitHub Actions 自動デプロイ（CI/CD）

### 🌐 ブラウザ（GitHub リポジトリ設定）

以下のシークレットを GitHub リポジトリの Settings → Secrets and variables → Actions に登録してください：

| シークレット名 | 値 | 説明 |
|--------------|---|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン | Workers/Pages デプロイ用 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID | `wrangler whoami` で確認可能 |

### Cloudflare API トークンの作成手順

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → 右上のプロフィール → 「**My Profile**」
2. 左メニュー「**API Tokens**」→「**Create Token**」
3. 「**Edit Cloudflare Workers**」テンプレートを選択
4. 権限に以下を追加：
   - Account / Cloudflare Pages / Edit
   - Account / D1 / Edit
   - Account / R2 / Edit
5. トークンを作成し、GitHub シークレットに登録

### 動作

`main` ブランチへの push 時に自動で以下が実行されます：

1. **CI ジョブ**: typecheck → test → build
2. **deploy-api ジョブ**: CI 成功後、Workers を `--env production` でデプロイ
3. **deploy-web ジョブ**: CI 成功後、Pages にフロントエンドをデプロイ

---

## 現在の進捗サマリー

| ステップ | 状態 | 操作種別 |
|---------|------|---------|
| Step 1: Wrangler 認証 | ✅ 完了 | コマンド + ブラウザ |
| Step 2: D1 作成 | ✅ 完了 | コマンド |
| Step 3: マイグレーション | ✅ 完了 | コマンド |
| Step 4: R2 有効化・作成 | ✅ 完了 | ブラウザ + コマンド |
| Step 5: Better Auth シークレット | ⏳ 設定が必要 | コマンド |
| Step 6: Workers デプロイ | ✅ 完了 | コマンド |
| Step 7: PUBLIC_BUCKET_URL | ⏳ 未設定 | 設定次第 |
| Step 8: Pages 環境変数 | ⏳ API_WORKER_URL の設定が必要 | ブラウザ |
| Step 9: GitHub Actions CI/CD | ⏳ シークレット登録が必要 | ブラウザ |
