import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ProgressIndicator } from '../components/ui/ProgressIndicator';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { getFilteredDataset } from '../core/filters/filterEngine';
import { Plus, Target, CheckCircle2, AlertTriangle, Trash2, ArrowUpRight } from 'lucide-react';

export interface UserDefinedGoal {
  id: string;
  title: string;
  column: string;
  targetValue: number;
  category: string;
  dueDate: string;
}

export const GoalsPage: React.FC = () => {
  const { datasets, activeDatasetId, filters } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  const filteredDataset = useMemo(() => {
    if (!activeDataset) return null;
    return getFilteredDataset(activeDataset, filters);
  }, [activeDataset, filters]);

  // Numerical columns in active dataset
  const numericalCols = useMemo(() => {
    if (!activeDataset) return [];
    return activeDataset.columns.filter((c) =>
      ['numeric', 'currency', 'percentage'].includes(activeDataset.profiles[c]?.inferredType)
    );
  }, [activeDataset]);

  // User-defined goals list
  const [goals, setGoals] = useState<UserDefinedGoal[]>([
    {
      id: 'usr-goal-1',
      title: 'Q4 Commercial Expansion Quota',
      column: numericalCols[0] || 'amount',
      targetValue: 250000,
      category: 'Sales Strategy',
      dueDate: 'Q4 2026',
    },
    {
      id: 'usr-goal-2',
      title: 'Operational Velocity Benchmark',
      column: numericalCols[1] || numericalCols[0] || 'records',
      targetValue: 100000,
      category: 'Operations',
      dueDate: 'End of Year',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formColumn, setFormColumn] = useState(numericalCols[0] || '');
  const [formTarget, setFormTarget] = useState('100000');
  const [formCategory] = useState('Growth');
  const [formDueDate, setFormDueDate] = useState('Q1 2027');

  // Compute actual sum for a given column
  const computeActualForColumn = (col: string): number => {
    const dataRows = (filteredDataset || activeDataset)?.data;
    if (!dataRows || dataRows.length === 0) return 150000;
    if (!activeDataset.columns.includes(col)) {
      // Fallback to first numeric or row count
      const firstNum = numericalCols[0];
      if (!firstNum) return dataRows.length * 1000;
      col = firstNum;
    }

    const parseNum = (v: any) => Number(String(v || '0').replace(/[$€£¥,%\s]/g, '')) || 0;
    return dataRows.reduce((acc, row) => acc + parseNum(row[col]), 0);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formTarget) return;

    const newGoal: UserDefinedGoal = {
      id: `usr-goal-${Date.now()}`,
      title: formTitle.trim(),
      column: formColumn || numericalCols[0] || 'metric',
      targetValue: Number(formTarget) || 50000,
      category: formCategory.trim() || 'General',
      dueDate: formDueDate.trim() || '2027',
    };

    setGoals((prev) => [...prev, newGoal]);
    setFormTitle('');
    setIsModalOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Goals & Quota Attainment</h1>
          <p className="text-xs text-slate-500 mt-1">
            Compare custom user-defined targets against live dataset actuals ({activeDataset?.name || 'Demo Mode'}).
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Define Target
        </Button>
      </div>

      {/* Global Dynamic Filter Bar */}
      {activeDataset && (
        <GlobalFilterBar />
      )}

      {/* Target Definition Modal / Drawer */}
      {isModalOpen && (
        <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-lg animate-scale-in">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Define Custom Business Target</h3>
            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Goal Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Q4 Regional Revenue Target"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Metric Field</label>
              <select
                value={formColumn}
                onChange={(e) => setFormColumn(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono bg-white"
              >
                {numericalCols.length > 0 ? (
                  numericalCols.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))
                ) : (
                  <option value="amount">amount (default)</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Benchmark Value ($)</label>
              <input
                type="number"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                placeholder="200000"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Deadline / Period</label>
              <input
                type="text"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                placeholder="e.g. Q4 2026"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full">
              Save Target
            </Button>
          </form>
        </div>
      )}

      {/* Goals Attainment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.map((goal) => {
          const actualVal = computeActualForColumn(goal.column);
          const progressPercent = goal.targetValue > 0
            ? Math.min(Math.round((actualVal / goal.targetValue) * 100), 200)
            : 0;
          const variance = actualVal - goal.targetValue;
          const isAhead = progressPercent >= 100;
          const isAtRisk = progressPercent < 70;

          return (
            <div
              key={goal.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={isAhead ? 'success' : isAtRisk ? 'warning' : 'purple'} size="sm">
                      {goal.category}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400">Field: {goal.column}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">Target: {goal.dueDate}</span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">{goal.title}</h3>
                  {isAhead ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Target Met ({progressPercent}%)
                    </span>
                  ) : isAtRisk ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> At Risk ({progressPercent}%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      <Target className="w-3 h-3" /> On Track ({progressPercent}%)
                    </span>
                  )}
                </div>

                {/* Actual vs Benchmark Numbers */}
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    ${actualVal.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    actual vs ${goal.targetValue.toLocaleString()} target
                  </span>
                </div>

                {/* Variance Display */}
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="text-slate-500">Variance:</span>
                  <span className={`font-mono font-bold flex items-center ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {variance >= 0 ? `+$${variance.toLocaleString()}` : `-$${Math.abs(variance).toLocaleString()}`}
                    <ArrowUpRight className={`w-3 h-3 ml-0.5 ${variance < 0 ? 'rotate-90' : ''}`} />
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <ProgressIndicator
                  value={progressPercent}
                  label="Attainment Rate"
                  variant={isAhead ? 'success' : isAtRisk ? 'warning' : 'primary'}
                  size="md"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
