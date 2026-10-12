export function createSparklinePaths(values: number[]) {
  if (values.length === 0) return { line: '', area: '' };

  const step = values.length > 1 ? 100 / (values.length - 1) : 0;
  const points = values.map((value, index) => ({ x: index * step, y: 48 - value * 0.5 }));
  if (points.length === 1) {
    return { line: `M0,${points[0].y} H100`, area: `M0,50 V${points[0].y} H100 V50 Z` };
  }

  const slopes = points.slice(1).map((point, index) => (point.y - points[index].y) / step);
  // Monotone tangents round the joins without inventing peaks between samples.
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    const before = slopes[index - 1];
    const after = slopes[index];
    return before * after <= 0 ? 0 : 2 * before * after / (before + after);
  });

  let line = `M${points[0].x},${points[0].y}`;
  for (let index = 1; index < points.length; index++) {
    const before = points[index - 1];
    const point = points[index];
    line += ` C${before.x + step / 3},${before.y + tangents[index - 1] * step / 3} ${point.x - step / 3},${point.y - tangents[index] * step / 3} ${point.x},${point.y}`;
  }
  return { line, area: `${line} L100,50 L0,50 Z` };
}
