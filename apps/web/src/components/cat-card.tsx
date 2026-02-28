import type { Cat } from "@nekolog/shared";

/**
 * 猫の情報を表示するカードコンポーネント。
 */
export function CatCard({ cat }: { cat: Cat }) {
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
        <div>
          <h3 className="text-lg font-semibold">{cat.name}</h3>
          {cat.breed && (
            <p className="text-sm text-gray-600">{cat.breed}</p>
          )}
          {cat.weight != null && (
            <p className="text-sm text-gray-600">{cat.weight} kg</p>
          )}
        </div>
      </div>
    </div>
  );
}
