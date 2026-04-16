import React, { useEffect, useRef } from 'react';

// Loads Chart.js once from CDN and caches it on window
const CHART_CDN = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';

function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (window.Chart) return resolve(window.Chart);
    const existing = document.querySelector(`script[src="${CHART_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Chart));
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = CHART_CDN;
    s.onload = () => resolve(window.Chart);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const GRID = 'rgba(255,255,255,0.07)';
const TICK = '#6e7681';

const defaultScales = {
  x: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 11 } } },
  y: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 11 } } },
};

/**
 * FitChart — wraps Chart.js with the dark FitApp theme.
 * Props:
 *   type: 'bar' | 'line' | 'doughnut'
 *   labels: string[]
 *   datasets: Chart.js dataset objects
 *   height: number (px, default 220)
 *   options: partial Chart.js options to merge
 *   showLegend: bool (default false)
 */
const FitChart = ({ type = 'bar', labels = [], datasets = [], height = 220, options = {}, showLegend = false }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    loadChartJs().then(Chart => {
      if (!mounted || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const isDoughnut = type === 'doughnut' || type === 'pie';

      chartRef.current = new Chart(canvasRef.current, {
        type,
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: showLegend,
              labels: { color: TICK, font: { size: 11 }, boxWidth: 10, boxHeight: 10 },
            },
          },
          ...(isDoughnut ? { cutout: '65%' } : {
            scales: defaultScales,
          }),
          ...options,
        },
      });
    }).catch(err => console.warn('Chart.js failed to load', err));

    return () => {
      mounted = false;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [type, JSON.stringify(labels), JSON.stringify(datasets), showLegend]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <canvas ref={canvasRef} role="img" aria-label={`${type} chart`} />
    </div>
  );
};

// ── Dataset helpers ──────────────────────────────────────────────────

export function lineDataset(label, data, color, fill = false) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: fill ? color.replace(')', ', 0.12)').replace('rgb', 'rgba') : 'transparent',
    fill,
    tension: 0.4,
    pointRadius: 3,
    pointBackgroundColor: color,
    borderWidth: 2,
  };
}

export function barDataset(label, data, color) {
  return {
    label,
    data,
    backgroundColor: color.replace(')', ', 0.18)').replace('rgb', 'rgba'),
    borderColor: color,
    borderWidth: 1.5,
    borderRadius: 5,
  };
}

export function doughnutDataset(data, colors) {
  return {
    data,
    backgroundColor: colors,
    borderColor: '#161b22',
    borderWidth: 2,
    hoverOffset: 4,
  };
}

export default FitChart;
