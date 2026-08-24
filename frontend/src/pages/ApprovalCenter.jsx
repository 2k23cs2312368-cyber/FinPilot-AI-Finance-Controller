import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  Sparkles,
  ShieldAlert,
  Bot
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton, EmptyState } from '../components/common/Feedback';

export function ApprovalCenter({ addToast }) {
  const [approvals, setApprovals] = useState([]);
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [decisionType, setDecisionType] = useState('APPROVED');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.getApprovals(decisionFilter);
      setApprovals(res);
    } catch (err) {
      addToast(err.message || 'Failed to load approvals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [decisionFilter]);

  const handleOpenDecision = (appr, type) => {
    setSelectedApproval(appr);
    setDecisionType(type);
    setDecisionNotes(
      type === 'APPROVED'
        ? 'Approved by Lead Finance Controller after anomaly review.'
        : type === 'REJECTED'
        ? 'Rejected by Finance Controller due to insufficient documentation.'
        : 'Additional review requested from department lead.'
    );
    setIsDecisionModalOpen(true);
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!selectedApproval) return;

    try {
      setProcessing(true);
      await api.decideApproval(selectedApproval.id, decisionType, decisionNotes);
      addToast(`Action ${decisionType} processed for ticket ${selectedApproval.id}!`, 'success');
      setIsDecisionModalOpen(false);
      loadApprovals();
    } catch (err) {
      addToast(err.message || 'Failed to process decision', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = approvals.filter((a) => a.decision === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Human-in-the-Loop Approval Center</h2>
            {pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Governance checkpoint: High-impact AI financial recommendations require explicit human sign-off.
          </p>
        </div>

        {/* Filter */}
        <select
          value={decisionFilter}
          onChange={(e) => setDecisionFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="ALL">All Decisions</option>
          <option value="PENDING">Pending Action</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Approvals List */}
      {loading ? (
        <LoadingSkeleton count={3} height="h-36" />
      ) : approvals.length === 0 ? (
        <EmptyState
          title="No approval tickets found"
          description="All AI recommendation tickets have been processed."
        />
      ) : (
        <div className="space-y-4">
          {approvals.map((appr) => {
            const isPending = appr.decision === 'PENDING';
            const dateStr = new Date(appr.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={appr.id}
                className={`bg-white rounded-2xl p-5 border shadow-card transition-all ${
                  isPending ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500">{appr.id}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                        Agent: {appr.ai_agent}
                      </span>
                      <RiskBadge level={appr.risk_level} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{appr.title}</h3>
                  </div>

                  <StatusBadge status={appr.decision} />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1 mb-4">
                  <div className="text-slate-700 font-medium leading-relaxed">
                    <span className="font-bold text-slate-900 block text-[10px] uppercase text-slate-400 mb-0.5">
                      AI Reasoning & Risk Trigger
                    </span>
                    {appr.reason}
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-600">Proposed Action:</span>
                    <span className="font-mono font-bold text-indigo-700">{appr.proposed_action}</span>
                  </div>
                </div>

                {/* Footer Decisions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-slate-400 text-[11px]">
                    Created: {dateStr}
                    {appr.decision_by && (
                      <span className="ml-2 text-slate-600 font-medium">
                        • Decided by: <strong>{appr.decision_by}</strong>
                      </span>
                    )}
                  </div>

                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenDecision(appr, 'REVIEW_REQUESTED')}
                        className="text-xs"
                      >
                        Request Review
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenDecision(appr, 'REJECTED')}
                        icon={XCircle}
                        className="text-xs"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleOpenDecision(appr, 'APPROVED')}
                        icon={CheckCircle}
                        className="text-xs font-bold"
                      >
                        Approve Action
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      Notes: {appr.decision_notes || 'Decision recorded'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title={`Confirm Decision: ${decisionType}`}
        subtitle={`Action for Approval Ticket: ${selectedApproval?.id}`}
      >
        <form onSubmit={handleSubmitDecision} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Decision Note / Audit Reason</label>
            <textarea
              rows="3"
              required
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-fintech-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setIsDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={decisionType === 'APPROVED' ? 'success' : decisionType === 'REJECTED' ? 'danger' : 'primary'}
              size="sm"
              type="submit"
              loading={processing}
            >
              Confirm {decisionType}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
