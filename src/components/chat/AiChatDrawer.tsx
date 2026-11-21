import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Sparkles, 
  X, 
  Send, 
  Trash2, 
  Database, 
  Loader2, 
  Maximize2 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ChatMessageBubble } from './ChatMessageBubble';
import { generateSuggestedQuestions } from '../../core/ai/suggestedQuestions';

interface AiChatDrawerProps {
  onNavigateToFullPage?: () => void;
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({ onNavigateToFullPage }) => {
  const {
    isChatOpen,
    setChatOpen,
    chatMessages,
    isAiAnalyzing,
    executeAiQuery,
    clearChatMessages,
    datasets,
    activeDatasetId,
  } = useAppStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];
  const suggestedPrompts = generateSuggestedQuestions(activeDataset);

  // Auto-scroll to bottom on new message or when opened
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

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

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-fade-in pointer-events-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={() => setChatOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">OmniBI AI Analyst</h2>
                <Badge variant="purple" size="sm">Copilot</Badge>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                {activeDataset ? (
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3 text-purple-600 inline" />
                    <span>Active: {activeDataset.name}</span>
                  </span>
                ) : (
                  'No dataset active'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onNavigateToFullPage && (
              <button
                onClick={() => {
                  setChatOpen(false);
                  onNavigateToFullPage();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Open Full Screen Studio"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={clearChatMessages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
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
              <span>Analyzing schema & computing deterministic metrics...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips (if few messages) */}
        {chatMessages.length <= 3 && suggestedPrompts.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Suggested Questions
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPrompt(prompt)}
                  disabled={isAiAnalyzing}
                  className="text-[11px] text-slate-700 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200/80 hover:border-purple-200 rounded-lg px-2.5 py-1 text-left transition-colors truncate max-w-full"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Query Input Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder={
              activeDataset
                ? `Ask about ${activeDataset.name} (e.g. "Total revenue", "Top 5 by sales")...`
                : 'Upload or select a dataset to ask questions...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isAiAnalyzing}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
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
    </div>
  );
};
