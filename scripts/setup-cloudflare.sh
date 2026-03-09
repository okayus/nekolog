#!/usr/bin/env bash
set -euo pipefail

# NekoLog - Cloudflare リソースセットアップスクリプト
# 本番環境の D1 データベースと R2 バケットを作成し、wrangler.jsonc を更新します。
#
# 前提条件:
#   - wrangler がインストール済み (`pnpm add -g wrangler` or npx)
#   - `wrangler login` で認証済み
#
# 使い方:
#   ./scripts/setup-cloudflare.sh

WRANGLER_CONFIG="apps/api/wrangler.jsonc"

echo "=== NekoLog Cloudflare リソースセットアップ ==="
echo ""

# 1. D1 データベースの作成
echo "[1/4] D1 データベースを作成中..."
D1_OUTPUT=$(npx wrangler d1 create nekolog-db 2>&1) || {
  if echo "$D1_OUTPUT" | grep -q "already exists"; then
    echo "  → nekolog-db は既に存在します。スキップ。"
    echo "  → 既存の database_id を wrangler.jsonc に手動で設定してください。"
  else
    echo "  → エラー: $D1_OUTPUT"
    exit 1
  fi
}

# database_id を抽出
DATABASE_ID=$(echo "$D1_OUTPUT" | grep -oP 'database_id\s*=\s*"\K[^"]+' || true)
if [ -n "$DATABASE_ID" ]; then
  echo "  → Database ID: $DATABASE_ID"
  echo "  → wrangler.jsonc の production.d1_databases.database_id を更新してください："
  echo "     \"database_id\": \"$DATABASE_ID\""
fi
echo ""

# 2. R2 バケットの作成
echo "[2/4] R2 バケットを作成中..."
R2_OUTPUT=$(npx wrangler r2 bucket create nekolog-images 2>&1) || {
  if echo "$R2_OUTPUT" | grep -q "already exists"; then
    echo "  → nekolog-images は既に存在します。スキップ。"
  else
    echo "  → エラー: $R2_OUTPUT"
    exit 1
  fi
}
echo "  → R2 バケット 'nekolog-images' 作成完了"
echo ""

# 3. D1 マイグレーション適用
echo "[3/4] D1 マイグレーションを適用中..."
echo "  → 以下のコマンドで本番 D1 にマイグレーションを適用してください："
echo "     npx wrangler d1 migrations apply nekolog-db --remote"
echo ""

# 4. シークレットの設定案内
echo "[4/4] シークレットの設定"
echo "  → 以下のコマンドでシークレットを設定してください："
echo "     npx wrangler secret put CLERK_SECRET_KEY"
echo "     npx wrangler secret put CLERK_PUBLISHABLE_KEY"
echo ""

echo "=== セットアップ手順まとめ ==="
echo ""
echo "1. wrangler.jsonc の production 環境に database_id を設定"
echo "   → \"database_id\": \"$DATABASE_ID\""
echo ""
echo "2. PUBLIC_BUCKET_URL を本番の R2 公開 URL に更新"
echo "   → R2 カスタムドメインまたは Workers 経由の URL"
echo ""
echo "3. マイグレーション適用:"
echo "   npx wrangler d1 migrations apply nekolog-db --remote"
echo ""
echo "4. シークレット設定:"
echo "   npx wrangler secret put CLERK_SECRET_KEY"
echo "   npx wrangler secret put CLERK_PUBLISHABLE_KEY"
echo ""
echo "5. デプロイ:"
echo "   npx wrangler deploy --env production"
echo ""
echo "=== 完了 ==="
