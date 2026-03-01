import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Period } from "@nekolog/shared";
import { fetchCats, fetchChartData } from "../lib/api";
import { getErrorMessage } from "../lib/error-display";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "日別" },
  { value: "week", label: "週別" },
  { value: "month", label: "月別" },
];

/**
 * 統計ページ。
 * Recharts による折れ線グラフ、期間セレクター、猫選択フィルタ。
 */
export function StatsPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [catId, setCatId] = useState("");

  const { data: catsData } = useQuery({
    queryKey: ["cats"],
    queryFn: fetchCats,
  });
  const cats = catsData?.cats ?? [];

  const queryParams: Record<string, string | undefined> = {
    period,
  };
  if (catId) queryParams["catId"] = catId;

  const {
    data: chartData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["stats", "chart", period, catId],
    queryFn: () => fetchChartData(queryParams),
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">統計</h2>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        {/* Period selector */}
        <div>
          <span className="block text-sm font-medium">期間</span>
          <div className="mt-1 flex gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`rounded px-4 py-2 text-sm font-medium ${
                  period === opt.value
                    ? "bg-blue-600 text-white"
                    : "border bg-white hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cat filter */}
        <div>
          <label htmlFor="stats-cat" className="block text-sm font-medium">
            猫で絞り込み
          </label>
          <select
            id="stats-cat"
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
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
      </div>

      {/* Error */}
      {!isLoading && isError && (
        <p className="text-sm text-red-600" role="alert">
          {getErrorMessage(error)}
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && chartData && chartData.data.length === 0 && (
        <p className="text-gray-500">データがありません</p>
      )}

      {/* Chart */}
      {chartData && chartData.data.length > 0 && (
        <div className="rounded-lg border p-4">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="urineCount"
                name="排尿"
                stroke="#2563eb"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="fecesCount"
                name="排便"
                stroke="#d97706"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default StatsPage;
