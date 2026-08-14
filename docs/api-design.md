# API設計：チーム向けタスク管理システム

> `docs/design-memo.md`（`docs/requirements.md`をもとにした設計決定）に基づき、このアプリに必要な
> APIエンドポイントを設計したもの。第3章の実装時にはこの内容を前提とする。

## 前提

- すべてのエンドポイントはログイン必須。未ログインの場合は一律 `401 Unauthorized`。
- 認証（GitHub OAuth）自体のAPI（`/api/auth/[...nextauth]`）と、動作確認用の`/api/health`は既存実装であり対象外。
- 権限モデルは`docs/design-memo.md`の決定に対応：
  - チームの管理者／一般メンバーは`TeamMembership.role`で判定（決定14.）。
  - プロジェクトの参照・編集は`ProjectMember`であることのみを条件とし、プロジェクト単位のロールは持たない（決定2., 3.）。
  - プロジェクトの削除（アーカイブ）は、そのプロジェクトが属するチームの管理者のみ（決定8., 14.）。
  - タスクの担当者は1人まで、かつそのプロジェクトのメンバーのみ指名可能（決定3.）。担当者・ステータス変更はプロジェクトメンバーなら誰でも可（決定2., 4.）。
  - コメントの作成・編集・削除は、投稿者に限らずプロジェクトメンバーなら誰でも可（決定6.）。
- レスポンス例は主要なフィールドのみを示す（`createdAt`等の型は`string`のISO8601形式）。

## Teams

| メソッド | パス | リクエスト | レスポンス | 想定されるエラー |
|---|---|---|---|---|
| GET | `/api/teams` | なし | `200 { "teams": [{ "id", "name", "role", "createdAt" }] }`（`role`は自分のTeamMembership.role） | `401`：未ログイン |
| POST | `/api/teams` | `{ "name": string }` | `201 { "id", "name", "createdAt" }`（作成者は自動的に`role=ADMIN`で登録） | `400`：`name`が空／文字数超過<br>`401`：未ログイン |
| GET | `/api/teams/:teamId` | なし | `200 { "id", "name", "createdAt", "members": [{ "userId", "name", "role" }] }` | `401`：未ログイン<br>`403`：そのチームのメンバーでない<br>`404`：チームが存在しない |
| PATCH | `/api/teams/:teamId` | `{ "name": string }` | `200 { "id", "name", "updatedAt" }` | `400`：`name`が空<br>`401`：未ログイン<br>`403`：ADMINでない<br>`404`：チームが存在しない |
| POST | `/api/teams/:teamId/members` | `{ "userId": string, "role"?: "ADMIN"\|"MEMBER" }`（省略時`MEMBER`） | `201 { "userId", "role", "createdAt" }` | `400`：`userId`不正<br>`401`：未ログイン<br>`403`：ADMINでない<br>`404`：チーム／ユーザーが存在しない<br>`409`：既にメンバー |
| PATCH | `/api/teams/:teamId/members/:userId` | `{ "role": "ADMIN"\|"MEMBER" }` | `200 { "userId", "role" }` | `400`：`role`不正<br>`401`：未ログイン<br>`403`：ADMINでない<br>`404`：メンバーが存在しない |
| DELETE | `/api/teams/:teamId/members/:userId` | なし | `204` | `401`：未ログイン<br>`403`：ADMINでない（本人の脱退は例外として許可）<br>`404`：メンバーが存在しない<br>`409`：チーム唯一のADMINを除名しようとした |

## Projects

| メソッド | パス | リクエスト | レスポンス | 想定されるエラー |
|---|---|---|---|---|
| GET | `/api/projects?teamId=` | クエリ`teamId`（省略可） | `200 { "projects": [{ "id", "teamId", "name", "description", "archivedAt", "createdAt" }] }`（自分が`ProjectMember`かつアーカイブされていないものだけ。決定8.） | `401`：未ログイン |
| POST | `/api/projects` | `{ "teamId", "name", "description"?: string }` | `201 { "id", "teamId", "name", "description", "createdAt" }`（作成者は自動的に`ProjectMember`登録） | `400`：`name`が空<br>`401`：未ログイン<br>`403`：`teamId`のチームメンバーでない<br>`404`：チームが存在しない |
| GET | `/api/projects/:projectId` | なし | `200 { "id", "teamId", "name", "description", "archivedAt", "createdAt", "updatedAt" }` | `401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：プロジェクトが存在しない |
| PATCH | `/api/projects/:projectId` | `{ "name"?, "description"? }` | `200`（更新後の全フィールド） | `400`：`name`を空文字にしようとした<br>`401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：プロジェクトが存在しない |
| DELETE | `/api/projects/:projectId` | なし（論理削除＝アーカイブ） | `200 { "id", "archivedAt" }` | `401`：未ログイン<br>`403`：所属チームのADMINでない<br>`404`：プロジェクトが存在しない<br>`409`：既にアーカイブ済み |
| GET | `/api/projects/:projectId/members` | なし | `200 { "members": [{ "userId", "name", "image" }] }` | `401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：プロジェクトが存在しない |
| POST | `/api/projects/:projectId/members` | `{ "userId": string }` | `201 { "userId", "createdAt" }` | `400`：`userId`不正<br>`401`：未ログイン<br>`403`：プロジェクトメンバーでない、または対象ユーザーがそのチームに未所属<br>`404`：プロジェクト／ユーザーが存在しない<br>`409`：既にメンバー |
| DELETE | `/api/projects/:projectId/members/:userId` | なし | `204` | `401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：メンバーが存在しない<br>`409`：そのユーザーが担当中のタスクが残っている（先に担当解除が必要） |

