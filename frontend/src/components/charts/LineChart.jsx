import React from 'react';

// Simple responsive SVG line chart (no deps)
export default function LineChart({ data = [], height = 160, color = '#2563eb', strokeWidth = 2, fill = 'rgba(37,99,235,0.08)' }) {
  const width = 600; // container will scale via CSS
  const padding = 24;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const values = data.map(d => d.value ?? 0);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);

  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w + padding;
    const y = height - padding - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const path = points.length > 0 ? `M ${points.join(' L ')}` : '';

  const areaPath = points.length > 0
    ? `M ${points[0]} L ${points.slice(1).join(' L ')} L ${padding + w},${height - padding} L ${padding},${height - padding} Z`
    : '';

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Area fill */}
        <path d={areaPath} fill={fill} stroke="none" />
        {/* Line */}
        <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}