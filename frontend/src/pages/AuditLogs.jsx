import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { LoadingSkeleton, EmptyState } from '../components/common/Feedback';

export function AuditLogs({ addToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState('ALL');
  const [actionSearch, setActionSearch] = useState('');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({ entity, action: actionSearch, limit: 100 });
      setLogs(res);
    } catch (err) {
      addToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [entity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAuditLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Compliance & Immutable Audit Logs</h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Tamper Proof
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every transaction analysis, risk state update, and controller decision is logged immutably.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadAuditLogs}
          icon={RefreshCw}
          className="text-xs"
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action or keyword (e.g. APPROVED, BUDGET, BLOCK)..."
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-fintech-500 focus:bg-white"
          />
        </form>

        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="w-full md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="ALL">All Entities</option>
          <option value="transaction">Transactions</option>
          <option value="expense">Expenses</option>
          <option value="budget">Budgets</option>
          <option value="risk_alert">Risk Alerts</option>
          <option value="approval">Approvals</option>
          <option value="copilot">Copilot Queries</option>
          <option value="settings">Settings</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={6} height="h-12" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit events found"
            description="Clear filters or trigger a ledger action to generate log entries."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Agent</th>
                  <th className="py-3.5 px-4">Change Value</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono">
                {logs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">
                        {log.user}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600">
                        {log.entity} <span className="text-slate-400">({log.entity_id})</span>
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-500">
                        {log.ai_agent}
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {log.new_value ? (
                          <span className="text-emerald-700 font-bold">{log.new_value}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-500 max-w-xs truncate" title={log.details}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
