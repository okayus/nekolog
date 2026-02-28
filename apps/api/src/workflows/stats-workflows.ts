/**
 * Statistics Workflows
 *
 * Domain workflows for dashboard statistics.
 * Uses Railway Oriented Programming with neverthrow.
 */

import { ResultAsync, okAsync, errAsync } from "neverthrow";
import {
  DomainErrors,
  fromZodError,
  statsQuerySchema,
  type DomainError,
  type StatsQuery,
  type DailySummary,
  type CatSummary,
  type ChartData,
  type ChartDataPoint,
} from "@nekolog/shared";
import type { CatRepository } from "../repositories/cat-repository";
import type { LogRepository } from "../repositories/log-repository";
import type { ToiletLog } from "../db/schema";

/**
 * Extracts the date string (YYYY-MM-DD) from an ISO timestamp.
 */
const getDateKey = (timestamp: string): string => {
  return timestamp.slice(0, 10);
};

/**
 * Extracts the week start date (Monday) from an ISO timestamp.
 * Returns YYYY-MM-DD of the Monday of that week.
 */
const getWeekKey = (timestamp: string): string => {
  const date = new Date(timestamp);
  const day = date.getUTCDay();
  // Adjust to Monday (day 0 = Sunday -> offset 6, day 1 = Monday -> offset 0, etc.)
  const mondayOffset = day === 0 ? 6 : day - 1;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - mondayOffset);
  return monday.toISOString().slice(0, 10);
};

/**
 * Extracts the month key (YYYY-MM) from an ISO timestamp.
 */
const getMonthKey = (timestamp: string): string => {
  return timestamp.slice(0, 7);
};

/**
 * Gets the grouping key for a timestamp based on the period.
 */
const getGroupKey = (
  timestamp: string,
  period: "daily" | "weekly" | "monthly"
): string => {
  switch (period) {
    case "daily":
      return getDateKey(timestamp);
    case "weekly":
      return getWeekKey(timestamp);
    case "monthly":
      return getMonthKey(timestamp);
  }
};

/**
 * Aggregates logs into chart data points grouped by period.
 */
const aggregateLogs = (
  logs: ToiletLog[],
  period: "daily" | "weekly" | "monthly"
): ChartDataPoint[] => {
  const grouped = new Map<
    string,
    { urineCount: number; fecesCount: number }
  >();

  for (const log of logs) {
    const key = getGroupKey(log.timestamp, period);
    const existing = grouped.get(key) ?? { urineCount: 0, fecesCount: 0 };

    if (log.type === "urine") {
      existing.urineCount++;
    } else {
      existing.fecesCount++;
    }

    grouped.set(key, existing);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      urineCount: counts.urineCount,
      fecesCount: counts.fecesCount,
      totalCount: counts.urineCount + counts.fecesCount,
    }));
};

/**
 * Validates stats query input.
 */
const validateStatsQuery = (
  input: unknown
): ResultAsync<StatsQuery, DomainError> => {
  const result = statsQuerySchema.safeParse(input);
  if (!result.success) {
    return errAsync(fromZodError(result.error));
  }
  return okAsync(result.data);
};

/**
 * Maps period schema values to chart data period values.
 */
const mapPeriod = (
  period?: "today" | "week" | "month"
): "daily" | "weekly" | "monthly" => {
  switch (period) {
    case "week":
      return "weekly";
    case "month":
      return "monthly";
    default:
      return "daily";
  }
};

/**
 * Workflow: Get daily summary for dashboard
 *
 * Flow: Get user's cats → Get today's logs → Aggregate by cat
 *
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @param logRepo - Log repository instance
 * @param todayDate - Today's date in YYYY-MM-DD format (for testability)
 * @returns Daily summary or domain error
 */
export const getDailySummary = (
  userId: string,
  catRepo: CatRepository,
  logRepo: LogRepository,
  todayDate?: string
): ResultAsync<DailySummary, DomainError> => {
  const date = todayDate ?? new Date().toISOString().slice(0, 10);
  const from = `${date}T00:00:00.000Z`;
  const to = `${date}T23:59:59.999Z`;

  return catRepo.findAllByUserId(userId).andThen((cats) => {
    return logRepo
      .findWithFilters(userId, { from, to, page: 1, limit: 1000 })
      .andThen((paginatedLogs) => {
        const logs = paginatedLogs.logs;

        // Build per-cat summary
        const catSummaries: CatSummary[] = cats.map((cat) => {
          const catLogs = logs.filter((log) => log.catId === cat.id);
          const urineCount = catLogs.filter(
            (log) => log.type === "urine"
          ).length;
          const fecesCount = catLogs.filter(
            (log) => log.type === "feces"
          ).length;

          return {
            catId: cat.id,
            catName: cat.name,
            urineCount,
            fecesCount,
            totalCount: urineCount + fecesCount,
          };
        });

        const totalUrineCount = catSummaries.reduce(
          (sum, c) => sum + c.urineCount,
          0
        );
        const totalFecesCount = catSummaries.reduce(
          (sum, c) => sum + c.fecesCount,
          0
        );

        return okAsync({
          date,
          cats: catSummaries,
          totalUrineCount,
          totalFecesCount,
          totalCount: totalUrineCount + totalFecesCount,
        });
      });
  });
};

/**
 * Workflow: Get chart data for statistics visualization
 *
 * Flow: Validate query → (Optional) Verify cat exists → Get logs → Aggregate
 *
 * @param query - Raw query parameters
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @param logRepo - Log repository instance
 * @returns Chart data or domain error
 */
export const getChartData = (
  query: unknown,
  userId: string,
  catRepo: CatRepository,
  logRepo: LogRepository
): ResultAsync<ChartData, DomainError> => {
  return validateStatsQuery(query).andThen((validatedQuery) => {
    const period = mapPeriod(validatedQuery.period);

    // If catId is specified, verify the cat exists
    const catCheck = validatedQuery.catId
      ? catRepo.findById(validatedQuery.catId, userId).andThen((cat) => {
          if (!cat) {
            return errAsync(
              DomainErrors.notFound("cat", validatedQuery.catId!)
            );
          }
          return okAsync({
            catId: cat.id,
            catName: cat.name,
          });
        })
      : okAsync({ catId: null as string | null, catName: null as string | null });

    return catCheck.andThen(({ catId, catName }) => {
      const logQuery = {
        catId: validatedQuery.catId,
        from: validatedQuery.from,
        to: validatedQuery.to,
        page: 1,
        limit: 1000,
      };

      return logRepo
        .findWithFilters(userId, logQuery)
        .andThen((paginatedLogs) => {
          const data = aggregateLogs(paginatedLogs.logs, period);

          return okAsync({
            catId,
            catName,
            period,
            data,
          });
        });
    });
  });
};
