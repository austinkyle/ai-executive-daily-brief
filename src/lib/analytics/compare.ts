type DataPoint = { date: string; value: number };
type Comparison = {
  current: number | null;
  previous: number | null;
  absoluteChange: number | null;
  percentChange: number | null;
};

function addDays(date: string, delta: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  result.setUTCDate(result.getUTCDate() + delta);

  return result.toISOString().slice(0, 10);
}

function sortedValuesByDate(series: DataPoint[]): Map<string, number> {
  return new Map(
    [...series].sort((left, right) => left.date.localeCompare(right.date)).map(
      ({ date, value }): [string, number] => [date, value],
    ),
  );
}

function compareWithPrevious(
  series: DataPoint[],
  targetDate: string,
  previousDate: string,
): Comparison {
  const valuesByDate = sortedValuesByDate(series);
  const current = valuesByDate.get(targetDate) ?? null;
  const previous = valuesByDate.get(previousDate) ?? null;
  const absoluteChange =
    current === null || previous === null ? null : current - previous;
  const percentChange =
    absoluteChange === null || previous === null || previous === 0
      ? null
      : absoluteChange / previous;

  return { current, previous, absoluteChange, percentChange };
}

export function dayOverDay(series: DataPoint[], targetDate: string): Comparison {
  return compareWithPrevious(series, targetDate, addDays(targetDate, -1));
}

export function sameWeekdayWoW(
  series: DataPoint[],
  targetDate: string,
): Comparison {
  return compareWithPrevious(series, targetDate, addDays(targetDate, -7));
}

export function trailing7Avg(
  series: DataPoint[],
  targetDate: string,
  options?: { excludeCurrent?: boolean },
): { average: number | null; daysIncluded: number } {
  const valuesByDate = sortedValuesByDate(series);
  const endOffset = options?.excludeCurrent ? -1 : 0;
  const startOffset = endOffset - 6;
  const values: number[] = [];

  for (let offset = startOffset; offset <= endOffset; offset += 1) {
    const value = valuesByDate.get(addDays(targetDate, offset));
    if (value !== undefined) {
      values.push(value);
    }
  }

  const daysIncluded = values.length;
  const average =
    daysIncluded === 0
      ? null
      : values.reduce((sum, value) => sum + value, 0) / daysIncluded;

  return { average, daysIncluded };
}

export function targetVariance(
  actual: number,
  target: number,
): {
  actual: number;
  target: number;
  absoluteVariance: number;
  percentVariance: number | null;
} {
  const absoluteVariance = actual - target;

  return {
    actual,
    target,
    absoluteVariance,
    percentVariance: target === 0 ? null : absoluteVariance / target,
  };
}

export function windowTrend(
  series: DataPoint[],
  windowDays: number,
): {
  startAverage: number | null;
  endAverage: number | null;
  absoluteChange: number | null;
  percentChange: number | null;
  daysAvailable: number;
} {
  const sortedSeries = [...series].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const average = (values: DataPoint[]): number | null =>
    values.length === 0
      ? null
      : values.reduce((sum, point) => sum + point.value, 0) / values.length;
  const startAverage = average(sortedSeries.slice(0, windowDays));
  const endAverage = average(
    sortedSeries.slice(Math.max(sortedSeries.length - windowDays, 0)),
  );
  const absoluteChange =
    startAverage === null || endAverage === null
      ? null
      : endAverage - startAverage;
  const percentChange =
    absoluteChange === null || startAverage === null || startAverage === 0
      ? null
      : absoluteChange / startAverage;

  return {
    startAverage,
    endAverage,
    absoluteChange,
    percentChange,
    daysAvailable: sortedSeries.length,
  };
}
