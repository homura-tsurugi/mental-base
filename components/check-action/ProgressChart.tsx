'use client';

import React from 'react';
import { ChartData } from '@/types';

interface ProgressChartProps {
  chartData: ChartData;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ chartData }) => {
  const maxValue = Math.max(...chartData.dataPoints.map((point) => point.value), 1);

  return (
    <div data-testid="progress-chart" className="bg-[var(--bg-primary)] rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons text-[var(--text-secondary)]">show_chart</span>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          {chartData.title}
        </h3>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-3">
        {chartData.dataPoints.map((point, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-8 text-sm text-[var(--text-secondary)] text-right">
              {point.label}
            </div>
            <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-6 relative overflow-hidden">
              <div
                data-testid="chart-bar"
                className="h-full bg-gradient-to-r from-[var(--check-color)] to-[var(--do-color)] rounded-full transition-all duration-500 flex items-center justify-end px-2"
                style={{ width: `${(point.value / maxValue) * 100}%` }}
              >
                {point.value > 0 && (
                  <span className="text-xs font-medium text-white">
                    {point.value}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Y-Axis Label */}
      {chartData.yAxisLabel && (
        <div className="text-xs text-[var(--text-tertiary)] text-center mt-3">
          {chartData.yAxisLabel}
        </div>
      )}
    </div>
  );
};
