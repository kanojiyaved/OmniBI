import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ChatChartProps {
  chartType: string;
  data: any[];
  xAxisKey: string;
  seriesKey?: string;
  title?: string;
  height?: number;
}

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export const ChatChartRenderer: React.FC<ChatChartProps> = ({
  chartType,
  data,
  xAxisKey,
  seriesKey = 'value',
  title,
  height = 190,
}) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 my-2">
      {title && (
        <div className="text-[11px] font-bold text-slate-700 mb-2 truncate flex items-center justify-between">
          <span>{title}</span>
          <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
            {chartType}
          </span>
        </div>
      )}

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey={seriesKey}
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#8b5cf6' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : chartType === 'donut' || chartType === 'pie' ? (
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                }}
              />
              <Pie
                data={data}
                dataKey={seriesKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                paddingAngle={3}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : chartType === 'scatter' ? (
            <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={xAxisKey} name={xAxisKey} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis dataKey={seriesKey} name={seriesKey} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Points" data={data} fill="#8b5cf6" />
            </ScatterChart>
          ) : (
            /* Bar Chart default */
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey={seriesKey} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
