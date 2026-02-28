import type { Cat } from "@nekolog/shared";
import { getErrorMessage } from "../lib/error-display";
import { deleteCat } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 猫削除確認ダイアログ。
 * 関連データの警告を表示し、confirmed=true で DELETE を送信する。
 */
export function CatDeleteDialog({
  cat,
  onClose,
}: {
  cat: Cat;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteCat(cat.id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cats"] });
      onClose();
    },
  });

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 className="text-lg font-semibold text-red-800">
        「{cat.name}」を削除しますか？
      </h3>
      <p className="mt-2 text-sm text-red-700">
        関連するトイレ記録もすべて削除されます。この操作は取り消せません。
      </p>

      {mutation.error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {getErrorMessage(mutation.error)}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          削除する
        </button>
        <button
          onClick={onClose}
          className="rounded border px-4 py-2 hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