## Tasks

| メソッド | パス | リクエスト | レスポンス | 想定されるエラー |
|---|---|---|---|---|
| GET | `/api/projects/:projectId/tasks?status=` | クエリ`status`（省略可） | `200 { "tasks": [{ "id", "title", "status", "tags", "assigneeId", "createdAt" }] }` | `401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：プロジェクトが存在しない |
| POST | `/api/projects/:projectId/tasks` | `{ "title", "description"?, "status"?, "tags"?: string[], "assigneeId"? }` | `201`（作成後の全フィールド） | `400`：`title`が空／`status`が不正な値／`assigneeId`がそのプロジェクトのメンバーでない<br>`401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：プロジェクトが存在しない |
| GET | `/api/tasks/:taskId` | なし | `200`（全フィールド＋コメント件数） | `401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：タスクが存在しない |
| PATCH | `/api/tasks/:taskId` | `{ "title"?, "description"?, "status"?, "tags"?, "assigneeId"? }`（部分更新） | `200`（更新後の全フィールド） | `400`：`title`を空文字にしようとした／`status`が不正／`assigneeId`がそのプロジェクトのメンバーでない<br>`401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：タスクが存在しない |
| DELETE | `/api/tasks/:taskId` | なし | `204` | `401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：タスクが存在しない |

## Comments

| メソッド | パス | リクエスト | レスポンス | 想定されるエラー |
|---|---|---|---|---|
| GET | `/api/tasks/:taskId/comments` | なし | `200 { "comments": [{ "id", "authorId", "authorName", "body", "createdAt", "updatedAt" }] }` | `401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：タスクが存在しない |
| POST | `/api/tasks/:taskId/comments` | `{ "body": string }` | `201`（作成後の全フィールド） | `400`：`body`が空<br>`401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：タスクが存在しない |
| PATCH | `/api/comments/:commentId` | `{ "body": string }` | `200`（更新後の全フィールド） | `400`：`body`が空<br>`401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：コメントが存在しない |
| DELETE | `/api/comments/:commentId` | なし | `204` | `401`：未ログイン<br>`403`：プロジェクトメンバーでない<br>`404`：コメントが存在しない |

## Users（補助エンドポイント）

| メソッド | パス | リクエスト | レスポンス | 想定されるエラー |
|---|---|---|---|---|
| GET | `/api/users?search=` | クエリ`search`（名前／メールの部分一致） | `200 { "users": [{ "id", "name", "email", "image" }] }` | `401`：未ログイン |

チームへの招待やプロジェクトメンバー追加の際に、対象ユーザーを検索するための補助エンドポイント。ログイン済みユーザー全体から検索する（一度でもGitHubログインした人のみが対象）。

## 対象外（既存実装）

| メソッド | パス | 備考 |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | Auth.js（GitHub OAuth）の認証API。実装済み・変更不要。 |
| GET | `/api/health` | 動作確認用エンドポイント。実装済み。 |
| — | `/api/me`相当のもの | 設けていない。ログイン中ユーザー自身の情報はNextAuthの`useSession()`（クライアント側）で取得できるため、重複するAPIは作らない。 |

## 要確認・要注意事項

- **タスクの削除（`DELETE /api/tasks/:taskId`）**：`docs/requirements.md`・`docs/design-memo.md`のどちらにも明記がなかった。プロジェクトの削除・非表示（決定8.）はあるが、タスク単体の削除方針は決まっていないため、暫定でプロジェクトメンバーなら削除可能としている。運用上不要であれば実装しない、または確認フローを挟む変更を検討してほしい。
- **チーム唯一のADMINの除名／脱退**：チームにADMINが1人もいなくなる操作（`DELETE /api/teams/:teamId/members/:userId`）は`409`で拒否する想定にしているが、「最後のADMINが自ら脱退する場合にどうするか」（先に他の誰かをADMINにする必要がある、等）は未確認。
- **担当中タスクが残っているメンバーの削除**：プロジェクトから外そうとしているユーザーが担当者になっているタスクがある場合、`409`で拒否し先に担当解除を求める設計にしたが、「自動的に担当解除してから削除する」という挙動でもよいかは未確認。
