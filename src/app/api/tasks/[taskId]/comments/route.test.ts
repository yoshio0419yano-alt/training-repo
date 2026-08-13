import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "./route";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  isDatabaseConfigured: true,
  prisma: {
    task: {
      findUnique: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
      create: vi.fn(),
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
};

const existingComments = [
  {
    id: "comment-1",
    taskId: TASK_ID,
    authorId: USER_ID,
    body: "最初のコメント",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    author: { name: "山田太郎" },
  },
];

function getRequest() {
  return new Request(`http://localhost/api/tasks/${TASK_ID}/comments`);
}

function postRequest(body: unknown) {
  return new Request(`http://localhost/api/tasks/${TASK_ID}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function callGet() {
  return GET(getRequest(), { params: { taskId: TASK_ID } });
}

function callPost(body: unknown) {
  return POST(postRequest(body), { params: { taskId: TASK_ID } });
}

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
});

describe("GET /api/tasks/[taskId]/comments - コメント一覧取得", () => {
  beforeEach(() => {
    vi.mocked(prisma.comment.findMany).mockResolvedValue(existingComments as never);
  });

  it("コメント一覧を作成日時の昇順で取得できる", async () => {
    const res = await callGet();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.comments).toEqual([
      {
        id: "comment-1",
        authorId: USER_ID,
        authorName: "山田太郎",
        body: "最初のコメント",
        createdAt: existingComments[0].createdAt.toISOString(),
        updatedAt: existingComments[0].updatedAt.toISOString(),
      },
    ]);
    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: { taskId: TASK_ID },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
  });

  it("未ログインの場合は401を返す", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);

    const res = await callGet();

    expect(res.status).toBe(401);
  });

  it("対象タスクのプロジェクトのメンバーでない場合は403を返す", async () => {
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as never);

    const res = await callGet();

    expect(res.status).toBe(403);
  });

  it("存在しないtaskIdの場合は404を返す", async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValue(null as never);

    const res = await callGet();

    expect(res.status).toBe(404);
  });
});

describe("POST /api/tasks/[taskId]/comments - コメント投稿", () => {
  beforeEach(() => {
    vi.mocked(prisma.comment.create).mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: "comment-new",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
          ...data,
        } as never)
    );
  });

  it("本文を指定してコメントを投稿できる", async () => {
    const res = await callPost({ body: "新しいコメント" });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.body).toBe("新しいコメント");
    expect(json.taskId).toBe(TASK_ID);
    expect(json.authorId).toBe(USER_ID);
    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: { taskId: TASK_ID, authorId: USER_ID, body: "新しいコメント" },
    });
  });

  it("未ログインの場合は401を返す", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);

    const res = await callPost({ body: "新しいコメント" });

    expect(res.status).toBe(401);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("対象タスクのプロジェクトのメンバーでない場合は403を返す", async () => {
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as never);

    const res = await callPost({ body: "新しいコメント" });

    expect(res.status).toBe(403);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("存在しないtaskIdの場合は404を返す", async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValue(null as never);

    const res = await callPost({ body: "新しいコメント" });

    expect(res.status).toBe(404);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("bodyが空文字の場合は400を返す", async () => {
    const res = await callPost({ body: "" });

    expect(res.status).toBe(400);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("bodyが未指定の場合は400を返す", async () => {
    const res = await callPost({});

    expect(res.status).toBe(400);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("bodyが文字列以外の場合は400を返す", async () => {
    const res = await callPost({ body: 123 });

    expect(res.status).toBe(400);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });
});
