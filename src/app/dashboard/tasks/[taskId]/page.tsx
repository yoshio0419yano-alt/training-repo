import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommentForm } from "@/components/comment-form";

const STATUS_LABELS: Record<string, string> = {
  TODO: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
};

export default async function TaskDetailPage({
  params,
}: {
  params: { taskId: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-xl font-bold">タスク詳細</h1>
        <p className="mt-2 text-sm text-gray-500">
          タスクを見るには、右上のボタンからGitHubでログインしてください。
        </p>
      </main>
    );
  }

  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    include: { assignee: true, project: true },
  });

  if (!task) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-xl font-bold">タスク詳細</h1>
        <p className="mt-2 text-sm text-gray-500">タスクが見つかりません。</p>
      </main>
    );
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId } },
  });

  if (!membership) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-xl font-bold">タスク詳細</h1>
        <p className="mt-2 text-sm text-gray-500">
          このタスクを見る権限がありません。
        </p>
      </main>
    );
  }

  const comments = await prisma.comment.findMany({
    where: { taskId: task.id },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href={`/dashboard?projectId=${task.projectId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← {task.project.name} に戻る
      </Link>

      <h1 className="mt-2 text-xl font-bold text-gray-900">{task.title}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {STATUS_LABELS[task.status] ?? task.status} ・ 担当者：
        {task.assignee?.name ?? "未アサイン"}
      </p>
      {task.description && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
          {task.description}
        </p>
      )}
      {task.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
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

      <h2 className="mt-8 text-lg font-semibold text-gray-900">
        コメント（{comments.length}件）
      </h2>

      <ul className="mt-3 space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-gray-400">コメントはまだありません。</li>
        )}
        {comments.map((comment) => (
          <li key={comment.id} className="rounded border border-gray-200 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-900">
                {comment.author.name ?? "匿名ユーザー"}
              </span>
              <time className="text-xs text-gray-400">
                {comment.createdAt.toLocaleString("ja-JP")}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {comment.body}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <CommentForm taskId={task.id} />
      </div>
    </main>
  );
}
