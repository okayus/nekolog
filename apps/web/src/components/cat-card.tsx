import type { Cat } from "@nekolog/shared";

/**
 * 猫の情報を表示するカードコンポーネント。
 * 編集・削除ボタン付き。
 */
export function CatCard({
  cat,
  onEdit,
  onDelete,
}: {
  cat: Cat;
  onEdit: (cat: Cat) => void;
  onDelete: (cat: Cat) => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-4">
        {cat.imageUrl ? (
          <img
            src={cat.imageUrl}
            alt={cat.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-2xl">
            🐱
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{cat.name}</h3>
          {cat.breed && (
            <p className="text-sm text-gray-600">{cat.breed}</p>
          )}
          {cat.weight != null && (
            <p className="text-sm text-gray-600">{cat.weight} kg</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(cat)}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            編集
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
