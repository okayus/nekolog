# Requirements Document

## Introduction
本ドキュメントは、飼い猫のトイレ利用状況を記録・管理するWebアプリケーション「NekoLog」の要件を定義します。Domain Modeling Made Functional のアプローチに基づき、ワークフロー駆動で要件を定義しています。

**将来の拡張予定**: ご飯のカロリー計算機能、体重トラッキング、健康アラート

## Scope
- ✅ **実装対象**: トイレログ機能（認証、猫管理、トイレ記録、ダッシュボード）
- ⏳ **将来対応**: ご飯・カロリー計算機能

---

## Bounded Contexts

### 1. Authentication Context（認証コンテキスト）
外部サービス（Clerk）に委譲。ユーザー新規作成は管理者のみ。

### 2. Cat Management Context（猫管理コンテキスト）
猫のライフサイクル管理。登録・更新・削除を担当。

### 3. Toilet Tracking Context（トイレ記録コンテキスト）
トイレ記録のCRUDと統計集計を担当。

---

## Domain Events

| Context | Event | Description |
|---------|-------|-------------|
| Authentication | `UserLoggedIn` | ユーザーが正常にログインした |
| Authentication | `UserLoggedOut` | ユーザーがログアウトした |
| Authentication | `LoginFailed` | ログインに失敗した |
| CatManagement | `CatRegistered` | 新しい猫が登録された |
| CatManagement | `CatUpdated` | 猫の情報が更新された |
| CatManagement | `CatDeleted` | 猫が削除された（関連記録も削除） |
| ToiletTracking | `ToiletLogAdded` | トイレ記録が追加された |
| ToiletTracking | `ToiletLogUpdated` | トイレ記録が更新された |
| ToiletTracking | `ToiletLogDeleted` | トイレ記録が削除された |

---

## Workflows

### Workflow 1: AuthenticateUser（ユーザー認証）
**Context:** Authentication
**Trigger:** ユーザーがログインを試行する

```
Command: LoginCommand
  → Input: Credentials (email, password)
  → Workflow: AuthenticateUser
  → Output: UserLoggedIn | LoginFailed
```

#### Acceptance Criteria
1. When ユーザーがログインページにアクセスする, the NekoLog shall ログインフォームを表示する
2. When 有効な認証情報が入力される, the NekoLog shall `UserLoggedIn`イベントを発行しダッシュボードにリダイレクトする
3. If 無効な認証情報が入力された, then the NekoLog shall `LoginFailed`イベントを発行しエラーメッセージを表示する
4. When 認証されていないユーザーが保護されたページにアクセスする, the NekoLog shall ログインページにリダイレクトする
5. The NekoLog shall ユーザー新規作成機能を提供しない（管理者による事前登録のみ）

### Workflow 2: TerminateSession（セッション終了）
**Context:** Authentication
**Trigger:** ユーザーがログアウトする

```
Command: LogoutCommand
  → Input: AuthenticatedUserId
  → Workflow: TerminateSession
  → Output: UserLoggedOut
```

#### Acceptance Criteria
1. When ユーザーがログアウトを実行する, the NekoLog shall `UserLoggedOut`イベントを発行する
2. When セッションが終了する, the NekoLog shall ログインページに戻る

---

### Workflow 3: RegisterCat（猫の登録）
**Context:** CatManagement
**Trigger:** ユーザーが新しい猫を登録する

```
Command: RegisterCatCommand
  → Input: UnvalidatedCat { name: string, birthDate?: Date, breed?: string, weight?: number, photo?: File }
  → Workflow: ValidateAndRegisterCat
    1. ValidateCatName (name is required, non-empty)
    2. ValidateOptionalFields (birthDate, breed, weight format)
    3. UploadPhoto (if provided) → photoUrl
    4. CreateCat → Cat
  → Output: CatRegistered | ValidationFailed
```

#### Acceptance Criteria
1. When ユーザーが猫登録フォームを送信する, the NekoLog shall `ValidateAndRegisterCat`ワークフローを実行する
2. The NekoLog shall 猫の名前を必須項目として検証する（空文字不可）
3. The NekoLog shall オプション項目（生年月日、品種、体重、写真）を検証する
4. If バリデーションが成功した, then the NekoLog shall `CatRegistered`イベントを発行する
5. If バリデーションが失敗した, then the NekoLog shall `ValidationFailed`を返しエラー詳細を表示する

### Workflow 4: UpdateCat（猫の更新）
**Context:** CatManagement
**Trigger:** ユーザーが猫の情報を編集する

