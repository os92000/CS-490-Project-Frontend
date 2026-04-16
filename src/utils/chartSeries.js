const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeDate(value) {
  if (!value) return null;

  const date = value instanceof Date
    ? new Date(value)
    : new Date(String(value).includes('T') ? String(value) : `${String(value)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildBucketSeries(items, {
  periods,
  daysPerPeriod,
  endDate = new Date(),
  dateAccessor = (item) => item.date,
  valueAccessor = () => 1,
  aggregate = 'sum',
  labelFormatter = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
} = {}) {
  const normalizedEnd = normalizeDate(endDate);
  if (!normalizedEnd || !periods || !daysPerPeriod) {
    return { labels: [], values: [] };
  }

  const start = new Date(normalizedEnd);
  start.setDate(start.getDate() - ((periods * daysPerPeriod) - 1));

  const labels = Array.from({ length: periods }, (_, index) => {
    const bucketDate = new Date(start);
    bucketDate.setDate(start.getDate() + (index * daysPerPeriod));
    return labelFormatter(bucketDate, index);
  });

  const sums = Array(periods).fill(0);
  const counts = Array(periods).fill(0);

  items.forEach((item) => {
    const itemDate = normalizeDate(dateAccessor(item));
    if (!itemDate || itemDate < start || itemDate > normalizedEnd) return;

    const offsetDays = Math.floor((itemDate - start) / DAY_MS);
    const bucketIndex = Math.floor(offsetDays / daysPerPeriod);
    if (bucketIndex < 0 || bucketIndex >= periods) return;

    const numericValue = Number(valueAccessor(item));
    if (Number.isNaN(numericValue)) return;

    sums[bucketIndex] += numericValue;
    counts[bucketIndex] += 1;
  });

  const values = sums.map((sum, index) => {
    if (aggregate === 'average') {
      return counts[index] ? Number((sum / counts[index]).toFixed(2)) : null;
    }
    return sum;
  });

  return { labels, values };
}