import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Receipt,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Filter,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSkeleton, EmptyState } from '../components/common/Feedback';

export function AIInsights({ addToast, onNavigate }) {
  const [insights, setInsights] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await api.getInsights({ category, severity });
      setInsights(res);
    } catch (err) {
      addToast(err.message || 'Failed to load AI insights', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [category, severity]);

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Revenue': return TrendingUp;
      case 'Expense': return Receipt;
      case 'Cash Flow': return Scale;
      case 'Risk': return ShieldAlert;
      case 'Compliance': return ShieldCheck;
      default: return Sparkles;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Financial Insights Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Autonomous multi-agent intelligence analyzing revenue growth, expenses, and compliance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expense</option>
            <option value="Cash Flow">Cash Flow</option>
            <option value="Risk">Risk</option>
            <option value="Compliance">Compliance</option>
          </select>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Insights Cards Grid */}
      {loading ? (
        <LoadingSkeleton count={4} height="h-36" />
      ) : insights.length === 0 ? (
        <EmptyState
          title="No insights found for this filter"
          description="Clear filters to view all autonomous findings."
          onAction={() => { setCategory('ALL'); setSeverity('ALL'); }}
          actionText="Reset Filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((ins) => {
            const Icon = getCategoryIcon(ins.category);
            const dateStr = new Date(ins.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={ins.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">{ins.agent_name}</span>
                        <span className="text-[10px] text-slate-400 block">{dateStr}</span>
                      </div>
                    </div>
                    <StatusBadge status={ins.severity} />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-2">{ins.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 font-normal">
                    {ins.explanation}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Recommended Autonomous Action
                  </span>
                  <p className="text-xs font-bold text-fintech-700">
                    {ins.recommended_action}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
