import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Send, 
  Bot, 
  Database, 
  Trash2, 
  Download, 
  Lightbulb, 
  Layers, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { ChatMessageBubble } from '../components/chat/ChatMessageBubble';
import { 
  generateSuggestedQuestions, 
  getCategorizedSuggestedQuestions 
} from '../core/ai/suggestedQuestions';

export const AiAnalystPage: React.FC = () => {
  const {
    chatMessages,
    isAiAnalyzing,
    executeAiQuery,
    clearChatMessages,
    datasets,
    activeDatasetId,
    setActiveDatasetId,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];
  const quickPrompts = generateSuggestedQuestions(activeDataset);
  const categorizedPrompts = getCategorizedSuggestedQuestions(activeDataset);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || isAiAnalyzing) return;
    const query = input;
    setInput('');
    await executeAiQuery(query);
  };

  const handleSelectPrompt = async (prompt: string) => {
    if (isAiAnalyzing) return;
    await executeAiQuery(prompt);
  };

  const handleExportChat = (format: 'markdown' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    let filename = `omnibi-ai-analyst-${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(chatMessages, null, 2);
      mimeType = 'application/json';
      filename += '.json';
    } else {
      content = `# OmniBI AI Analyst Chat Transcript\n*Active Dataset: ${activeDataset?.name || 'None'}*\n*Exported: ${new Date().toLocaleString()}*\n\n---\n\n`;
      chatMessages.forEach((m) => {
        const author = m.role === 'user' ? 'User' : 'AI Analyst';
        content += `### ${author} (${new Date(m.timestamp).toLocaleTimeString()})\n${m.content}\n\n`;
        if (m.pandasCodeRepresentation) {
          content += `\`\`\`python\n${m.pandasCodeRepresentation}\n\`\`\`\n\n`;
        }
      });
      mimeType = 'text/markdown';
      filename += '.md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              AI Data Analyst & Copilot
            </h1>
            <Badge variant="purple">Autonomous</Badge>
            <Badge variant="success">Zero Hallucination</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Conversational natural language query engine with deterministic mathematical execution and real-time chart synthesis.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {datasets.length > 1 && (
            <select
              value={activeDatasetId || ''}
              onChange={(e) => setActiveDatasetId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.rowCount.toLocaleString()} rows)
                </option>
              ))}
            </select>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportChat('markdown')}
            leftIcon={<Download className="w-3.5 h-3.5 text-purple-600" />}
          >
            Export Chat
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={clearChatMessages}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-slate-400" />}
          >
            Clear
          </Button>
        </div>
      </div>

      {copiedNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Chat transcript exported successfully!</span>
        </div>
      )}

      {/* Main Grid: Chat Stream (Left 2 cols) + Telemetry & Prompts (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Stream Viewport */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Stream Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-900">Conversational Analytics Stream</span>
              {activeDataset && (
                <span className="text-[11px] text-slate-500 font-medium">
                  • {activeDataset.name}
                </span>
              )}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Deterministic Engine Active
            </span>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {chatMessages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onSelectPrompt={handleSelectPrompt}
              />
            ))}

            {isAiAnalyzing && (
              <div className="flex items-center gap-2 text-xs text-purple-600 font-medium bg-purple-50 p-3 rounded-2xl border border-purple-100 max-w-[80%] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Parsing semantic query & computing statistical aggregations...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel Bar */}
          {quickPrompts.length > 0 && (
            <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-500" /> Quick:
              </span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPrompt(prompt)}
                  disabled={isAiAnalyzing}
                  className="shrink-0 text-[11px] text-slate-700 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200/80 hover:border-purple-200 rounded-lg px-2.5 py-1 transition-colors whitespace-nowrap"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder={
                activeDataset
                  ? `Ask a question about ${activeDataset.name} (e.g., "What is the total revenue?", "Top 5 customers by sales")...`
                  : 'Load a dataset to start asking questions...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isAiAnalyzing}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={handleSend}
              disabled={!input.trim() || isAiAnalyzing}
              rightIcon={isAiAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            >
              Ask
            </Button>
          </div>
        </div>

        {/* Right Column: Active Telemetry & Prompt Catalog */}
        <div className="flex flex-col gap-5">
          {/* Active Dataset Telemetry Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-sm">Active Data Knowledge Base</CardTitle>
                </div>
                {activeDataset && (
                  <Badge variant="brand" size="sm">
                    {activeDataset.detectedDomain?.domainLabel || 'GENERAL'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {activeDataset ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Rows</span>
                      <span className="text-sm font-bold text-slate-900">
                        {activeDataset.rowCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Attributes</span>
                      <span className="text-sm font-bold text-slate-900">
                        {activeDataset.columns.length} columns
                      </span>
                    </div>
                  </div>

                  {/* Columns Pill List */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
                      Available Columns in Memory
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {activeDataset.columns.map((c) => {
                        const type = activeDataset.profiles?.[c]?.inferredType || 'text';
                        return (
                          <span
                            key={c}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${
                              type === 'numeric'
                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                : type === 'date'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {c}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-4 text-center">
                  No dataset active. Load sample data to inspect schema.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categorized Question Library */}
          <Card className="flex-1">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-sm">Inquiry Prompt Library</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3 max-h-[380px] overflow-y-auto space-y-4">
              {categorizedPrompts.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    {cat.category}
                  </span>
                  <div className="space-y-1">
                    {cat.questions.map((q, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSelectPrompt(q)}
                        disabled={isAiAnalyzing}
                        className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-purple-200 bg-slate-50/60 hover:bg-purple-50/40 text-xs text-slate-700 hover:text-purple-900 transition-colors block truncate"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
