import { describe, it, expect, vi, beforeEach } from "vitest";
import { okAsync, errAsync } from "neverthrow";
import { DomainErrors } from "@nekolog/shared";
import { getDailySummary, getChartData } from "./stats-workflows";
import type { CatRepository } from "../repositories/cat-repository";
import type { LogRepository } from "../repositories/log-repository";
import type { Cat } from "../db/schema";

describe("Stats Workflows", () => {
  const userId = "user_123";
  const catId1 = "11111111-1111-4111-8111-111111111111";
  const catId2 = "22222222-2222-4222-8222-222222222222";

  const mockCat1: Cat = {
    id: catId1,
    userId,
    name: "たま",
    birthDate: null,
    breed: null,
    weight: null,
    imageUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const mockCat2: Cat = {
    id: catId2,
    userId,
    name: "みけ",
    birthDate: null,
    breed: null,
    weight: null,
    imageUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  let mockCatRepo: CatRepository;
  let mockLogRepo: LogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCatRepo = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
    };
    mockLogRepo = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findWithFilters: vi.fn(),
      aggregateByCat: vi.fn(),
      aggregateByPeriod: vi.fn(),
    };
  });

  describe("getDailySummary", () => {
    it("should return summary for all cats using DB aggregation", async () => {
      vi.mocked(mockCatRepo.findAllByUserId).mockReturnValue(
        okAsync([mockCat1, mockCat2])
      );
      vi.mocked(mockLogRepo.aggregateByCat).mockReturnValue(
        okAsync([
          { catId: catId1, urineCount: 1, fecesCount: 1 },
          { catId: catId2, urineCount: 1, fecesCount: 0 },
        ])
      );

      const result = await getDailySummary(
        userId,
        mockCatRepo,
        mockLogRepo,
        "2024-01-15"
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const summary = result.value;
        expect(summary.date).toBe("2024-01-15");
        expect(summary.cats).toHaveLength(2);

        const cat1Summary = summary.cats.find((c) => c.catId === catId1);
        expect(cat1Summary).toBeDefined();
        expect(cat1Summary!.catName).toBe("たま");
        expect(cat1Summary!.urineCount).toBe(1);
        expect(cat1Summary!.fecesCount).toBe(1);
        expect(cat1Summary!.totalCount).toBe(2);

        const cat2Summary = summary.cats.find((c) => c.catId === catId2);
        expect(cat2Summary).toBeDefined();
        expect(cat2Summary!.catName).toBe("みけ");
        expect(cat2Summary!.urineCount).toBe(1);
        expect(cat2Summary!.fecesCount).toBe(0);
        expect(cat2Summary!.totalCount).toBe(1);

        expect(summary.totalUrineCount).toBe(2);
        expect(summary.totalFecesCount).toBe(1);
        expect(summary.totalCount).toBe(3);
      }

      // Verify aggregateByCat was called with correct date range
      expect(mockLogRepo.aggregateByCat).toHaveBeenCalledWith(
        userId,
        "2024-01-15T00:00:00.000Z",
        "2024-01-15T23:59:59.999Z"
      );
      // Verify findWithFilters was NOT called (no longer used for stats)
      expect(mockLogRepo.findWithFilters).not.toHaveBeenCalled();
    });

    it("should return zero counts when no logs exist", async () => {
      vi.mocked(mockCatRepo.findAllByUserId).mockReturnValue(
        okAsync([mockCat1])
      );
      vi.mocked(mockLogRepo.aggregateByCat).mockReturnValue(okAsync([]));

      const result = await getDailySummary(
        userId,
        mockCatRepo,
        mockLogRepo,
        "2024-01-15"
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const summary = result.value;
        expect(summary.cats).toHaveLength(1);
        expect(summary.cats[0]!.urineCount).toBe(0);
        expect(summary.cats[0]!.fecesCount).toBe(0);
        expect(summary.cats[0]!.totalCount).toBe(0);
        expect(summary.totalCount).toBe(0);
      }
    });

    it("should return empty cats array when user has no cats", async () => {
      vi.mocked(mockCatRepo.findAllByUserId).mockReturnValue(okAsync([]));
      vi.mocked(mockLogRepo.aggregateByCat).mockReturnValue(okAsync([]));

      const result = await getDailySummary(
        userId,
        mockCatRepo,
        mockLogRepo,
        "2024-01-15"
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.cats).toHaveLength(0);
        expect(result.value.totalCount).toBe(0);
      }
    });

    it("should propagate database error from catRepo", async () => {
      vi.mocked(mockCatRepo.findAllByUserId).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const result = await getDailySummary(
        userId,
        mockCatRepo,
        mockLogRepo,
        "2024-01-15"
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });

    it("should propagate database error from logRepo", async () => {
      vi.mocked(mockCatRepo.findAllByUserId).mockReturnValue(
        okAsync([mockCat1])
      );
      vi.mocked(mockLogRepo.aggregateByCat).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const result = await getDailySummary(
        userId,
        mockCatRepo,
        mockLogRepo,
        "2024-01-15"
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("getChartData", () => {
    it("should return daily chart data for a specific cat", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(mockCat1));
      vi.mocked(mockLogRepo.aggregateByPeriod).mockReturnValue(
        okAsync([
          { date: "2024-01-13", urineCount: 2, fecesCount: 0 },
          { date: "2024-01-14", urineCount: 0, fecesCount: 1 },
        ])
      );

      const query = {
        catId: catId1,
        period: "today" as const,
        from: "2024-01-13T00:00:00.000Z",
        to: "2024-01-14T23:59:59.999Z",
      };

      const result = await getChartData(
        query,
        userId,
        mockCatRepo,
        mockLogRepo
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const chart = result.value;
        expect(chart.catId).toBe(catId1);
        expect(chart.catName).toBe("たま");
        expect(chart.period).toBe("daily");
        expect(chart.data).toHaveLength(2);

        const day1 = chart.data.find((d) => d.date === "2024-01-13");
        expect(day1).toBeDefined();
        expect(day1!.urineCount).toBe(2);
        expect(day1!.fecesCount).toBe(0);
        expect(day1!.totalCount).toBe(2);

        const day2 = chart.data.find((d) => d.date === "2024-01-14");
        expect(day2).toBeDefined();
        expect(day2!.urineCount).toBe(0);
        expect(day2!.fecesCount).toBe(1);
        expect(day2!.totalCount).toBe(1);
      }

      // Verify aggregateByPeriod was called correctly
      expect(mockLogRepo.aggregateByPeriod).toHaveBeenCalledWith(
        userId,
        "2024-01-13T00:00:00.000Z",
        "2024-01-14T23:59:59.999Z",
        "daily",
        catId1
      );
      expect(mockLogRepo.findWithFilters).not.toHaveBeenCalled();
    });

    it("should return chart data for all cats when no catId specified", async () => {
      vi.mocked(mockLogRepo.aggregateByPeriod).mockReturnValue(
        okAsync([{ date: "2024-01-13", urineCount: 1, fecesCount: 1 }])
      );

      const query = {
        period: "today" as const,
        from: "2024-01-13T00:00:00.000Z",
        to: "2024-01-13T23:59:59.999Z",
      };

      const result = await getChartData(
        query,
        userId,
        mockCatRepo,
        mockLogRepo
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const chart = result.value;
        expect(chart.catId).toBeNull();
        expect(chart.catName).toBeNull();
        expect(chart.period).toBe("daily");
        expect(chart.data).toHaveLength(1);

        const day = chart.data[0]!;
        expect(day.date).toBe("2024-01-13");
        expect(day.urineCount).toBe(1);
        expect(day.fecesCount).toBe(1);
        expect(day.totalCount).toBe(2);
      }
    });

    it("should aggregate by week for weekly period", async () => {
      vi.mocked(mockLogRepo.aggregateByPeriod).mockReturnValue(
        okAsync([
          { date: "2024-01-08", urineCount: 1, fecesCount: 1 },
          { date: "2024-01-15", urineCount: 1, fecesCount: 0 },
        ])
      );

      const query = {
        period: "week" as const,
        from: "2024-01-08T00:00:00.000Z",
        to: "2024-01-21T23:59:59.999Z",
      };

      const result = await getChartData(
        query,
        userId,
        mockCatRepo,
        mockLogRepo
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const chart = result.value;
        expect(chart.period).toBe("weekly");
        expect(chart.data).toHaveLength(2);

        const week1 = chart.data.find((d) => d.date === "2024-01-08");
        expect(week1).toBeDefined();
        expect(week1!.urineCount).toBe(1);
        expect(week1!.fecesCount).toBe(1);
        expect(week1!.totalCount).toBe(2);

        const week2 = chart.data.find((d) => d.date === "2024-01-15");
        expect(week2).toBeDefined();
        expect(week2!.urineCount).toBe(1);
        expect(week2!.fecesCount).toBe(0);
        expect(week2!.totalCount).toBe(1);
      }

      expect(mockLogRepo.aggregateByPeriod).toHaveBeenCalledWith(
        userId,
        "2024-01-08T00:00:00.000Z",
        "2024-01-21T23:59:59.999Z",
        "weekly",
        undefined
      );
    });

    it("should aggregate by month for monthly period", async () => {
      vi.mocked(mockLogRepo.aggregateByPeriod).mockReturnValue(
        okAsync([
          { date: "2024-01", urineCount: 1, fecesCount: 1 },
          { date: "2024-02", urineCount: 1, fecesCount: 0 },
        ])
      );

      const query = {
        period: "month" as const,
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-02-28T23:59:59.999Z",
      };

      const result = await getChartData(
        query,
        userId,
        mockCatRepo,
        mockLogRepo
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const chart = result.value;
        expect(chart.period).toBe("monthly");
        expect(chart.data).toHaveLength(2);

        const jan = chart.data.find((d) => d.date === "2024-01");
        expect(jan).toBeDefined();
        expect(jan!.urineCount).toBe(1);
        expect(jan!.fecesCount).toBe(1);
        expect(jan!.totalCount).toBe(2);

        const feb = chart.data.find((d) => d.date === "2024-02");
        expect(feb).toBeDefined();
        expect(feb!.urineCount).toBe(1);
        expect(feb!.fecesCount).toBe(0);
        expect(feb!.totalCount).toBe(1);
      }
    });

    it("should return empty data when no logs exist", async () => {
      vi.mocked(mockLogRepo.aggregateByPeriod).mockReturnValue(okAsync([]));

      const query = {
        period: "today" as const,
        from: "2024-01-13T00:00:00.000Z",
        to: "2024-01-13T23:59:59.999Z",
      };

      const result = await getChartData(
        query,
        userId,
        mockCatRepo,
        mockLogRepo
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.data).toHaveLength(0);
      }
    });

    it("should return validation error for invalid query", async () => {
      const query = {
        catId: "invalid-uuid",
        period: "today",
      };

      const result = await getChartData(
        query,
        userId,
        mockCatRepo,
        mockLogRepo
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
    });

    it("should return not_found when specified cat does not exist", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(null));

      const query = {
        catId: catId1,
        period: "today",
        from: "2024-01-13T00:00:00.000Z",
        to: "2024-01-13T23:59:59.999Z",
      };

      const result = await getChartData(
        query,
        userId,
        mockCatRepo,
        mockLogRepo
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
        if (result.error.type === "not_found") {
          expect(result.error.resource).toBe("cat");
        }
      }
    });

    it("should propagate database error from logRepo", async () => {
      vi.mocked(mockLogRepo.aggregateByPeriod).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const query = {
        period: "today",
        from: "2024-01-13T00:00:00.000Z",
        to: "2024-01-13T23:59:59.999Z",
      };

      const result = await getChartData(
        query,
        userId,
        mockCatRepo,
        mockLogRepo
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });

    it("should propagate database error from catRepo", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const query = {
        catId: catId1,
        period: "today",
        from: "2024-01-13T00:00:00.000Z",
        to: "2024-01-13T23:59:59.999Z",
      };

      const result = await getChartData(
        query,
        userId,
        mockCatRepo,
        mockLogRepo
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });
});
