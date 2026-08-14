"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CommentForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (body.trim().length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "コメントの投稿に失敗しました"
        );
      }

      setBody("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "コメントの投稿に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="コメントを入力"
        rows={3}
        className="w-full rounded border border-gray-300 p-2 text-sm"
        disabled={isSubmitting}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting || body.trim().length === 0}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {isSubmitting ? "投稿中…" : "コメントを投稿"}
      </button>
    </form>
  );
}
