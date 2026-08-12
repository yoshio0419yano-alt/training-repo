// 第4章（品質保証と外部連携）のデバッグ演習用モジュールです。
// このファイル単体では意図的に「一見動いていそうだが、特定の条件で壊れる」
// バグを仕込んであります。中身は演習中にClaude Codeと一緒に読んで構いません。

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assigneeId: string | null;
}

/**
 * 複数のタスクのステータスを一括更新する。
 * 例: プロジェクト画面で「進行中のタスクをまとめて完了にする」機能から呼ばれる想定。
 */
export function bulkUpdateStatus(
  tasks: Task[],
  targetIds: string[],
  newStatus: TaskStatus
): Task[] {
  const targets = tasks.filter((t) => targetIds.includes(t.id));

  // 一見問題なさそうだが、対象タスクのオブジェクトを直接書き換えている。
  // tasks配列自体は同じオブジェクト参照を持つ要素を含んでいるため、
  // 呼び出し元が保持している「更新前のタスク一覧」まで書き換わってしまう。
  targets.forEach((t) => {
    t.status = newStatus;
  });

  return tasks;
}
