import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  Zap,
  TrendingUp,
  Scale,
  Receipt,
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';

const SAMPLE_PROMPTS = [
  "Why is our cash flow under pressure?",
  "Why did profit decrease this month?",
  "Which expense category is growing fastest?",
  "What are my biggest financial risks?",
  "Will my cash balance fall below my reserve?",
  "Give me an executive financial summary."
];

export function Copilot({ addToast }) {
  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      sender: 'ai',
      text: "Hello! I am FinPilot Copilot — your autonomous Chief Financial Controller. I coordinate Revenue, Expense, Cash Flow, Risk, and Audit agents. Ask me anything about your current financial metrics, runway, budget overruns, or transaction anomalies.",
      supporting_numbers: null,
      reasoning: null,
      recommendation: null,
      active_agents: ["AI Controller Orchestrator"],
      ai_engine: "Deterministic Financial Engine"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(textToSend, []);
      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: res.answer,
        supporting_numbers: res.supporting_numbers,
        reasoning: res.reasoning,
        recommendation: res.recommended_action,
        active_agents: res.active_agents,
        data_sources_used: res.data_sources_used,
        ai_engine: res.ai_engine_used
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      addToast(err.message || 'Failed to query Copilot', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'ai',
          text: "I encountered an error retrieving data from the ledger. Please try again.",
          active_agents: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      {/* Copilot Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-fintech-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">FinPilot Copilot</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.2 rounded-full">
                Zero Hallucination Guard
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Grounded exclusively in verified SQLite ledger data</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium"
          title="Clear Conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-6 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-indigo-500" /> Prompts:
        </span>
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 bg-white hover:bg-fintech-50 text-slate-700 hover:text-fintech-700 rounded-full border border-slate-200 text-xs font-medium whitespace-nowrap shadow-xs transition-colors flex-shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-fintech-600 text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white font-medium shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-card'
              }`}
            >
              <div className="whitespace-pre-line font-normal">{msg.text}</div>

              {/* Supporting Numbers Grid if available */}
              {msg.supporting_numbers && Object.keys(msg.supporting_numbers).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(msg.supporting_numbers).map(([key, val]) => (
                    <div key={key} className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Diagnostic Reasoning & Recommendations */}
              {msg.reasoning && (
                <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-700 block uppercase text-[9px]">Diagnostic Reasoning</span>
                    <p className="text-slate-600 mt-0.5">{msg.reasoning}</p>
                  </div>

                  {msg.recommendation && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-bold text-fintech-700 block uppercase text-[9px]">Autonomous Action</span>
                      <p className="text-slate-700 font-semibold mt-0.5">{msg.recommendation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Consulted Agents Footer */}
              {msg.active_agents && msg.active_agents.length > 0 && (
                <div className="mt-2 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <span>Agents: {msg.active_agents.join(', ')}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> {msg.ai_engine || 'Deterministic Engine'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-fintech-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-fintech-600" />
              <span>Consulting specialized agents and verifying ledger facts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask a financial question (e.g. 'Why did profit decrease?', 'Which transactions to review?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-fintech-500 shadow-sm"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !input.trim()}
            icon={Send}
            className="text-xs"
          >
            Ask AI
          </Button>
        </form>
      </div>
    </div>
  );
}