```
Command: UpdateCatCommand
  → Input: { catId: CatId, changes: Partial<UnvalidatedCat> }
  → Workflow: ValidateAndUpdateCat
    1. FindCat (catId) → Cat | NotFound
    2. ValidateChanges
    3. ApplyChanges → UpdatedCat
  → Output: CatUpdated | NotFound | ValidationFailed
```

#### Acceptance Criteria
1. When ユーザーが猫の編集フォームを送信する, the NekoLog shall `ValidateAndUpdateCat`ワークフローを実行する
2. If 猫が存在しない, then the NekoLog shall `NotFound`エラーを返す
3. If バリデーションが成功した, then the NekoLog shall `CatUpdated`イベントを発行する

### Workflow 5: DeleteCat（猫の削除）
**Context:** CatManagement
**Trigger:** ユーザーが猫を削除する

```
Command: DeleteCatCommand
  → Input: { catId: CatId, confirmed: boolean }
  → Workflow: ConfirmAndDeleteCat
    1. RequireConfirmation (confirmed must be true)
    2. FindCat (catId) → Cat | NotFound
    3. DeleteRelatedLogs (catId)
    4. DeleteCat (catId)
  → Output: CatDeleted | NotFound | ConfirmationRequired
```

#### Acceptance Criteria
1. When ユーザーが猫の削除を要求する, the NekoLog shall 確認ダイアログを表示する
2. If 確認されていない, then the NekoLog shall `ConfirmationRequired`を返す
3. When 確認後に削除を実行する, the NekoLog shall 関連するすべてのトイレ記録も削除する
4. When 削除が完了する, the NekoLog shall `CatDeleted`イベントを発行する

### Workflow 6: ListCats（猫一覧取得）
**Context:** CatManagement
**Trigger:** ユーザーが猫一覧を表示する

```
Query: ListCatsQuery
  → Input: { userId: UserId }
  → Workflow: GetUserCats
  → Output: Cat[]
```

#### Acceptance Criteria
1. When ユーザーが猫一覧ページにアクセスする, the NekoLog shall ユーザーに紐づく全ての猫を返す
2. The NekoLog shall 猫ごとに名前、写真、基本情報を表示する

---

### Workflow 7: AddToiletLog（トイレ記録追加）
**Context:** ToiletTracking
**Trigger:** ユーザーがトイレ記録を追加する

```
Command: AddToiletLogCommand
  → Input: UnvalidatedToiletLog { catId: CatId, type: ToiletType, timestamp?: DateTime, note?: string }
  → Workflow: ValidateAndAddLog
    1. ValidateCatExists (catId) → Cat | NotFound
    2. ValidateToiletType (type ∈ { "urine", "feces" })
    3. SetTimestamp (default: now)
    4. CreateLog → ToiletLog
  → Output: ToiletLogAdded | NotFound | ValidationFailed
```

#### Acceptance Criteria
1. When ユーザーがトイレ記録を追加する, the NekoLog shall 対象の猫を選択させる
2. The NekoLog shall トイレの種類（`urine`/`feces`）を必須とする
3. The NekoLog shall 記録日時をデフォルトで現在時刻に設定し、手動変更も可能とする
4. The NekoLog shall メモ（任意）を記録できる
5. If 記録が保存される, then the NekoLog shall `ToiletLogAdded`イベントを発行し成功メッセージを表示する

### Workflow 8: UpdateToiletLog（トイレ記録更新）
**Context:** ToiletTracking
**Trigger:** ユーザーがトイレ記録を編集する

```
Command: UpdateToiletLogCommand
  → Input: { logId: LogId, changes: Partial<UnvalidatedToiletLog> }
  → Workflow: ValidateAndUpdateLog
    1. FindLog (logId) → ToiletLog | NotFound
    2. ValidateChanges
    3. ApplyChanges → UpdatedLog
  → Output: ToiletLogUpdated | NotFound | ValidationFailed
```

#### Acceptance Criteria
1. When ユーザーがトイレ記録を編集する, the NekoLog shall 既存の記録を更新する
2. If 記録が存在しない, then the NekoLog shall `NotFound`エラーを返す
3. If 更新が成功する, then the NekoLog shall `ToiletLogUpdated`イベントを発行する

### Workflow 9: DeleteToiletLog（トイレ記録削除）
**Context:** ToiletTracking
**Trigger:** ユーザーがトイレ記録を削除する

```
Command: DeleteToiletLogCommand
  → Input: { logId: LogId, confirmed: boolean }
  → Workflow: ConfirmAndDeleteLog
    1. RequireConfirmation
    2. FindLog (logId) → ToiletLog | NotFound
    3. DeleteLog
  → Output: ToiletLogDeleted | NotFound | ConfirmationRequired
```

