import { describe, it, expect } from "vitest";
import { bulkUpdateStatus, type Task } from "../src/taskStatus";

function makeTasks(): Task[] {
  return [
    { id: "t1", title: "設計する", status: "todo", assigneeId: "u1" },
    { id: "t2", title: "実装する", status: "in_progress", assigneeId: "u1" },
    { id: "t3", title: "レビューする", status: "in_progress", assigneeId: "u2" },
  ];
}

describe("bulkUpdateStatus", () => {
  it("指定したタスクのステータスを更新できる", () => {
    const tasks = makeTasks();
    const result = bulkUpdateStatus(tasks, ["t2", "t3"], "done");

    expect(result.find((t) => t.id === "t2")?.status).toBe("done");
    expect(result.find((t) => t.id === "t3")?.status).toBe("done");
    expect(result.find((t) => t.id === "t1")?.status).toBe("todo");
  });

  it("呼び出し元が保持している元の配列を書き換えてはいけない", () => {
    // 「別の画面がまだ持っている一覧」を模したオリジナルの配列
    const originalTasks = makeTasks();
    const snapshotBefore = originalTasks.map((t) => ({ ...t }));

    bulkUpdateStatus(originalTasks, ["t2"], "done");

    // 呼び出し元がまだ参照している originalTasks の中身は、
    // 更新前の状態のままでなければならない
    expect(originalTasks).toEqual(snapshotBefore);
  });
});
