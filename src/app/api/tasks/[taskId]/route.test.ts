import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { PATCH } from "./route";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  isDatabaseConfigured: true,
  prisma: {
    task: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
  },
}));

const USER_ID = "user-1";
const TASK_ID = "task-1";
const PROJECT_ID = "project-1";

const existingTask = {
  id: TASK_ID,
  projectId: PROJECT_ID,
  title: "既存タイトル",
  description: "既存の説明",
  status: "TODO" as const,
  tags: ["frontend"],
  assigneeId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function patchRequest(body: unknown) {
  return new Request(`http://localhost/api/tasks/${TASK_ID}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

function callPatch(body: unknown) {
  return PATCH(patchRequest(body), { params: { taskId: TASK_ID } });
}

describe("PATCH /api/tasks/[taskId] - ステータス更新", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: USER_ID },
    } as never);
    vi.mocked(prisma.task.findUnique).mockResolvedValue(existingTask as never);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
      projectId: PROJECT_ID,
      userId: USER_ID,
    } as never);
    vi.mocked(prisma.task.update).mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...existingTask, ...data } as never)
    );
  });

  describe("正常系", () => {
    it.each(["TODO", "IN_PROGRESS", "DONE"] as const)(
      "status を %s に更新できる",
      async (status) => {
        const res = await callPatch({ status });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe(status);
        expect(prisma.task.update).toHaveBeenCalledWith({
          where: { id: TASK_ID },
          data: { status },
        });
      }
    );

    it("status以外のフィールドを変更していない場合、他のフィールドの値は保持される", async () => {
      const res = await callPatch({ status: "DONE" });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.title).toBe(existingTask.title);
      expect(json.tags).toEqual(existingTask.tags);
      expect(json.assigneeId).toBe(existingTask.assigneeId);
    });

    it("statusと他のフィールドを同時に更新できる", async () => {
      const res = await callPatch({ status: "IN_PROGRESS", title: "新しいタイトル" });

      expect(res.status).toBe(200);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: TASK_ID },
        data: { status: "IN_PROGRESS", title: "新しいタイトル" },
      });
    });
  });

  describe("異常系", () => {
    it("未ログインの場合は401を返す", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null as never);

      const res = await callPatch({ status: "DONE" });

      expect(res.status).toBe(401);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("対象タスクのプロジェクトのメンバーでない場合は403を返す", async () => {
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as never);

      const res = await callPatch({ status: "DONE" });

      expect(res.status).toBe(403);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("存在しないtaskIdの場合は404を返す", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null as never);

      const res = await callPatch({ status: "DONE" });

      expect(res.status).toBe(404);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("定義されていない文字列を指定した場合は400を返す", async () => {
      const res = await callPatch({ status: "DOING" });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("TODO");
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it.each([123, true, [], {}, null])(
      "文字列以外の値（%p）を指定した場合は400を返す",
      async (status) => {
        const res = await callPatch({ status });

        expect(res.status).toBe(400);
        expect(prisma.task.update).not.toHaveBeenCalled();
      }
    );
  });

  describe("境界値", () => {
    it("statusフィールドを送らない場合、statusは更新対象に含まれない", async () => {
      const res = await callPatch({ title: "タイトルのみ更新" });

      expect(res.status).toBe(200);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: TASK_ID },
        data: { title: "タイトルのみ更新" },
      });
      const [[callArg]] = vi.mocked(prisma.task.update).mock.calls;
      expect(callArg.data).not.toHaveProperty("status");
    });

    it("空文字を指定した場合は400を返す", async () => {
      const res = await callPatch({ status: "" });

      expect(res.status).toBe(400);
    });

    it("有効な値の小文字表記（大文字小文字違い）は400を返す", async () => {
      const res = await callPatch({ status: "todo" });

      expect(res.status).toBe(400);
    });

    it("前後に空白を含む値は400を返す（トリムして救済しない）", async () => {
      const res = await callPatch({ status: " TODO " });

      expect(res.status).toBe(400);
    });
  });
});