#### Acceptance Criteria
1. When ユーザーが記録の削除を要求する, the NekoLog shall 確認を求める
2. When 確認後に削除を実行する, the NekoLog shall `ToiletLogDeleted`イベントを発行する

### Workflow 10: GetToiletHistory（トイレ履歴取得）
**Context:** ToiletTracking
**Trigger:** ユーザーが履歴ページにアクセスする

```
Query: GetToiletHistoryQuery
  → Input: { userId: UserId, filters: HistoryFilters, pagination: Pagination }
  → HistoryFilters: { catId?: CatId, type?: ToiletType, dateRange?: DateRange }
  → Pagination: { page: number, limit: number }
  → Workflow: FilterAndPaginateLogs
  → Output: { logs: ToiletLog[], total: number, page: number }
```

#### Acceptance Criteria
1. When ユーザーが履歴ページにアクセスする, the NekoLog shall 最新の記録から時系列で一覧表示する
2. The NekoLog shall 猫ごとにフィルタリングできる
3. The NekoLog shall 期間でフィルタリングできる
4. The NekoLog shall トイレの種類（`urine`/`feces`）でフィルタリングできる
5. When 記録が多数存在する, the NekoLog shall ページネーションを提供する

### Workflow 11: GetDashboardStats（ダッシュボード統計取得）
**Context:** ToiletTracking
**Trigger:** ユーザーがダッシュボードにアクセスする

```
Query: GetDashboardStatsQuery
  → Input: { userId: UserId, period: Period }
  → Period: "today" | "week" | "month"
  → Workflow: AggregateLogs
    1. GetUserCats → Cat[]
    2. For each cat: AggregateByType (urine, feces)
    3. GroupByPeriod (daily | weekly | monthly)
  → Output: DashboardStats { summary: CatSummary[], chartData: ChartDataPoint[] }
```

#### Acceptance Criteria
1. When ユーザーがダッシュボードにアクセスする, the NekoLog shall 全猫の本日のトイレ回数サマリーを表示する
2. The NekoLog shall 猫ごとのトイレ回数を日別・週別・月別で集計できる
3. The NekoLog shall 排尿(`urine`)と排便(`feces`)の回数を区別して表示する
4. When ユーザーが期間を選択する, the NekoLog shall 指定期間のデータを表示する
5. When ユーザーが特定の猫を選択する, the NekoLog shall その猫の詳細統計を表示する
6. The NekoLog shall グラフ形式でトイレ頻度の推移を視覚化する

---

## Domain Types

### Value Objects

```typescript
// Branded types for type safety
type UserId = string & { readonly brand: unique symbol }
type CatId = string & { readonly brand: unique symbol }
type LogId = string & { readonly brand: unique symbol }

// Constrained types
type NonEmptyString = string & { readonly brand: unique symbol }
type ToiletType = "urine" | "feces"
type Period = "today" | "week" | "month"

// Date range
type DateRange = { start: Date, end: Date }
```

### Entities

```typescript
type Cat = {
  id: CatId
  userId: UserId
  name: NonEmptyString
  birthDate: Date | null
  breed: string | null
  weight: number | null
  photoUrl: string | null
  createdAt: Date
  updatedAt: Date
}

type ToiletLog = {
  id: LogId
  catId: CatId
  userId: UserId
  type: ToiletType
  timestamp: Date
  note: string | null
  createdAt: Date
  updatedAt: Date
}
```

### Workflow Results (Result Types)

```typescript
// Success or failure
type Result<T, E> = { success: true, data: T } | { success: false, error: E }

// Common errors
type ValidationError = { type: "validation", field: string, message: string }
type NotFoundError = { type: "not_found", resource: string, id: string }
type ConfirmationRequiredError = { type: "confirmation_required" }
```

---

## Non-Functional Requirements

### NFR 1: レスポンシブデザイン
1. The NekoLog shall モバイルデバイスに最適化されたUIを提供する
2. The NekoLog shall デスクトップとモバイルの両方で適切に表示される
3. The NekoLog shall トイレ記録追加を素早く行えるUIを提供する

### NFR 2: オフライン通知
1. While オフライン状態, the NekoLog shall オフラインであることをユーザーに通知する

---

## Future Requirements (Out of Scope)
以下の機能は将来のフェーズで実装予定です：

- **ご飯・カロリー計算機能**: 猫の食事記録とカロリー管理
- **体重トラッキング**: 体重の推移グラフ
- **健康アラート**: 異常パターンの検知と通知
