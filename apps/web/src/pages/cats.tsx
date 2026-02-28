import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCats } from "../lib/api";
import { CatCard } from "../components/cat-card";
import { CatForm } from "../components/cat-form";

/**
 * 猫一覧・登録ページ。
 * WF3 (RegisterCat) と WF6 (ListCats) を統合。
 */
export function CatsPage() {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["cats"],
    queryFn: fetchCats,
  });

  const cats = data?.cats ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">猫の管理</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            猫を登録
          </button>
        )}
      </div>

      {showForm && <CatForm onClose={() => setShowForm(false)} />}

      {isLoading && <p>読み込み中...</p>}

      {!isLoading && cats.length === 0 && !showForm && (
        <p className="text-gray-500">猫が登録されていません</p>
      )}

      {cats.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </div>
  );
}
