import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createLogSchema } from "@nekolog/shared";
import { fetchCats, createLog } from "../lib/api";
import { getErrorMessage } from "../lib/error-display";
import { Link } from "react-router-dom";

/**
 * トイレ記録ページ。
 * クイック記録フォーム（WF7 AddToiletLog）。
 */
export function LogsPage() {
  const [catId, setCatId] = useState("");
  const [toiletType, setToiletType] = useState<"urine" | "feces">("urine");
  const [timestamp, setTimestamp] = useState(() => toLocalDatetime(new Date()));
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    data: catsData,
    isLoading: catsLoading,
    isError: catsError,
    error: catsQueryError,
  } = useQuery({
    queryKey: ["cats"],
    queryFn: fetchCats,
  });

  const cats = catsData?.cats ?? [];

  const mutation = useMutation({
    mutationFn: createLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      setSuccessMessage("記録しました");
      // Reset form
      setCatId("");
      setToiletType("urine");
      setTimestamp(toLocalDatetime(new Date()));
      setNote("");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    const input: Record<string, unknown> = {
      catId,
      type: toiletType,
    };
    if (timestamp) {
      input["timestamp"] = new Date(timestamp).toISOString();
    }
    if (note) {
      input["note"] = note;
    }

    const parsed = createLogSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setValidationError(issue?.message ?? "入力内容に誤りがあります");
      return;
    }

    mutation.mutate(parsed.data);
  };

  const displayError =
    validationError ?? (mutation.error ? getErrorMessage(mutation.error) : null);

  if (!catsLoading && catsError) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-bold">トイレ記録</h2>
        <p className="text-sm text-red-600" role="alert">
          {getErrorMessage(catsQueryError)}
        </p>
      </div>
    );
  }

  if (!catsLoading && !catsError && cats.length === 0) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-bold">トイレ記録</h2>
        <p className="text-gray-500">
          猫が登録されていません。先に猫を登録してください。
        </p>
        <Link
          to="/cats"
          className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          猫の管理へ
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">トイレ記録</h2>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md space-y-4 rounded-lg border p-4"
      >
        {successMessage && (
          <p className="text-sm text-green-600" role="status">
            {successMessage}
          </p>
        )}

        {displayError && (
          <p className="text-sm text-red-600" role="alert">
            {displayError}
          </p>
        )}

        <div>
          <label htmlFor="log-cat" className="block text-sm font-medium">
            猫を選択
          </label>
          <select
            id="log-cat"
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="">-- 選択してください --</option>
            {cats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-sm font-medium">種類</span>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setToiletType("urine")}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium ${
                toiletType === "urine"
                  ? "bg-blue-600 text-white"
                  : "border bg-white hover:bg-gray-50"
              }`}
            >
              排尿
            </button>
            <button
              type="button"
              onClick={() => setToiletType("feces")}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium ${
                toiletType === "feces"
                  ? "bg-amber-600 text-white"
                  : "border bg-white hover:bg-gray-50"
              }`}
            >
              排便
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="log-timestamp" className="block text-sm font-medium">
            日時
          </label>
          <input
            id="log-timestamp"
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="log-note" className="block text-sm font-medium">
            メモ
          </label>
          <textarea
            id="log-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="任意のメモ"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || catsLoading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          記録する
        </button>
      </form>
    </div>
  );
}

/**
 * Date を datetime-local input の value 形式 (YYYY-MM-DDTHH:mm) に変換する。
 */
function toLocalDatetime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
