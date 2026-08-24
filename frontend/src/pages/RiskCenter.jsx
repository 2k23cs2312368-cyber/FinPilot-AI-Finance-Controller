import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  XCircle,
  FileCheck,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton, EmptyState } from '../components/common/Feedback';

export function RiskCenter({ addToast, onNavigate }) {
  const [risks, setRisks] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, CRITICAL, HIGH, MEDIUM, RESOLVED
  const [loading, setLoading] = useState(true);

  // Resolve Modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadRisks = async () => {
    try {
      setLoading(true);
      const res = await api.getRisks();
      setRisks(res);
    } catch (err) {
      addToast(err.message || 'Failed to load risk alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, []);

  const handleOpenResolve = (risk) => {
    setSelectedRisk(risk);
    setResolutionStatus('RESOLVED');
    setResolutionNotes('');
    setIsResolveModalOpen(true);
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!selectedRisk) return;

    try {
      setResolving(true);
      await api.resolveRisk(selectedRisk.id, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes || 'Reviewed and closed by Finance Controller.'
      });
      addToast(`Risk alert ${selectedRisk.id} marked as ${resolutionStatus}`, 'success');
      setIsResolveModalOpen(false);
      loadRisks();
    } catch (err) {
      addToast(err.message || 'Failed to resolve risk', 'error');
    } finally {
      setResolving(false);
    }
  };

  const handleEscalate = async (risk) => {
    try {
      await api.escalateRisk(risk.id);
      addToast(`Risk ${risk.id} escalated to Approval Center for human sign-off!`, 'success');
      loadRisks();
    } catch (err) {
      addToast(err.message || 'Failed to escalate risk', 'error');
    }
  };

  const filteredRisks = risks.filter((r) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'RESOLVED') return r.status === 'RESOLVED' || r.status === 'DISMISSED';
    return r.severity === activeTab && r.status === 'OPEN';
  });

  const criticalCount = risks.filter((r) => r.severity === 'CRITICAL' && r.status === 'OPEN').length;
  const highCount = risks.filter((r) => r.severity === 'HIGH' && r.status === 'OPEN').length;
  const mediumCount = risks.filter((r) => r.severity === 'MEDIUM' && r.status === 'OPEN').length;
  const resolvedCount = risks.filter((r) => r.status === 'RESOLVED' || r.status === 'DISMISSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Risk & Anomaly Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous threat detection across transaction spikes, mandate failures, and liquidity risks.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('approvals')}
          className="text-xs font-bold text-fintech-700 border-fintech-300 hover:bg-fintech-50"
        >
          View Approval Queue
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Alerts ({risks.length})
        </button>

        <button
          onClick={() => setActiveTab('CRITICAL')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === 'CRITICAL' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <span>Critical</span>
          {criticalCount > 0 && <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">{criticalCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab('HIGH')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === 'HIGH' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <span>High</span>
          {highCount > 0 && <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">{highCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab('MEDIUM')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'MEDIUM' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          Medium ({mediumCount})
        </button>

        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            activeTab === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Risk Cards List */}
      {loading ? (
        <LoadingSkeleton count={3} height="h-40" />
      ) : filteredRisks.length === 0 ? (
        <EmptyState
          title="No risk alerts in this category"
          description="All flagged financial anomalies have been reviewed or resolved."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRisks.map((risk) => {
            const signals = risk.signals ? JSON.parse(risk.signals) : [];
            const isResolved = risk.status === 'RESOLVED' || risk.status === 'DISMISSED';

            return (
              <div
                key={risk.id}
                className={`bg-white rounded-2xl p-5 border shadow-card flex flex-col justify-between transition-all ${
                  risk.severity === 'CRITICAL' && !isResolved
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{risk.id}</span>
                      <StatusBadge status={risk.status} />
                    </div>
                    <RiskBadge score={risk.risk_score} level={risk.severity} />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">{risk.risk_type}</h3>
                  <p className="text-xs text-slate-700 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                    {risk.reason}
                  </p>

                  {/* Signals List */}
                  {signals.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {signals.map((sig, sIdx) => (
                        <div key={sIdx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Recommended Action</span>
                    <span className="font-bold text-fintech-700">{risk.recommended_action}</span>
                  </div>

                  {!isResolved ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenResolve(risk)}
                        className="text-xs"
                      >
                        Resolve / Dismiss
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEscalate(risk)}
                        icon={Send}
                        className="text-xs font-semibold text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                      >
                        Escalate
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Risk Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Resolve Risk Alert: ${selectedRisk?.id}`}
        subtitle="Resolution details are permanently recorded in the audit trail."
      >
        <form onSubmit={handleSaveResolution} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Resolution Outcome</label>
            <select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              <option value="RESOLVED">RESOLVED (Verified & Mitigated)</option>
              <option value="DISMISSED">DISMISSED (False Positive / Accepted Risk)</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW (Active Investigation)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Resolution Notes / Reason</label>
            <textarea
              rows="3"
              required
              placeholder="e.g. Verified customer KYC contract and approved SLA adjustment credit note #882."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-fintech-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={resolving}>
              Save Decision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
