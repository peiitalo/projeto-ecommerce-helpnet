import React from 'react';

// Simple responsive SVG bar chart (no deps)
export default function BarChart({ data = [], height = 160, color = '#16a34a' }) {
  const width = 600; // container will scale via CSS
  const padding = 24;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const values = data.map(d => d.value ?? 0);
  const max = Math.max(1, ...values);
  const barGap = 6;
  const barWidth = values.length > 0 ? (w - barGap * (values.length - 1)) / values.length : 0;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {values.map((v, i) => {
          const x = padding + i * (barWidth + barGap);
          const barHeight = (v / max) * h;
          const y = height - padding - barHeight;
          return (
            <rect key={i} x={x} y={y} width={barWidth} height={barHeight} rx={4} fill={color} />
          );
        })}
      </svg>
    </div>
  );
}