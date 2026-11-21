import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import { Sparkles, Code2, ChevronDown, ChevronRight, Copy, Check, Table } from 'lucide-react';
import { ChatChartRenderer } from './ChatChartRenderer';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onSelectPrompt?: (prompt: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onSelectPrompt,
}) => {
  const isUser = message.role === 'user';
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasCode = !!(message.pandasCodeRepresentation || message.sqlOrQueryRepresentation);

  return (
    <div
      className={`flex items-start gap-3 w-full animate-fade-in ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Avatar for AI */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm text-white">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl text-xs leading-relaxed transition-all shadow-xs ${
          isUser
            ? 'bg-purple-600 text-white p-3.5 rounded-tr-none'
            : 'bg-white text-slate-800 p-4 border border-slate-200/90 rounded-tl-none space-y-3'
        }`}
      >
        {/* Main Content Text */}
        <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
          {message.content}
        </div>

        {/* Highlighted KPI Metric Cards */}
        {!isUser && message.insights?.metricsHighlighted && message.insights.metricsHighlighted.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {message.insights.metricsHighlighted.map((kpi, idx) => (
              <div
                key={idx}
                className="bg-purple-50/70 border border-purple-100 rounded-xl p-2 flex flex-col"
              >
                <span className="text-[10px] text-purple-700/80 font-medium truncate">
                  {kpi.label}
                </span>
                <span className="text-sm font-extrabold text-purple-950 tracking-tight mt-0.5">
                  {kpi.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Embedded Chart Suggestion */}
        {!isUser && message.insights?.chartSuggestion && (
          <div className="pt-1">
            <ChatChartRenderer
              chartType={message.insights.chartSuggestion.chartType}
              data={(message.insights.chartSuggestion as any).data || []}
              xAxisKey={
                message.insights.chartSuggestion.xAxisColumn ||
                (message.insights.chartSuggestion as any).xAxisKey ||
                'name'
              }
              seriesKey={
                message.insights.chartSuggestion.yAxisColumns?.[0] ||
                (message.insights.chartSuggestion as any).series?.[0]?.key ||
                'value'
              }
              title={message.insights.chartSuggestion.title}
              height={180}
            />
          </div>
        )}

        {/* Mini Data Table */}
        {!isUser && message.tableData && message.tableData.rows.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-2 bg-slate-50/50">
            <div className="bg-slate-100/80 px-3 py-1.5 border-b border-slate-200 flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <Table className="w-3.5 h-3.5 text-purple-600" />
              <span>Query Results Preview</span>
            </div>
            <div className="max-h-44 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-500 font-semibold">
                  <tr>
                    {message.tableData.headers.map((h, i) => (
                      <th key={i} className="px-3 py-1.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {message.tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-purple-50/30 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap text-slate-700 font-medium">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Collapsible Pandas / SQL Query Inspector */}
        {!isUser && hasCode && (
          <div className="border border-slate-200/80 rounded-xl overflow-hidden mt-2 bg-slate-900 text-slate-100">
            <button
              onClick={() => setShowCode(!showCode)}
              className="w-full px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-[11px] font-mono font-medium flex items-center justify-between text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Deterministic Calculation Logic</span>
              </div>
              {showCode ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {showCode && (
              <div className="p-3 text-[11px] font-mono space-y-2 relative bg-slate-950">
                {message.pandasCodeRepresentation && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-purple-400 font-semibold mb-1">
                      <span>Python (Pandas):</span>
                      <button
                        onClick={() => handleCopyCode(message.pandasCodeRepresentation!)}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2 bg-slate-900 rounded-lg text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {message.pandasCodeRepresentation}
                    </pre>
                  </div>
                )}

                {message.sqlOrQueryRepresentation && (
                  <div className="pt-1 border-t border-slate-800">
                    <span className="text-[10px] text-indigo-400 font-semibold block mb-1">
                      SQL Equivalent:
                    </span>
                    <pre className="p-2 bg-slate-900 rounded-lg text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {message.sqlOrQueryRepresentation}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Follow-up question chips */}
        {!isUser && message.insights?.nextQuestions && message.insights.nextQuestions.length > 0 && onSelectPrompt && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold w-full block">
              Suggested Follow-ups:
            </span>
            {message.insights.nextQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(q)}
                className="text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100/80 hover:text-purple-900 border border-purple-200/80 rounded-full px-2.5 py-1 transition-all text-left flex items-center gap-1 active:scale-95"
              >
                <span>{q}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-[9px] pt-1 ${
            isUser ? 'text-purple-200 text-right' : 'text-slate-400 text-left'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Avatar for User */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200 shadow-xs">
          U
        </div>
      )}
    </div>
  );
};
