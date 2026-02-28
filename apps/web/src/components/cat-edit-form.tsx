import { useState } from "react";
import type { Cat } from "@nekolog/shared";
import { updateCatSchema } from "@nekolog/shared";
import { getErrorMessage } from "../lib/error-display";
import { updateCat } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 猫編集フォームコンポーネント。
 * 既存データをプリフィルし、更新APIを呼び出す。
 */
export function CatEditForm({
  cat,
  onClose,
}: {
  cat: Cat;
  onClose: () => void;
}) {
  const [name, setName] = useState(cat.name);
  const [breed, setBreed] = useState(cat.breed ?? "");
  const [weight, setWeight] = useState(
    cat.weight != null ? String(cat.weight) : ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateCat>[1]) =>
      updateCat(cat.id, data),
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

    const parsed = updateCatSchema.safeParse(input);
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
      <h3 className="text-lg font-semibold">猫を編集</h3>

      {displayError && (
        <p className="text-sm text-red-600" role="alert">
          {displayError}
        </p>
      )}

      <div>
        <label htmlFor="cat-edit-name" className="block text-sm font-medium">
          名前
        </label>
        <input
          id="cat-edit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="cat-edit-breed" className="block text-sm font-medium">
          品種
        </label>
        <input
          id="cat-edit-breed"
          type="text"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="cat-edit-weight" className="block text-sm font-medium">
          体重 (kg)
        </label>
        <input
          id="cat-edit-weight"
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
          更新
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
