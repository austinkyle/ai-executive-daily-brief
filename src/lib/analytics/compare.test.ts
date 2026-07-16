import { describe, expect, it } from "vitest";

import {
  dayOverDay,
  sameWeekdayWoW,
  targetVariance,
  trailing7Avg,
  windowTrend,
} from "./compare";

describe("dayOverDay", () => {
  it("calculates changes when both days are present", () => {
    expect(
      dayOverDay(
        [
          { date: "2026-07-10", value: 80 },
          { date: "2026-07-11", value: 100 },
        ],
        "2026-07-11",
      ),
    ).toEqual({
      current: 100,
      previous: 80,
      absoluteChange: 20,
      percentChange: 0.25,
    });
  });

  it("returns null changes when the previous day is missing", () => {
    expect(
      dayOverDay([{ date: "2026-07-11", value: 100 }], "2026-07-11"),
    ).toEqual({
      current: 100,
      previous: null,
      absoluteChange: null,
      percentChange: null,
    });
  });

  it("does not calculate a percentage from a zero previous value", () => {
    expect(
      dayOverDay(
        [
          { date: "2026-07-10", value: 0 },
          { date: "2026-07-11", value: 15 },
        ],
        "2026-07-11",
      ),
    ).toEqual({
      current: 15,
      previous: 0,
      absoluteChange: 15,
      percentChange: null,
    });
  });
});

describe("sameWeekdayWoW", () => {
  it("compares the target date with seven days earlier", () => {
    expect(
      sameWeekdayWoW(
        [
          { date: "2026-07-15", value: 70 },
          { date: "2026-07-08", value: 50 },
        ],
        "2026-07-15",
      ),
    ).toEqual({
      current: 70,
      previous: 50,
      absoluteChange: 20,
      percentChange: 0.4,
    });
  });
});

describe("trailing7Avg", () => {
  it("averages a complete seven-day window", () => {
    const series = Array.from({ length: 7 }, (_, index) => ({
      date: `2026-07-${String(index + 1).padStart(2, "0")}`,
      value: index + 1,
    }));

    expect(trailing7Avg(series, "2026-07-07")).toEqual({
      average: 4,
      daysIncluded: 7,
    });
  });

  it("uses only days with values in the window", () => {
    expect(
      trailing7Avg(
        [
          { date: "2026-07-01", value: 3 },
          { date: "2026-07-04", value: 9 },
          { date: "2026-07-07", value: 18 },
        ],
        "2026-07-07",
      ),
    ).toEqual({ average: 10, daysIncluded: 3 });
  });

  it("can exclude the target date from its baseline", () => {
    const series = [
      { date: "2026-07-01", value: 10 },
      { date: "2026-07-02", value: 10 },
      { date: "2026-07-03", value: 10 },
      { date: "2026-07-04", value: 10 },
      { date: "2026-07-05", value: 10 },
      { date: "2026-07-06", value: 10 },
      { date: "2026-07-07", value: 70 },
    ];

    expect(trailing7Avg(series, "2026-07-07")).toEqual({
      average: 130 / 7,
      daysIncluded: 7,
    });
    expect(trailing7Avg(series, "2026-07-07", { excludeCurrent: true })).toEqual({
      average: 10,
      daysIncluded: 6,
    });
  });
});

describe("targetVariance", () => {
  it("calculates absolute and percentage variance", () => {
    expect(targetVariance(120, 100)).toEqual({
      actual: 120,
      target: 100,
      absoluteVariance: 20,
      percentVariance: 0.2,
    });
  });

  it("does not calculate a percentage against a zero target", () => {
    expect(targetVariance(12, 0)).toEqual({
      actual: 12,
      target: 0,
      absoluteVariance: 12,
      percentVariance: null,
    });
  });
});

describe("windowTrend", () => {
  it("compares averages at each end of a sorted series", () => {
    const series = [
      { date: "2026-07-10", value: 100 },
      { date: "2026-07-09", value: 100 },
      { date: "2026-07-08", value: 100 },
      { date: "2026-07-07", value: 100 },
      { date: "2026-07-06", value: 100 },
      { date: "2026-07-05", value: 10 },
      { date: "2026-07-04", value: 10 },
      { date: "2026-07-03", value: 10 },
      { date: "2026-07-02", value: 10 },
      { date: "2026-07-01", value: 10 },
    ];

    expect(windowTrend(series, 3)).toEqual({
      startAverage: 10,
      endAverage: 100,
      absoluteChange: 90,
      percentChange: 9,
      daysAvailable: 10,
    });
  });
});
