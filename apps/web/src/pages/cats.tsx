import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Cat } from "@nekolog/shared";
import { fetchCats } from "../lib/api";
import { CatCard } from "../components/cat-card";
import { CatForm } from "../components/cat-form";
import { CatEditForm } from "../components/cat-edit-form";
import { CatDeleteDialog } from "../components/cat-delete-dialog";

/**
 * 猫一覧・登録・編集・削除ページ。
 * WF3 (RegisterCat), WF4 (UpdateCat), WF5 (DeleteCat), WF6 (ListCats) を統合。
 */
export function CatsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Cat | null>(null);
  const [deletingCat, setDeletingCat] = useState<Cat | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["cats"],
    queryFn: fetchCats,
  });

  const cats = data?.cats ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">猫の管理</h2>
        {!showForm && !editingCat && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            猫を登録
          </button>
        )}
      </div>

      {showForm && <CatForm onClose={() => setShowForm(false)} />}

      {editingCat && (
        <CatEditForm cat={editingCat} onClose={() => setEditingCat(null)} />
      )}

      {deletingCat && (
        <CatDeleteDialog
          cat={deletingCat}
          onClose={() => setDeletingCat(null)}
        />
      )}

      {isLoading && <p>読み込み中...</p>}

      {!isLoading && cats.length === 0 && !showForm && (
        <p className="text-gray-500">猫が登録されていません</p>
      )}

      {cats.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((cat) => (
            <CatCard
              key={cat.id}
              cat={cat}
              onEdit={(c) => setEditingCat(c)}
              onDelete={(c) => setDeletingCat(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
