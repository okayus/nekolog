import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLogSchema } from "@nekolog/shared";
import type { ToiletLog } from "@nekolog/shared";
import { fetchCats, fetchLogs, updateLog, deleteLog } from "../lib/api";
import { getErrorMessage } from "../lib/error-display";

/**
 * トイレ記録履歴ページ。
 * 時系列での記録表示、フィルタリング、ページネーション、編集・削除機能。
 */
export function HistoryPage() {
  const [filterCatId, setFilterCatId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [editingLog, setEditingLog] = useState<ToiletLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<ToiletLog | null>(null);

  const queryClient = useQueryClient();

  const { data: catsData } = useQuery({
    queryKey: ["cats"],
    queryFn: fetchCats,
  });
  const cats = catsData?.cats ?? [];
  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  const queryParams: Record<string, string | undefined> = {
    page: String(page),
  };
  if (filterCatId) queryParams["catId"] = filterCatId;
  if (filterType) queryParams["type"] = filterType;

  const {
    data: logsData,
    isLoading: logsLoading,
    isError: logsError,
    error: logsQueryError,
  } = useQuery({
    queryKey: ["logs", filterCatId, filterType, page],
    queryFn: () => fetchLogs(queryParams),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      setEditingLog(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLog(id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      setDeletingLog(null);
    },
  });

  const handleFilterCat = (value: string) => {
    setFilterCatId(value);
    setPage(1);
  };

  const handleFilterType = (value: string) => {
    setFilterType(value);
    setPage(1);
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">トイレ記録履歴</h2>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label htmlFor="filter-cat" className="block text-sm font-medium">
            猫で絞り込み
          </label>
          <select
            id="filter-cat"
            value={filterCatId}
            onChange={(e) => handleFilterCat(e.target.value)}
            className="mt-1 rounded border px-3 py-2"
          >
            <option value="">すべて</option>
            {cats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-type" className="block text-sm font-medium">
            種類で絞り込み
          </label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => handleFilterType(e.target.value)}
            className="mt-1 rounded border px-3 py-2"
          >
            <option value="">すべて</option>
            <option value="urine">排尿</option>
            <option value="feces">排便</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {!logsLoading && logsError && (
        <p className="text-sm text-red-600" role="alert">
          {getErrorMessage(logsQueryError)}
        </p>
      )}

      {/* Empty state */}
      {!logsLoading && !logsError && logsData && logsData.logs.length === 0 && (
        <p className="text-gray-500">記録がありません</p>
      )}

      {/* Log list */}
      {logsData && logsData.logs.length > 0 && (
        <div className="space-y-2">
          {logsData.logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded border p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {catMap.get(log.catId) ?? log.catId}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium text-white ${
                      log.type === "urine" ? "bg-blue-600" : "bg-amber-600"
                    }`}
                  >
                    {log.type === "urine" ? "排尿" : "排便"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString("ja-JP")}
                  </span>
                </div>
                {log.note && (
                  <p className="mt-1 text-sm text-gray-600">{log.note}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLog(log)}
                  className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingLog(log)}
                  className="rounded border px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {logsData && logsData.totalPages > 0 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-4 py-2 text-sm disabled:opacity-50"
          >
            前へ
          </button>
          <span className="text-sm">
            {page} / {logsData.totalPages} ページ
          </span>
          <button
            type="button"
            disabled={page >= logsData.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-4 py-2 text-sm disabled:opacity-50"
          >
            次へ
          </button>
        </div>
      )}

      {/* Edit dialog */}
      {editingLog && (
        <EditLogDialog
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSubmit={(data) =>
            updateMutation.mutate({ id: editingLog.id, data })
          }
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingLog && (
        <DeleteLogDialog
          onClose={() => setDeletingLog(null)}
          onConfirm={() => deleteMutation.mutate(deletingLog.id)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

function EditLogDialog({
  log,
  onClose,
  onSubmit,
  isPending,
}: {
  log: ToiletLog;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const [type, setType] = useState<"urine" | "feces">(log.type);
  const [note, setNote] = useState(log.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const input: Record<string, unknown> = { type };
    if (note) input["note"] = note;

    const parsed = updateLogSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力内容に誤りがあります");
      return;
    }

    onSubmit(parsed.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">記録を編集</h3>

        {error && (
          <p className="mb-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="block text-sm font-medium">種類</span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setType("urine")}
                className={`flex-1 rounded px-4 py-2 text-sm font-medium ${
                  type === "urine"
                    ? "bg-blue-600 text-white"
                    : "border bg-white hover:bg-gray-50"
                }`}
              >
                排尿
              </button>
              <button
                type="button"
                onClick={() => setType("feces")}
                className={`flex-1 rounded px-4 py-2 text-sm font-medium ${
                  type === "feces"
                    ? "bg-amber-600 text-white"
                    : "border bg-white hover:bg-gray-50"
                }`}
              >
                排便
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="edit-note" className="block text-sm font-medium">
              メモ
            </label>
            <textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="任意のメモ"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              更新する
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border px-4 py-2 hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteLogDialog({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">この記録を削除しますか？</h3>
        <p className="mb-4 text-sm text-gray-600">
          この操作は取り消せません。
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            削除する
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border px-4 py-2 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
