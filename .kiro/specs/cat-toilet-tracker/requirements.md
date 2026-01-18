# Requirements Document

## Introduction
本ドキュメントは、飼い猫のトイレ利用状況を記録・管理するWebアプリケーション「NekoLog」の要件を定義します。本フェーズではトイレログ機能のみを実装対象とします。複数の猫を登録し、トイレの記録をダッシュボードで可視化することで、飼い主が猫の健康状態を把握できるシステムです。認証機能を備え、許可されたユーザーのみがアクセス可能です。

**将来の拡張予定**: ご飯のカロリー計算機能など

## Scope
- ✅ **実装対象**: トイレログ機能（認証、猫管理、トイレ記録、ダッシュボード）
- ⏳ **将来対応**: ご飯・カロリー計算機能

---

## Requirements

### Requirement 1: 認証・アクセス管理
**Objective:** As a 許可されたユーザー, I want システムにログインしてアクセスを制御できること, so that 許可された人だけがデータにアクセスできる

#### Acceptance Criteria
1. When ユーザーがログインページにアクセスする, the NekoLog shall ログインフォームを表示する
2. When ユーザーが有効な認証情報を入力する, the NekoLog shall ユーザーを認証しダッシュボードにリダイレクトする
3. If 無効な認証情報が入力された, then the NekoLog shall エラーメッセージを表示しログインを拒否する
4. When 認証されていないユーザーが保護されたページにアクセスする, the NekoLog shall ログインページにリダイレクトする
5. When ユーザーがログアウトを実行する, the NekoLog shall セッションを終了しログインページに戻る
6. The NekoLog shall ユーザー新規作成機能を提供しない（管理者による事前登録のみ）

### Requirement 2: 猫の登録・管理
**Objective:** As a ユーザー, I want 複数の猫を登録して管理できること, so that 各猫のトイレ記録を個別に追跡できる

#### Acceptance Criteria
1. When ユーザーが猫の登録フォームを送信する, the NekoLog shall 新しい猫のプロファイルを作成する
2. The NekoLog shall 猫の名前を必須項目として要求する
3. The NekoLog shall 猫の追加情報（生年月日、品種、体重、写真）をオプションで登録できる
4. When ユーザーが猫一覧を表示する, the NekoLog shall 登録されたすべての猫をリスト表示する
5. When ユーザーが猫の情報を編集する, the NekoLog shall 変更内容を保存する
6. When ユーザーが猫を削除する, the NekoLog shall 確認ダイアログを表示し、確認後に猫と関連するすべての記録を削除する

### Requirement 3: トイレ記録の登録
**Objective:** As a ユーザー, I want 猫のトイレ利用を簡単に記録できること, so that トイレの頻度と状態を追跡できる

#### Acceptance Criteria
1. When ユーザーがトイレ記録を追加する, the NekoLog shall 対象の猫を選択させる
2. The NekoLog shall トイレの種類（排尿/排便）を記録できる
3. The NekoLog shall 記録日時を自動で現在時刻に設定し、手動変更も可能とする
4. The NekoLog shall トイレの状態に関するメモ（任意）を記録できる
5. When 記録が保存される, the NekoLog shall 成功メッセージを表示する
6. When ユーザーが記録を編集する, the NekoLog shall 既存の記録を更新する
7. When ユーザーが記録を削除する, the NekoLog shall 確認後に記録を削除する

### Requirement 4: ダッシュボード・統計表示
**Objective:** As a ユーザー, I want トイレ記録の統計をダッシュボードで確認できること, so that 猫の健康状態の傾向を把握できる

#### Acceptance Criteria
1. When ユーザーがダッシュボードにアクセスする, the NekoLog shall 全猫の本日のトイレ回数サマリーを表示する
2. The NekoLog shall 猫ごとのトイレ回数を日別・週別・月別で表示できる
3. The NekoLog shall 排尿と排便の回数を区別して表示する
4. When ユーザーが期間を選択する, the NekoLog shall 指定期間のデータを表示する
5. When ユーザーが特定の猫を選択する, the NekoLog shall その猫の詳細統計を表示する
6. The NekoLog shall グラフ形式でトイレ頻度の推移を視覚化する

### Requirement 5: 記録履歴の閲覧
**Objective:** As a ユーザー, I want 過去のトイレ記録を一覧で確認できること, so that 詳細な履歴を参照できる

#### Acceptance Criteria
1. When ユーザーが履歴ページにアクセスする, the NekoLog shall 最新の記録から時系列で一覧表示する
2. The NekoLog shall 猫ごとにフィルタリングできる
3. The NekoLog shall 期間でフィルタリングできる
4. The NekoLog shall トイレの種類（排尿/排便）でフィルタリングできる
5. When 記録が多数存在する, the NekoLog shall ページネーションを提供する

### Requirement 6: レスポンシブデザイン・UI
**Objective:** As a ユーザー, I want スマートフォンからも快適に操作できること, so that 外出先からでも記録を追加できる

#### Acceptance Criteria
1. The NekoLog shall モバイルデバイスに最適化されたUIを提供する
2. The NekoLog shall デスクトップとモバイルの両方で適切に表示される
3. The NekoLog shall トイレ記録追加を素早く行えるUIを提供する
4. While オフライン状態, the NekoLog shall オフラインであることをユーザーに通知する

---

## Future Requirements (Out of Scope)
以下の機能は将来のフェーズで実装予定です：

- **ご飯・カロリー計算機能**: 猫の食事記録とカロリー管理
- **体重トラッキング**: 体重の推移グラフ
- **健康アラート**: 異常パターンの検知と通知
