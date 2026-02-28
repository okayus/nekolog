/**
 * Statistics Workflows
 *
 * Domain workflows for dashboard statistics.
 * Uses DB-level aggregation for complete results (no row limit truncation).
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
 * Flow: Get user's cats → DB-aggregate today's logs by cat → Build summary
 *
 * Uses aggregateByCat for DB-level GROUP BY, guaranteeing complete counts
 * regardless of log volume.
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
    return logRepo.aggregateByCat(userId, from, to).andThen((aggregates) => {
      // Build a lookup map from DB aggregates
      const aggregateMap = new Map(
        aggregates.map((a) => [a.catId, a])
      );

      // Build per-cat summary (includes cats with zero logs)
      const catSummaries: CatSummary[] = cats.map((cat) => {
        const agg = aggregateMap.get(cat.id);
        const urineCount = agg?.urineCount ?? 0;
        const fecesCount = agg?.fecesCount ?? 0;

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
 * Flow: Validate query → (Optional) Verify cat exists → DB-aggregate by period
 *
 * Uses aggregateByPeriod for DB-level GROUP BY, guaranteeing complete counts
 * regardless of log volume.
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
    type CatInfo = { catId: string | null; catName: string | null };
    const catCheck: ResultAsync<CatInfo, DomainError> = validatedQuery.catId
      ? catRepo.findById(validatedQuery.catId, userId).andThen((cat) => {
          if (!cat) {
            return errAsync<CatInfo, DomainError>(
              DomainErrors.notFound("cat", validatedQuery.catId!)
            );
          }
          return okAsync<CatInfo, DomainError>({
            catId: cat.id,
            catName: cat.name,
          });
        })
      : okAsync<CatInfo, DomainError>({ catId: null, catName: null });

    return catCheck.andThen(({ catId, catName }) => {
      return logRepo
        .aggregateByPeriod(
          userId,
          validatedQuery.from ?? "1970-01-01T00:00:00.000Z",
          validatedQuery.to ?? "9999-12-31T23:59:59.999Z",
          period,
          validatedQuery.catId
        )
        .andThen((aggregates) => {
          const data: ChartDataPoint[] = aggregates.map((a) => ({
            date: a.date,
            urineCount: a.urineCount,
            fecesCount: a.fecesCount,
            totalCount: a.urineCount + a.fecesCount,
          }));

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
