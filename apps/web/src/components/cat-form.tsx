import { useState } from "react";
import { createCatSchema } from "@nekolog/shared";
import { getErrorMessage } from "../lib/error-display";
import { createCat } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 猫登録フォームコンポーネント。
 * クライアント側バリデーション + API エラー表示。
 */
export function CatForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cats"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const input: Record<string, unknown> = { name };
    if (breed) input["breed"] = breed;
    if (weight) input["weight"] = parseFloat(weight);

    const parsed = createCatSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setValidationError(issue?.message ?? "入力内容に誤りがあります");
      return;
    }

    mutation.mutate(parsed.data);
  };

  const displayError =
    validationError ?? (mutation.error ? getErrorMessage(mutation.error) : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">猫を登録</h3>

      {displayError && (
        <p className="text-sm text-red-600" role="alert">
          {displayError}
        </p>
      )}

      <div>
        <label htmlFor="cat-name" className="block text-sm font-medium">
          名前
        </label>
        <input
          id="cat-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="cat-breed" className="block text-sm font-medium">
          品種
        </label>
        <input
          id="cat-breed"
          type="text"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="cat-weight" className="block text-sm font-medium">
          体重 (kg)
        </label>
        <input
          id="cat-weight"
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          登録
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded border px-4 py-2 hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
