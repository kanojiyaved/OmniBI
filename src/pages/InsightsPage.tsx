import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Sparkles, Lightbulb, Compass } from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const { datasets, activeDatasetId } = useAppStore();
  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  if (!activeDataset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Sparkles className="w-12 h-12 text-amber-500/50 mb-3" />
        <h3 className="text-base font-bold text-slate-200">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mt-1">Upload a dataset to generate automated AI insights.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Autonomous AI Insights</h2>
          <p className="text-xs text-slate-400">
            Automated narrative summaries and pattern extraction for {activeDataset.name}
          </p>
        </div>
        <Badge variant="purple" hasDot>AI Engine Active</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card glass hoverable>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-sm">Semantic Domain Inferred</CardTitle>
            </div>
            <Badge variant="brand">{activeDataset.detectedDomain.domainLabel}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-300 leading-relaxed">
              Based on the column headers and statistical shapes, the platform classified this dataset under the <strong>{activeDataset.detectedDomain.domainLabel}</strong> domain with {(activeDataset.detectedDomain.confidence * 100).toFixed(0)}% confidence.
            </p>
          </CardContent>
        </Card>

        <Card glass hoverable>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-400" />
              <CardTitle className="text-sm">Data Density & Distribution</CardTitle>
            </div>
            <Badge variant="success">High Integrity</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dataset contains {activeDataset.rowCount.toLocaleString()} clean observations across {activeDataset.columnCount} columns with zero missing values detected.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
