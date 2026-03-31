# SÉRAINE（セレーヌ）— プロジェクトルール

## プロジェクト概要
高級スキンケアECサイト（ポートフォリオ用）
技術スタック: Next.js 15 (App Router) + TypeScript + Supabase + Stripe + Cloudflare Pages + Resend + Tailwind CSS

## ハーネス構成
大規模構成: Planner + Generator + Evaluator（3役割）
起動パターン: 時間差合流

## セキュリティプロファイル
**選定: Tier 4 — Commerce（低リスク：22項目適用）**
判定理由: Stripe決済あり。ポートフォリオ目的（テストモード運用）のため低リスク。

### 適用項目
S-01〜S-28 のうち以下22項目を適用:
- S-01: .gitignore設定
- S-02: ソースコード内シークレット検索
- S-03: GitLeaks
- S-04: XSS基本対策
- S-06: DBセキュリティルール（RLS）
- S-07: データ型バリデーション（zod）
- S-08: 入力バリデーション（フロント）
- S-09: 入力バリデーション（サーバー）
- S-10: npm audit
- S-11: SQLインジェクション対策
- S-12: エラーハンドリング情報漏洩防止
- S-13: RLS（行レベルセキュリティ）
- S-14: Middleware認証チェック
- S-15: セッション管理
- S-16: ロールベース制御
- S-19: CSRF対策
- S-21: Webhook署名検証
- S-22: 決済APIキー秘匿
- S-23: 冪等性（二重処理防止）
- S-24: テスト/本番キー分離
- S-27: サーバーサイド権限チェック
- S-28: 環境変数管理

## デザイン判断

### Tone
**serene-elegance（穏やかな気品）** — 白とゴールドを基調に、余白で呼吸する上品なデザイン。商品が主役。

### Differentiation
「開いた瞬間にブランドの世界観に引き込まれ、3タップで購入完了する」

### 5軸デザイン判断
- **Typography**: Cormorant Garamond（見出し）+ Inter（価格・数字）+ Noto Sans JP（本文）
- **Color**: Soft White #FAFAF8 / Deep Charcoal #1A1A1A / Champagne Gold #C9A96E / Blush Pink #E8D5D0
- **Motion**: カートに追加時のみ上品なフェードイン。スクロールアニメーション禁止
- **Spatial**: 余白を広くとる（セクション間80px以上、商品カード内padding 32px以上）
- **Texture**: 背景は白〜淡いベージュ。商品写真が高級感の核

### AIスロップ排除ルール
- 紫グラデーション禁止
- rounded-2xl以上の角丸禁止（rounded-lg = 8pxまで）
- 3カラム均一カードレイアウト禁止（非対称を使う）
- 「Welcome to...」的なヒーローセクション禁止
- 意味のないアイコン羅列禁止
- グラデーションボタン禁止（ソリッドカラーのみ）
- パーティクル・星空・浮遊要素禁止

## デプロイ先
Cloudflare Pages（仕様書指定・商用利用可能・無料）

## Phase分割

### Phase 0: 計画・DB設計 ✅
### Phase 1: 基盤構築（認証・DB・RLS・Cloudflare設定）
### Phase 2: トップページ + 商品一覧 + 商品詳細 + カート
### Phase 3: 注文フロー + 決済 + メール通知
### Phase 4: 管理画面
### Phase 5: デザイン仕上げ・セキュリティ・デプロイ後テスト

## DB設計（Supabase PostgreSQL）

### テーブル
- profiles: id(uuid,PK,FK→auth.users), role(text:admin/customer), full_name, phone, created_at
- categories: id(uuid,PK), name, slug, sort_order, created_at
- products: id(uuid,PK), name, price(integer,円), description, ingredients, image_urls(text[]), stock(integer), category_id(FK→categories), is_active(boolean), created_at
- cart_items: id(uuid,PK), user_id(FK→profiles), product_id(FK→products), quantity(integer), created_at
- orders: id(uuid,PK), user_id(FK→profiles), total(integer), status(text:pending/confirmed/shipped/delivered/cancelled), shipping_name, shipping_postal_code, shipping_address, shipping_phone, shipping_fee(integer), created_at
- order_items: id(uuid,PK), order_id(FK→orders), product_id(FK→products), quantity(integer), price(integer), created_at
- order_payments: id(uuid,PK), order_id(FK→orders), stripe_session_id(text), amount(integer), status(text:pending/paid/failed/refunded), created_at
- reviews: id(uuid,PK), product_id(FK→products), user_id(FK→profiles), rating(integer,1-5), comment(text), created_at
- site_settings: id(uuid,PK), key(text,unique), value(jsonb), updated_at

## スコア記録
Phase 1 評価: 104点/118点（機能30/エラー20/デザイン16/独創性12/レスポンシブ14/セキュリティ12）→ 合格。Phase 2へ
Phase 2 評価: 100点/118点（機能28/エラー15/デザイン17/独創性12/レスポンシブ14/セキュリティ14）→ 合格。Phase 3へ
  指摘: getProductImage境界エラー修正要、/loginの500エラー修正要
Phase 3 評価: 104点/118点（機能28/エラー18/デザイン17/独創性12/レスポンシブ14/セキュリティ15）→ 合格。Phase 4へ
  指摘: Webhook用Supabaseクライアントのservice_role化をPhase 5で対応
Phase 4 評価: 107点/118点（機能28/エラー19/デザイン17/独創性13/レスポンシブ14/セキュリティ16）→ 合格。Phase 5へ

## 管理者ユーザー作成方法

Supabase SQL Editorで以下を実行して、既存ユーザーを管理者に昇格:
```sql
-- メールアドレスで対象ユーザーのIDを確認
SELECT id, email FROM auth.users WHERE email = 'your-admin@example.com';

-- profilesテーブルのroleをadminに変更
UPDATE profiles SET role = 'admin' WHERE id = '取得したユーザーID';
```

新規に管理者を作成する場合:
1. /register でアカウントを作成
2. 上記SQLでroleを'admin'に変更
3. /admin にアクセス可能になる

## ディレクトリ構成
```
src/
├── app/
│   ├── (public)/        # 未ログインでアクセス可能（トップ、商品一覧、商品詳細）
│   ├── (auth)/          # 認証ページ（ログイン、登録）
│   ├── (member)/        # 会員専用（カート、チェックアウト、マイページ）
│   ├── (admin)/         # 管理画面
│   └── api/             # APIルート（Stripe Webhook等）
├── components/          # 共通UIコンポーネント
├── lib/
│   ├── supabase/        # Supabaseクライアント
│   ├── stripe/          # Stripe関連
│   └── utils/           # 共通ユーティリティ
└── types/               # 型定義
```
