/**
 * Weekly Key SQL Expression Tests
 *
 * Verifies that the SQLite expression `date(timestamp, '-6 days', 'weekday 1')`
 * correctly computes the Monday of the week for any given timestamp.
 *
 * Uses better-sqlite3 to run the actual SQL expression against a real SQLite engine,
 * ensuring the aggregateByPeriod weekly grouping is semantically correct.
 */

import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";

describe("Weekly key SQL expression", () => {
  const db = new Database(":memory:");
  const weeklyKey = (timestamp: string): string => {
    const row = db
      .prepare(`SELECT date(?, '-6 days', 'weekday 1') AS week_start`)
      .get(timestamp) as { week_start: string };
    return row.week_start;
  };

  it("should return same Monday for Monday input", () => {
    // 2024-01-08 is Monday
    expect(weeklyKey("2024-01-08T08:00:00.000Z")).toBe("2024-01-08");
  });

  it("should return Monday for Tuesday input", () => {
    // 2024-01-09 is Tuesday
    expect(weeklyKey("2024-01-09T10:00:00.000Z")).toBe("2024-01-08");
  });

  it("should return Monday for Wednesday input", () => {
    // 2024-01-10 is Wednesday
    expect(weeklyKey("2024-01-10T12:00:00.000Z")).toBe("2024-01-08");
  });

  it("should return Monday for Thursday input", () => {
    // 2024-01-11 is Thursday
    expect(weeklyKey("2024-01-11T14:00:00.000Z")).toBe("2024-01-08");
  });

  it("should return Monday for Friday input", () => {
    // 2024-01-12 is Friday
    expect(weeklyKey("2024-01-12T16:00:00.000Z")).toBe("2024-01-08");
  });

  it("should return Monday for Saturday input", () => {
    // 2024-01-13 is Saturday
    expect(weeklyKey("2024-01-13T18:00:00.000Z")).toBe("2024-01-08");
  });

  it("should return Monday for Sunday input", () => {
    // 2024-01-14 is Sunday
    expect(weeklyKey("2024-01-14T20:00:00.000Z")).toBe("2024-01-08");
  });

  it("should return next Monday for next week boundary", () => {
    // 2024-01-15 is next Monday
    expect(weeklyKey("2024-01-15T08:00:00.000Z")).toBe("2024-01-15");
  });

  it("should handle year boundary correctly", () => {
    // 2023-12-31 is Sunday → week starts 2023-12-25 (Monday)
    expect(weeklyKey("2023-12-31T12:00:00.000Z")).toBe("2023-12-25");
    // 2024-01-01 is Monday → week starts 2024-01-01
    expect(weeklyKey("2024-01-01T12:00:00.000Z")).toBe("2024-01-01");
  });
});
