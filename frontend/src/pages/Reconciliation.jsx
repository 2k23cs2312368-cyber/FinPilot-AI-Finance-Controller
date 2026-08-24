import React, { useState, useEffect } from 'react';
import {
  Scale,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Send,
  Building2,
  ArrowRight,
  Filter,
  Layers,
  ArrowLeftRight,
  FileSpreadsheet,
  Clock,
  Zap,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton, EmptyState } from '../components/common/Feedback';

const EXCEPTION_TYPES = [
  'AMOUNT_MISMATCH',
  'TIMING_DIFFERENCE',
  'MISSING_IN_LEDGER',
  'MISSING_IN_BANK',
  'STATUS_MISMATCH',
  'DUPLICATE_SETTLEMENT'
];

export function Reconciliation({ addToast, onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningBatch, setRunningBatch] = useState(false);
  const [viewMode, setViewMode] = useState('exceptions'); // 'exceptions' or 'sources'

  // Filter
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Resolve Modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedException, setSelectedException] = useState(null);
  const [resolveAction, setResolveAction] = useState('AUTO_MATCH');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ovData, expData, srcData] = await Promise.all([
        api.getReconciliationOverview(),
        api.getReconciliationExceptions({ exception_type: typeFilter, severity: severityFilter }),
        api.getReconciliationSources(15)
      ]);
      setOverview(ovData);
      setExceptions(expData);
      setSources(srcData);
    } catch (err) {
      addToast(err.message || 'Failed to load reconciliation data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, severityFilter]);

  const handleRunReconcileBatch = async () => {
    try {
      setRunningBatch(true);
      const res = await api.runReconciliation();
      addToast(res.message || 'Reconciliation batch completed!', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Reconciliation run failed', 'error');
    } finally {
      setRunningBatch(false);
    }
  };

  const handleOpenResolve = (exp) => {
    setSelectedException(exp);
    setResolveAction(
      exp.exception_type === 'AMOUNT_MISMATCH'
        ? 'AUTO_MATCH'
        : exp.exception_type === 'MISSING_IN_LEDGER'
        ? 'MANUAL_RECONCILE'
        : 'AUTO_MATCH'
    );
    setResolveNotes(
      exp.exception_type === 'AMOUNT_MISMATCH'
        ? 'Applied MDR fee adjustment (₹1,000 fee + ₹180 GST) to balance ledger with net settlement.'
        : 'Reviewed transaction trace and applied controller reconciliation clearance.'
    );
    setIsResolveModalOpen(true);
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!selectedException) return;

    try {
      setResolving(true);
      await api.resolveReconciliationException(selectedException.id, resolveAction, resolveNotes);
      addToast(`Exception ${selectedException.id} resolved via ${resolveAction}!`, 'success');
      setIsResolveModalOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to resolve exception', 'error');
    } finally {
      setResolving(false);
    }
  };

  const handleEscalateToApproval = async (exp) => {
    try {
      await api.escalateReconciliationException(exp.id);
      addToast(`Discrepancy ${exp.id} escalated to Approval Center for controller sign-off!`, 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to escalate exception', 'error');
    }
  };

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={4} height="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Multi-Source Reconciliation Agent</h2>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">
              Agent 6 • 3-Way Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated multi-source matching across Internal ERP Ledger, Razorpay Settlements, and HDFC Bank Statement feeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunReconcileBatch}
            loading={runningBatch}
            icon={RefreshCw}
            className="text-xs font-bold"
          >
            {runningBatch ? 'Reconciling 3-Way Feeds...' : 'Run Auto-Reconcile Batch'}
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Measurable Match Rate"
            formattedValue={overview.formatted_match_rate}
            pctChange={overview.match_rate_pct >= 90 ? 2.4 : -1.2}
            status={overview.match_rate_pct >= 90 ? "good" : "warning"}
            subtitle="3-way volume synchronized"
            icon={Scale}
          />
          <StatCard
            title="Total Reconciled Volume"
            formattedValue={overview.formatted_reconciled_volume}
            pctChange={14.8}
            status="good"
            subtitle={`Processed: ${overview.formatted_total_volume}`}
            icon={ShieldCheck}
          />
          <StatCard
            title="Discrepancy Volume"
            formattedValue={overview.formatted_discrepancy_volume}
            pctChange={-8.5}
            status={overview.total_discrepancy_volume > 50000 ? "danger" : "warning"}
            subtitle={`${overview.unresolved_exceptions_count} active exceptions`}
            icon={AlertTriangle}
          />
          <StatCard
            title="Source Pipeline Status"
            formattedValue="3 Feeds Synced"
            pctChange={0}
            status="good"
            subtitle={`Batch: ${overview.latest_batch_id}`}
            icon={Layers}
          />
        </div>
      )}

      {/* AI Reconciliation Assessment Banner */}
      {overview && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900/60 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Multi-Source Reconciliation Agent • Diagnostic Synthesis</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Last Run: {overview.latest_batch_time}</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {overview.ai_reconciliation_assessment}
          </p>
        </div>
      )}

      {/* 3-Way Visual Matching Pipeline */}
      {overview && overview.three_way_source_summary && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            3-Way Financial Source Synchronization Pipeline
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* Source 1: ERP Ledger */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-800">Source 1: Internal Ledger</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">ERP DB</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {overview.three_way_source_summary.ledger.formatted_volume}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {overview.three_way_source_summary.ledger.total_records} Successful Transactions
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Primary Order Master
              </div>
            </div>

            {/* Source 2: Gateway Settlement */}
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-indigo-950">Source 2: Razorpay Gateway</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Settlements</span>
                </div>
                <div className="text-lg font-black text-indigo-950">
                  {overview.three_way_source_summary.gateway.formatted_volume}
                </div>
                <div className="text-[11px] text-indigo-700 mt-1">
                  Net Payout after ₹{overview.three_way_source_summary.gateway.fees_and_taxes.toLocaleString('en-IN')} MDR/GST
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-200 text-[11px] text-indigo-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Batch Payouts Verified
              </div>
            </div>

            {/* Source 3: Bank Feed */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-emerald-950">Source 3: HDFC Bank Feed</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Core Banking</span>
                </div>
                <div className="text-lg font-black text-emerald-950">
                  {overview.three_way_source_summary.bank.formatted_volume}
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">
                  Total ACH & Wire Credits Cleared
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200 text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> UTR Matched to Statement
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selector & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('exceptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'exceptions' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Exception Queue ({exceptions.length})
          </button>
          <button
            onClick={() => setViewMode('sources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'sources' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Source Feeds Explorer (3-Way)
          </button>
        </div>

        {viewMode === 'exceptions' && (
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Exception Type: All</option>
              {EXCEPTION_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Severity: All</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: Exception Queue */}
      {viewMode === 'exceptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          {exceptions.length === 0 ? (
            <EmptyState
              title="All 3-way transactions reconciled!"
              description="There are zero open exceptions. The ledger, gateway batches, and bank statements match perfectly."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Exception ID</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Severity</th>
                    <th className="py-3.5 px-4">Ledger (₹)</th>
                    <th className="py-3.5 px-4">Gateway (₹)</th>
                    <th className="py-3.5 px-4">Bank (₹)</th>
                    <th className="py-3.5 px-4">Variance (₹)</th>
                    <th className="py-3.5 px-4">AI Diagnostic & Root Cause</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {exceptions.map((exp) => {
                    const isUnresolved = exp.status === 'UNRESOLVED';

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-fintech-700 whitespace-nowrap">
                          {exp.id}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {exp.exception_type.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={exp.severity} />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                          {exp.ledger_amount > 0 ? `₹${exp.ledger_amount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-indigo-800 whitespace-nowrap">
                          {exp.gateway_amount > 0 ? `₹${exp.gateway_amount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800 whitespace-nowrap">
                          {exp.bank_amount > 0 ? `₹${exp.bank_amount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600 whitespace-nowrap">
                          ₹{exp.discrepancy_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                          <p className="line-clamp-2 text-[11px] leading-relaxed" title={exp.ai_diagnosis}>
                            {exp.ai_diagnosis}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={exp.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isUnresolved ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenResolve(exp)}
                                className="text-xs font-semibold"
                              >
                                Resolve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEscalateToApproval(exp)}
                                icon={Send}
                                className="text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                              >
                                Escalate
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-700 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: Source Feeds Explorer */}
      {viewMode === 'sources' && sources && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Source 1: ERP Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase">1. Internal ERP Ledger</h3>
              <span className="text-[10px] text-slate-400">Transactions</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {sources.ledger_records.slice(0, 10).map((t) => (
                <div key={t.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-mono font-bold text-slate-800">{t.id}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{t.customer_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900">₹{t.amount.toLocaleString('en-IN')}</div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source 2: Gateway Settlements */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-indigo-950 uppercase">2. Razorpay Settlements</h3>
              <span className="text-[10px] text-indigo-400">Gateway Feed</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {sources.gateway_records.slice(0, 10).map((g) => (
                <div key={g.id} className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-mono font-bold text-indigo-900">{g.id}</div>
                    <div className="text-[10px] text-indigo-500">Gross: ₹{g.gross_amount.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-indigo-950">₹{g.net_settlement.toLocaleString('en-IN')}</div>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded font-semibold">
                      Fee: ₹{g.fee_deducted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source 3: Bank Statement Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-emerald-950 uppercase">3. HDFC Statement Feed</h3>
              <span className="text-[10px] text-emerald-500">Core Banking</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {sources.bank_records.slice(0, 10).map((b) => (
                <div key={b.id} className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-mono font-bold text-emerald-900">{b.id}</div>
                    <div className="text-[10px] text-emerald-600 truncate max-w-[130px]">{b.utr_reference || b.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-emerald-950">₹{b.credit_amount.toLocaleString('en-IN')}</div>
                    <span className="text-[10px] text-emerald-700 font-semibold">Credit</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exception Resolution Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Resolve Discrepancy: ${selectedException?.id}`}
        subtitle={`Type: ${selectedException?.exception_type.replace(/_/g, ' ')} (Variance: ₹${selectedException?.discrepancy_amount.toLocaleString('en-IN')})`}
        maxWidth="max-w-xl"
      >
        {selectedException && (
          <form onSubmit={handleSaveResolution} className="space-y-4 text-xs">
            {/* 3-Way Values Matrix */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Ledger</span>
                <span className="font-bold text-slate-900">
                  {selectedException.ledger_amount > 0 ? `₹${selectedException.ledger_amount.toLocaleString('en-IN')}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Gateway</span>
                <span className="font-bold text-indigo-900">
                  {selectedException.gateway_amount > 0 ? `₹${selectedException.gateway_amount.toLocaleString('en-IN')}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Bank</span>
                <span className="font-bold text-emerald-900">
                  {selectedException.bank_amount > 0 ? `₹${selectedException.bank_amount.toLocaleString('en-IN')}` : '—'}
                </span>
              </div>
            </div>

            {/* AI Diagnosis Reason */}
            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-slate-800">
              <span className="font-bold text-indigo-900 uppercase text-[10px] block mb-1">
                AI Root Cause Diagnostic
              </span>
              <p className="leading-relaxed font-medium">{selectedException.ai_diagnosis}</p>
            </div>

            {/* Resolution Action */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Resolution Action</label>
              <select
                value={resolveAction}
                onChange={(e) => setResolveAction(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                <option value="AUTO_MATCH">AUTO_MATCH (Apply MDR fee adjustment / net match)</option>
                <option value="ADJUST_FEE">ADJUST_FEE (Post gateway processing fee to expenses)</option>
                <option value="MANUAL_RECONCILE">MANUAL_RECONCILE (Confirm manual bank UTR clearance)</option>
                <option value="DISMISS">DISMISS (Accepted tolerance variance)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Resolution Audit Note</label>
              <textarea
                rows="2"
                required
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-fintech-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setIsResolveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={resolving}>
                Apply Resolution
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
