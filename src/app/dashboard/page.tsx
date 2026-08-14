import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_ORDER = ["TODO", "IN_PROGRESS", "DONE"] as const;
const STATUS_LABELS: Record<(typeof STATUS_ORDER)[number], string> = {
  TODO: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-xl font-bold">ダッシュボード</h1>
        <p className="mt-2 text-sm text-gray-500">
          タスク一覧を見るには、右上のボタンからGitHubでログインしてください。
        </p>
      </main>
    );
  }

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } }, archivedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (projects.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-xl font-bold">ダッシュボード</h1>
        <p className="mt-2 text-sm text-gray-500">
          参加しているプロジェクトがまだありません。
        </p>
      </main>
    );
  }

  const selectedProject =
    projects.find((p) => p.id === searchParams.projectId) ?? projects[0];

  const tasks = await prisma.task.findMany({
    where: { projectId: selectedProject.id },
    include: { assignee: true },
    orderBy: { createdAt: "asc" },
  });

  const tasksByStatus: Record<(typeof STATUS_ORDER)[number], typeof tasks> = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  for (const task of tasks) {
    tasksByStatus[task.status].push(task);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-xl font-bold">ダッシュボード</h1>

      {projects.length > 1 && (
        <nav className="mt-4 flex flex-wrap gap-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard?projectId=${p.id}`}
              className={
                p.id === selectedProject.id
                  ? "rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
                  : "rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
              }
            >
              {p.name}
            </Link>
          ))}
        </nav>
      )}

      <h2 className="mt-6 text-lg font-semibold text-gray-900">{selectedProject.name}</h2>
      {selectedProject.description && (
        <p className="mt-1 text-sm text-gray-500">{selectedProject.description}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STATUS_ORDER.map((status) => (
          <section key={status} className="rounded border border-gray-200 bg-white p-4">
            <h3 className="flex items-baseline gap-2 font-medium text-gray-800">
              {STATUS_LABELS[status]}
              <span className="text-xs font-normal text-gray-400">
                {tasksByStatus[status].length}件
              </span>
            </h3>

            <ul className="mt-3 space-y-2">
              {tasksByStatus[status].length === 0 && (
                <li className="text-sm text-gray-400">タスクはありません</li>
              )}
              {tasksByStatus[status].map((task) => (
                <li key={task.id} className="rounded border border-gray-100 p-2 text-sm">
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {task.title}
                  </Link>
                  <p className="mt-1 text-xs text-gray-500">
                    担当者：{task.assignee?.name ?? "未アサイン"}
                  </p>
                  {task.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
