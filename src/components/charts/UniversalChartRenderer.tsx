import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ChartSpecification } from '../../types';
import { processChartData } from '../../core/charts/chartDataProcessor';
import { formatMetricValue } from '../../core/metrics/kpiGenerator';

export interface UniversalChartRendererProps {
  spec: ChartSpecification;
  data: Record<string, any>[];
  height?: number;
  onElementClick?: (dataPoint: any) => void;
  onCrossFilter?: (column: string, value: any) => void;
  activeCrossFilter?: { column: string; value: any } | null;
}

const DEFAULT_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export const UniversalChartRenderer: React.FC<UniversalChartRendererProps> = ({
  spec,
  data,
  height = 280,
  onElementClick,
  onCrossFilter,
  activeCrossFilter,
}) => {
  const { chartData, seriesKeys } = useMemo(
    () => processChartData(data, spec),
    [data, spec]
  );

  const colors = spec.colorScheme && spec.colorScheme.length > 0 ? spec.colorScheme : DEFAULT_COLORS;
  const primarySeries = seriesKeys[0] || 'value';
  const xAxisKey = spec.xAxisColumn;

  const handleItemClick = (entry: any) => {
    const clickedVal = entry?.[xAxisKey] ?? entry?.payload?.[xAxisKey] ?? entry?.name;
    if (clickedVal !== undefined) {
      if (onCrossFilter) {
        onCrossFilter(xAxisKey, clickedVal);
      }
    }
    if (onElementClick) {
      onElementClick(entry);
    }
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div 
        style={{ height }} 
        className="w-full flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 text-center"
      >
        <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
        <p className="font-semibold text-slate-600">Visualization Dimension Unavailable</p>
        <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
          {spec.description || `Required columns [${spec.xAxisColumn}, ${spec.yAxisColumns.join(', ')}] have insufficient non-null values.`}
        </p>
      </div>
    );
  }

  // 1. Area Chart (Smooth Temporal Trends)
  if (spec.chartType === 'area') {
    return (
      <div style={{ width: '100%', height }} className="min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${spec.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.30} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? formatMetricValue(v, 'compact') : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
              formatter={(val: any) => [typeof val === 'number' ? formatMetricValue(val, 'number') : val, spec.yAxisColumns[0]]}
            />
            <Area
              type={spec.isSmooth ? 'monotone' : 'linear'}
              dataKey={primarySeries}
              stroke={colors[0]}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#grad-${spec.id})`}
              onClick={handleItemClick}
              cursor="pointer"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 2. Line Chart
  if (spec.chartType === 'line') {
    return (
      <div style={{ width: '100%', height }} className="min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? formatMetricValue(v, 'compact') : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
            />
            {spec.showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />}
            {seriesKeys.map((key, idx) => (
              <Line
                key={key}
                type={spec.isSmooth ? 'monotone' : 'linear'}
                dataKey={key}
                name={key.replace(/[_\-]/g, ' ').toUpperCase()}
                stroke={colors[idx % colors.length]}
                strokeWidth={2.5}
                dot={{ r: 3, fill: colors[idx % colors.length] }}
                activeDot={{ r: 5, onClick: handleItemClick }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 3. Vertical Bar Chart (with cross-filtering cell dimming)
  if (spec.chartType === 'bar') {
    return (
      <div style={{ width: '100%', height }} className="min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? formatMetricValue(v, 'compact') : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
            />
            <Bar dataKey={primarySeries} radius={[6, 6, 0, 0]} onClick={handleItemClick}>
              {chartData.map((entry, index) => {
                const isDimmed =
                  activeCrossFilter &&
                  activeCrossFilter.column === xAxisKey &&
                  String(entry[xAxisKey]) !== String(activeCrossFilter.value);
                const isSelected =
                  activeCrossFilter &&
                  activeCrossFilter.column === xAxisKey &&
                  String(entry[xAxisKey]) === String(activeCrossFilter.value);

                return (
                  <Cell
                    key={`bar-cell-${index}`}
                    fill={colors[index % colors.length]}
                    fillOpacity={isDimmed ? 0.35 : 1.0}
                    stroke={isSelected ? '#4f46e5' : undefined}
                    strokeWidth={isSelected ? 2 : 0}
                    cursor="pointer"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 4. Horizontal Bar Chart (with cross-filtering cell dimming)
  if (spec.chartType === 'horizontal_bar') {
    return (
      <div style={{ width: '100%', height }} className="min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? formatMetricValue(v, 'compact') : v)}
            />
            <YAxis
              dataKey={xAxisKey}
              type="category"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#334155', fontSize: 11 }}
              width={85}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
            />
            <Bar dataKey={primarySeries} radius={[0, 6, 6, 0]} onClick={handleItemClick}>
              {chartData.map((entry, index) => {
                const isDimmed =
                  activeCrossFilter &&
                  activeCrossFilter.column === xAxisKey &&
                  String(entry[xAxisKey]) !== String(activeCrossFilter.value);
                const isSelected =
                  activeCrossFilter &&
                  activeCrossFilter.column === xAxisKey &&
                  String(entry[xAxisKey]) === String(activeCrossFilter.value);

                return (
                  <Cell
                    key={`hbar-cell-${index}`}
                    fill={colors[index % colors.length]}
                    fillOpacity={isDimmed ? 0.35 : 1.0}
                    stroke={isSelected ? '#4f46e5' : undefined}
                    strokeWidth={isSelected ? 2 : 0}
                    cursor="pointer"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 5. Donut / Pie Chart (with cross-filtering cell dimming)
  if (spec.chartType === 'donut') {
    return (
      <div style={{ width: '100%', height }} className="min-w-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
              formatter={(val: any) => [typeof val === 'number' ? formatMetricValue(val, 'number') : val, 'Share']}
            />
            {spec.showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />}
            <Pie
              data={chartData}
              dataKey={primarySeries}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              onClick={handleItemClick}
            >
              {chartData.map((entry, index) => {
                const isDimmed =
                  activeCrossFilter &&
                  activeCrossFilter.column === xAxisKey &&
                  String(entry[xAxisKey]) !== String(activeCrossFilter.value);
                const isSelected =
                  activeCrossFilter &&
                  activeCrossFilter.column === xAxisKey &&
                  String(entry[xAxisKey]) === String(activeCrossFilter.value);

                return (
                  <Cell
                    key={`pie-cell-${index}`}
                    fill={colors[index % colors.length]}
                    fillOpacity={isDimmed ? 0.35 : 1.0}
                    stroke={isSelected ? '#4f46e5' : '#ffffff'}
                    strokeWidth={isSelected ? 2.5 : 1}
                    cursor="pointer"
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 6. Scatter Plot
  if (spec.chartType === 'scatter') {
    return (
      <div style={{ width: '100%', height }} className="min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="x"
              name={spec.xAxisColumn}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              dataKey="y"
              name={spec.yAxisColumns[0]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
            />
            <Scatter
              name={spec.title}
              data={chartData}
              fill={colors[0]}
              onClick={handleItemClick}
              cursor="pointer"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
};
