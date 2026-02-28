import { useQuery } from "@tanstack/react-query";
import { fetchDailySummary } from "../lib/api";
import { getErrorMessage } from "../lib/error-display";
import { Link } from "react-router-dom";

/**
 * ダッシュボードページ。
 * 本日の全猫トイレ回数サマリーと猫ごとのカードを表示する。
 */
export function DashboardPage() {
  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["stats", "summary"],
    queryFn: fetchDailySummary,
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">ダッシュボード</h2>

      {/* Error */}
      {!isLoading && isError && (
        <p className="text-sm text-red-600" role="alert">
          {getErrorMessage(error)}
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && summary && summary.cats.length === 0 && (
        <div>
          <p className="text-gray-500">猫が登録されていません</p>
          <Link
            to="/cats"
            className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            猫の管理へ
          </Link>
        </div>
      )}

      {/* Summary */}
      {summary && summary.cats.length > 0 && (
        <>
          {/* Date */}
          <p className="mb-4 text-sm text-gray-500">{summary.date}</p>

          {/* Total counts */}
          <div data-testid="total-summary" className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-gray-500">合計</p>
              <p className="text-3xl font-bold">{summary.totalCount}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-gray-500">排尿</p>
              <p className="text-3xl font-bold text-blue-600">
                {summary.totalUrineCount}
              </p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-gray-500">排便</p>
              <p className="text-3xl font-bold text-amber-600">
                {summary.totalFecesCount}
              </p>
            </div>
          </div>

          {/* Per-cat cards */}
          <h3 className="mb-3 text-lg font-semibold">猫ごとのサマリー</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.cats.map((cat) => (
              <div
                key={cat.catId}
                data-testid={`cat-summary-${cat.catId}`}
                className="rounded-lg border p-4"
              >
                <p className="mb-2 font-medium">{cat.catName}</p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">排尿: </span>
                    <span className="font-medium text-blue-600">
                      {cat.urineCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">排便: </span>
                    <span className="font-medium text-amber-600">
                      {cat.fecesCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">計: </span>
                    <span className="font-medium">{cat.totalCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
